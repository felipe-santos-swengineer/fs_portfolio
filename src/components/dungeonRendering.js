import * as THREE from 'three';

// Combine identical, immobile box meshes while preserving transforms and colors.
export function batchStaticBoxes(scene) {
  const groups = new Map();
  for (const object of [...scene.children]) {
    if (!object.isMesh || object.geometry.type !== 'BoxGeometry' || Array.isArray(object.material)) continue;
    const { width, height, depth } = object.geometry.parameters;
    const material = object.material;
    const key = [width, height, depth, material.color.getHex(), material.emissive.getHex(), material.emissiveIntensity].join(':');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(object);
  }
  let combined = 0;
  for (const objects of groups.values()) {
    if (objects.length < 2) continue;
    const first = objects[0];
    const batch = new THREE.InstancedMesh(first.geometry, first.material, objects.length);
    objects.forEach((object, i) => {
      object.updateMatrix();
      batch.setMatrixAt(i, object.matrix);
      scene.remove(object);
      if (i) { object.geometry.dispose(); object.material.dispose(); }
    });
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
    scene.add(batch);
    combined += objects.length - 1;
  }
  return combined;
}
