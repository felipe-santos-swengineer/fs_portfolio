import * as THREE from 'three';

const duration = 56;
const types = ['clear', 'rain', 'snow'];
const smooth = value => { const x = THREE.MathUtils.clamp(value, 0, 1); return x * x * (3 - 2 * x); };

export function weatherAt(seconds, mode = 'auto') {
  if (types.includes(mode)) return { type: mode, strength: mode === 'clear' ? 0 : 1 };
  const time = ((seconds % (duration * types.length)) + duration * types.length) % (duration * types.length);
  const type = types[Math.floor(time / duration)];
  const phase = time % duration;
  const strength = type === 'clear' ? 0 : Math.min(smooth(phase / 10), smooth((duration - phase) / 10));
  return { type, strength };
}

export function createVillageWeather(scene) {
  const makeParticles = (count, rain) => {
    const data = new Float32Array(count * (rain ? 6 : 3));
    // Use independent, repeatable coordinates so precipitation fills the volume.
    const hash = (i, salt) => { const value = Math.sin((i + 1) * salt) * 43758.5453; return value - Math.floor(value); };
    const seeds = Array.from({ length: count }, (_, i) => ({ x: (hash(i, 12.9898) - .5) * 64, z: (hash(i, 78.233) - .5) * 64, y: hash(i, 43.758) * 30, speed: (rain ? 14 : 1.8) + hash(i, 23.137) * (rain ? 5 : .8) }));
    const geometry = new THREE.BufferGeometry();
    const positions = new THREE.BufferAttribute(data, 3); positions.setUsage(THREE.DynamicDrawUsage); geometry.setAttribute('position', positions);
    const material = rain ? new THREE.LineBasicMaterial({ color: '#bad8e4', transparent: true, opacity: 0, depthWrite: false }) : new THREE.PointsMaterial({ color: '#f0f8ff', size: .3, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true });
    const object = rain ? new THREE.LineSegments(geometry, material) : new THREE.Points(geometry, material);
    object.frustumCulled = false; object.visible = false; object.name = rain ? 'Chuva da vila' : 'Neve da vila'; scene.add(object);
    return { object, positions, seeds, rain };
  };
  const rain = makeParticles(800, true), snow = makeParticles(600, false);
  function updateParticles(particles, seconds, strength, player) {
    const { object, positions, seeds, rain: isRain } = particles;
    object.visible = strength > .005; object.material.opacity = strength * (isRain ? .65 : .95);
    if (!object.visible) return;
    // Keep particles fixed in world space; recycle only when they leave the surrounding area.
    const wrap = (value, center) => value - Math.floor((value - center + 32) / 64) * 64;
    seeds.forEach((seed, i) => {
      const x = wrap(seed.x, player.x), z = wrap(seed.z, player.z);
      const y = ((seed.y - seconds * seed.speed) % 30 + 30) % 30 + .3;
      const sway = Math.sin(seconds * (isRain ? .45 : .8) + i * .7) * (isRain ? .3 : .65);
      if (isRain) { positions.setXYZ(i * 2, x + sway, y, z); positions.setXYZ(i * 2 + 1, x + sway - .24, y + 1.05, z); }
      else positions.setXYZ(i, x + sway, y, z);
    });
    positions.needsUpdate = true;
  }
  return {
    rain: rain.object, snow: snow.object,
    update(seconds, player, enabled = true, mode = 'auto') {
      const state = enabled ? weatherAt(seconds, mode) : { type: 'clear', strength: 0 };
      updateParticles(rain, seconds, state.type === 'rain' ? state.strength : 0, player);
      updateParticles(snow, seconds, state.type === 'snow' ? state.strength : 0, player);
      return state;
    },
  };
}
