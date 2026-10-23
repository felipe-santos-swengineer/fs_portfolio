import * as THREE from 'three';

// One small, reusable particle buffer for all four villagers.
export function createMissionFireworks(scene, onSound = () => {}) {
  const particlesPerNpc = 49, capacity = particlesPerNpc * 4;
  const positions = new Float32Array(capacity * 3), colors = new Float32Array(capacity * 3);
  const palette = ['#8bc8ff', '#ffcb7d', '#a0f0bc', '#f4a5cf'].map(c => new THREE.Color(c));
  for (let i = 0; i < capacity; i++) palette[Math.floor(i / particlesPerNpc)].toArray(colors, i * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const pixels = new Uint8Array(16 * 16 * 4);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const offset = (y * 16 + x) * 4, radius = Math.hypot(x - 7.5, y - 7.5) / 7.5;
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
    pixels[offset + 3] = Math.max(0, 1 - radius) ** 1.5 * 255;
  }
  const texture = new THREE.DataTexture(pixels, 16, 16); texture.needsUpdate = true;
  const material = new THREE.PointsMaterial({ size: .25, map: texture, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
  const points = new THREE.Points(geometry, material); points.frustumCulled = false; points.visible = false; scene.add(points);
  let origins = [], elapsed = 0, active = false, reduced = false;
  const launches = new Set(), bursts = new Set();
  const effect = {
    points,
    get active() { return active; },
    get elapsed() { return elapsed; },
    stop() { active = false; elapsed = 0; points.visible = false; launches.clear(); bursts.clear(); },
    start(npcs, reducedMotion = false) {
      effect.stop();
      origins = npcs.slice(0, 4).map(npc => ({ x: npc.x, y: npc.y, z: npc.z }));
      elapsed = 0; active = origins.length > 0; reduced = reducedMotion; points.visible = active;
      geometry.setDrawRange(0, origins.length * particlesPerNpc); effect.update(0);
    },
    update(dt) {
      if (!active) return;
      elapsed += dt;
      const duration = reduced ? 1.8 : 3.4;
      if (elapsed >= duration) { active = false; points.visible = false; return; }
      material.opacity = Math.min(1, Math.max(0, (duration - elapsed) / .9));
      origins.forEach((origin, npc) => {
        const age = elapsed - npc * .16, rocketTime = .65, burst = age - rocketTime;
        const height = 8.5 + npc * .6;
        if (age >= 0 && !launches.has(npc)) { launches.add(npc); onSound('launch', npc); }
        if (age >= rocketTime && !bursts.has(npc)) { bursts.add(npc); onSound('burst', npc); }
        for (let i = 0; i < particlesPerNpc; i++) {
          const offset = (npc * particlesPerNpc + i) * 3;
          let x = origin.x, y = -1000, z = origin.z;
          if (reduced) {
            if (i < 7) { const angle = i / 7 * Math.PI * 2; x += Math.cos(angle) * .7; y = origin.y + 3.4 + Math.sin(angle) * .7; }
          } else if (age >= 0 && age < rocketTime && i === 0) {
            y = origin.y + 1.7 + height * (age / rocketTime);
          } else if (burst >= 0 && i > 0) {
            const a = i * 2.39996, vertical = 1 - 2 * (i - .5) / 48, radius = Math.sqrt(Math.max(0, 1 - vertical * vertical));
            const expansion = 3.7 * burst / (1 + burst * .7);
            x += Math.cos(a) * radius * expansion;
            y = origin.y + 1.7 + height + vertical * expansion - 1.3 * burst * burst;
            z += Math.sin(a) * radius * expansion;
          }
          positions[offset] = x; positions[offset + 1] = y; positions[offset + 2] = z;
        }
      });
      geometry.attributes.position.needsUpdate = true;
    },
  };
  return effect;
}
