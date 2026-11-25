import * as THREE from 'three';

// Shared faceted boulder: the same irregular geometry used by the rapids banks.
export function createRiverRockGeometry() {
  const rock = new THREE.IcosahedronGeometry(1, 1);
  const points = rock.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
    const ripple = 1 + .17 * Math.sin(x * 8 + z * 4) + .11 * Math.cos(y * 7 - x * 3);
    points.setXYZ(i, x * ripple + .17 * y, y * ripple, z * ripple);
  }
  rock.computeVertexNormals();
  return rock;
}

export const RIVER_ROCK_COLORS = ['#374151', '#52606b', '#64748b', '#555952'];
export const RIVER_STRATA = ['#374151', '#555c54', '#696650', '#536260', '#64748b', '#526b3f', '#3a543a', '#4e604a', '#5f6c65'];
export const RIVER_GREENS = ['#264d32', '#35563b', '#526b3f', '#697a4f'];

export function createRiverRockMaterial(roughness = .69) {
  return new THREE.MeshStandardMaterial({ color: '#ffffff', roughness, flatShading: true });
}
