import * as THREE from 'three';
import { daylightAt, dragonPoseAt, createDragon, createDayNight } from './VillageAtmosphere';

test('o ciclo passa por noite, amanhecer, dia e entardecer e se repete sem salto', () => {
  expect(daylightAt(0).label).toBe('NOITE');
  expect(daylightAt(27).label).toBe('AMANHECER');
  expect(daylightAt(72).label).toBe('DIA');
  expect(daylightAt(117).label).toBe('ENTARDECER');
  expect(daylightAt(0).daylight).toBe(daylightAt(180).daylight);
  for (let t = 0; t < 180; t += .5) {
    const next = daylightAt(t + .5);
    expect(Math.abs(next.daylight - daylightAt(t).daylight)).toBeLessThan(.06);
    expect(next.daylight).toBeGreaterThanOrEqual(0); expect(next.daylight).toBeLessThanOrEqual(1);
  }
});

test('o dragão pousa em três casas diferentes e mantém uma trajetória contínua', () => {
  const sites = new Set();
  for (let cycle = 0; cycle < 3; cycle++) {
    const landed = dragonPoseAt(cycle * 72 + 46);
    expect(landed.perched).toBe(true); expect(landed.y).toBeCloseTo(5.78); expect(landed.fold).toBe(1); sites.add(landed.site);
    expect(dragonPoseAt(cycle * 72 + 65).perched).toBe(false);
  }
  expect(sites.size).toBe(3);
  for (const boundary of [35, 43, 55, 63, 72, 107, 115, 127, 135, 144]) {
    const a = dragonPoseAt(boundary - .001), b = dragonPoseAt(boundary + .001);
    expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)).toBeLessThan(.02);
  }
});

test('a cena ajusta iluminação e estrelas e mantém o dragão estático com movimento reduzido', () => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(); scene.fog = new THREE.FogExp2('#000000', .009);
  const hemi = new THREE.HemisphereLight(), key = new THREE.DirectionalLight(), lamp = new THREE.PointLight('#ffcc88', 10); scene.add(hemi, key, lamp);
  const world = { fireflies: { material: { opacity: .65 } } };
  const environment = createDayNight(scene, hemi, key, world), dragon = createDragon(scene);
  environment.update(0); const nightLamp = lamp.intensity; const nightSky = scene.background.clone();
  expect(environment.stars.visible).toBe(true);
  environment.update(72);
  expect(lamp.intensity).toBeLessThan(nightLamp); expect(environment.stars.visible).toBe(false);
  expect(scene.background.equals(nightSky)).toBe(false);
  const position = dragon.update(0, .016, true); const later = dragon.update(120, .016, true);
  expect(position).toEqual(later); expect(later.perched).toBe(true);
  scene.traverse(object => { if (object.geometry) { object.geometry.computeBoundingBox(); expect([...object.geometry.boundingBox.min.toArray(), ...object.geometry.boundingBox.max.toArray()].every(Number.isFinite)).toBe(true); object.geometry.dispose(); } });
});
