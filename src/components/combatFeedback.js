import * as THREE from 'three';

export function groundDangerGeometry(radius, segments = 24, start = 0, arc = Math.PI * 2) {
  const geometry = new THREE.CircleGeometry(radius, segments, start, arc);
  geometry.rotateX(-Math.PI / 2);
  const pool = new THREE.MeshBasicMaterial({ color: '#e31524', transparent: true, opacity: .72, depthWrite: false });
  const outlineGeometry = new THREE.RingGeometry(radius - .07, radius, segments, 1, start, arc);
  outlineGeometry.rotateX(-Math.PI / 2);
  const outline = new THREE.MeshBasicMaterial({ color: '#ff7062', transparent: true, opacity: .94, depthWrite: false });
  return { geometry, pool, outlineGeometry, outline };
}

export function attachCombatFlash(character, duration, materialAt) {
  const meshes = [];
  character.traverse(object => {
    if (object.isMesh) meshes.push({ object, original: object.material });
  });
  let remaining = 0;
  let applied = null;
  function apply(material) {
    if (applied === material) return;
    applied = material;
    for (const { object, original } of meshes) object.material = material ?? original;
  }
  return {
    trigger() { remaining = duration; },
    update(dt, reduced) {
      if (remaining <= 0) return;
      apply(materialAt(duration - remaining, reduced));
      remaining = Math.max(0, remaining - dt);
      if (remaining === 0) apply(null);
    },
    reset() {
      remaining = 0;
      apply(null);
    },
  };
}
