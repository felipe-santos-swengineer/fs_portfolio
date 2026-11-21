import * as THREE from 'three';
import { weatherAt, createVillageWeather } from './VillageWeather';

test('o ciclo alterna clima limpo, chuva e neve com transicoes suaves', () => {
  expect(weatherAt(20)).toEqual({ type: 'clear', strength: 0 });
  expect(weatherAt(56 + 25)).toEqual({ type: 'rain', strength: 1 });
  expect(weatherAt(112 + 25)).toEqual({ type: 'snow', strength: 1 });
  for (let t = 0; t < 168; t += .25) expect(Math.abs(weatherAt(t + .25).strength - weatherAt(t).strength)).toBeLessThan(.05);
  expect(weatherAt(20 + 168)).toEqual(weatherAt(20));
});

test('chuva e neve aparecem perto do personagem e podem ser desativadas', () => {
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#778899', .006);
  const weather = createVillageWeather(scene);
  weather.update(81, { x: 7, z: -3 });
  expect(weather.rain.visible).toBe(true); expect(weather.snow.visible).toBe(false);
  expect(weather.rain.position.x).toBe(0); expect(weather.rain.position.z).toBe(0);
  const positions = weather.rain.geometry.attributes.position;
  const before = Array.from(positions.array);
  weather.update(81, { x: 8, z: -3 });
  let unchanged = 0;
  for (let i = 0; i < positions.count; i += 2) {
    if (Math.abs(before[i * 3] - positions.getX(i)) < .0001 && Math.abs(before[i * 3 + 2] - positions.getZ(i)) < .0001) unchanged++;
  }
  expect(unchanged).toBeGreaterThan(700);
  weather.update(137, { x: 0, z: 0 });
  expect(weather.rain.visible).toBe(false); expect(weather.snow.visible).toBe(true);
  weather.update(137, { x: 0, z: 0 }, false);
  expect(weather.snow.visible).toBe(false);
  for (const part of [weather.rain, weather.snow]) { part.geometry.dispose(); part.material.dispose(); }
});


test('a escolha manual prevalece sobre o ciclo e automatico volta a segui-lo', () => {
  expect(weatherAt(20, 'snow')).toEqual({ type: 'snow', strength: 1 });
  expect(weatherAt(193, 'rain')).toEqual({ type: 'rain', strength: 1 });
  expect(weatherAt(81, 'clear')).toEqual({ type: 'clear', strength: 0 });
  expect(weatherAt(81, 'auto')).toEqual({ type: 'rain', strength: 1 });
});


test('as particulas permanecem distribuidas na cena mesmo apos muito tempo', () => {
  const scene = new THREE.Scene();
  const weather = createVillageWeather(scene);
  for (const time of [0, 1000]) {
    weather.update(time, { x: 0, z: 0 }, true, 'rain');
    const positions = weather.rain.geometry.attributes.position;
    const xs = [], zs = [];
    for (let i = 0; i < positions.count; i += 2) { xs.push(positions.getX(i)); zs.push(positions.getZ(i)); }
    expect(Math.min(...xs)).toBeLessThan(-25); expect(Math.max(...xs)).toBeGreaterThan(25);
    expect(Math.min(...zs)).toBeLessThan(-25); expect(Math.max(...zs)).toBeGreaterThan(25);
    expect(xs.every(x => Math.abs(x) < 33)).toBe(true);
  }
  for (const part of [weather.rain, weather.snow]) { part.geometry.dispose(); part.material.dispose(); }
});


test('particulas que saem da area sao renovadas nas bordas', () => {
  const scene = new THREE.Scene(); const weather = createVillageWeather(scene);
  weather.update(10, { x: 0, z: 0 }, true, 'snow');
  const positions = weather.snow.geometry.attributes.position;
  const before = Array.from(positions.array);
  weather.update(10, { x: 20, z: 0 }, true, 'snow');
  let moved = 0, unchanged = 0;
  for (let i = 0; i < positions.count; i++) {
    const dx = positions.getX(i) - before[i * 3];
    if (Math.abs(dx) < .0001) unchanged++;
    else { expect(dx).toBeCloseTo(64); moved++; }
  }
  expect(unchanged).toBeGreaterThan(0); expect(moved).toBeGreaterThan(0);
  for (const part of [weather.rain, weather.snow]) { part.geometry.dispose(); part.material.dispose(); }
});
