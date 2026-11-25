import * as THREE from 'three';
import { createRiverRockGeometry, createRiverRockMaterial, RIVER_ROCK_COLORS, RIVER_STRATA, RIVER_GREENS } from './riverRock';

// The gate aperture sits just in front of the vault, so the first ring tapers
// from the rectangular opening to the arched rock tube and seals the side gaps.
const MOUTH_OFFSET = 2.15;
const mouthDimensions = (halfWidth, height, nearZ) => ({
  z: nearZ + MOUTH_OFFSET,
  // Overlap both the gate jambs and the inner curve of the Greek arch.
  halfWidth: halfWidth * .84,
  height: height * 1.16,
});

// Successive cross-sections form a continuous rock vault above the waterline.
export function addRockVault(parent, halfWidth, height, nearZ, farZ) {
  const positions = [], colors = [];
  const rings = [], segments = 16;
  const bays = Math.ceil((nearZ - farZ) / 2.4);
  const stone = new THREE.Color();
  const mouth = mouthDimensions(halfWidth, height, nearZ);
  const makeRing = (z, width, top, base, exponent, bay, isMouth = false) => {
    const ring = [];
    for (let side = 0; side <= segments; side++) {
      const angle = Math.PI * side / segments;
      const seam = isMouth ? 0 : Math.sin(bay * 1.37 + side * .83) * .55 + Math.cos(bay * .71 - side * 1.9) * .45;
      ring.push([
        Math.cos(angle) * (width + (isMouth ? 0 : seam * .38)),
        base + Math.pow(Math.sin(angle), exponent) * (top - base + (isMouth ? 0 : seam * .5)),
        z + (isMouth ? 0 : Math.sin(side * 2.3 + bay) * .18),
      ]);
    }
    return ring;
  };
  rings.push(makeRing(mouth.z, mouth.halfWidth, mouth.height, 0, .12, 0, true));
  for (let bay = 0; bay <= bays; bay++) {
    rings.push(makeRing(
      THREE.MathUtils.lerp(nearZ, farZ, bay / bays),
      halfWidth, height, -1, .68, bay,
    ));
  }
  for (let bay = 0; bay < rings.length - 1; bay++) {
    for (let side = 0; side < segments; side++) {
      const a = rings[bay], b = rings[bay + 1];
      const light = .88 + .16 * Math.sin(bay * 1.6 + side * .78);
      const level = Math.min(RIVER_STRATA.length - 1, Math.floor(Math.pow(Math.sin((side + .5) * Math.PI / segments), .68) * 7.4));
      stone.set(RIVER_STRATA[level]).multiplyScalar(light);
      for (const point of [a[side], b[side], a[side + 1], a[side + 1], b[side], b[side + 1]]) {
        positions.push(...point);
        colors.push(stone.r, stone.g, stone.b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  parent.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, side: THREE.DoubleSide, roughness: .95,
  })));
}

// Faceted boulders from the rapids banks dress the vault into a natural cave mouth.
export function addTunnelRockwork(parent, { halfWidth, height, nearZ, farZ, teeth = 42, ribs = 3, joints = 18 }) {
  const roofY = x => -1 + Math.pow(Math.max(0, 1 - (x / halfWidth) ** 2), .34) * (height + 1);
  const mouth = mouthDimensions(halfWidth, height, nearZ);
  const sample = new THREE.Object3D();
  const tint = new THREE.Color();
  const rocks = new THREE.InstancedMesh(createRiverRockGeometry(), createRiverRockMaterial(), teeth + ribs * 9 + joints);
  let index = 0;
  const place = (x, y, z, sx, sy, sz, tilt, yaw, color) => {
    sample.position.set(x, y, z);
    sample.scale.set(sx, sy, sz);
    sample.rotation.set(tilt * .35, yaw, tilt);
    sample.updateMatrix();
    rocks.setMatrixAt(index, sample.matrix);
    rocks.setColorAt(index, tint.set(color));
    index += 1;
  };
  for (let i = 0; i < joints; i++) {
    const side = i % 2 ? 1 : -1;
    const t = Math.floor(i / 2) / Math.max(1, Math.ceil(joints / 2) - 1);
    const z = THREE.MathUtils.lerp(mouth.z - .15, nearZ + .15, t);
    const x = side * THREE.MathUtils.lerp(mouth.halfWidth + .25, halfWidth - .2, t) + Math.sin(i * 1.7) * .16;
    const y = .5 + (i % 4) * 1.75 + Math.cos(i * 2.1) * .24;
    const size = .76 + .3 * Math.abs(Math.sin(i * 1.3));
    place(x, y, z, size * .9, size * 1.35, size * .85,
      side * .12, i * .9,
      i % 5 === 0 ? RIVER_GREENS[i % RIVER_GREENS.length] : RIVER_STRATA[(i + 2) % RIVER_STRATA.length]);
  }
  for (let i = 0; i < teeth; i++) {
    const side = i % 2 ? 1 : -1;
    const z = THREE.MathUtils.lerp(nearZ, farZ, (i * .6180339) % 1);
    const layer = i % RIVER_STRATA.length;
    const size = .55 + .75 * (.5 + .5 * Math.cos(i * 1.87));
    const x = side * halfWidth * (.78 + .22 * Math.abs(Math.sin(i * 2.41)));
    const y = THREE.MathUtils.lerp(-.3, roofY(x) - .4, (layer + .5) / RIVER_STRATA.length);
    const palette = z > nearZ - 4 && layer >= 5 ? RIVER_GREENS : RIVER_ROCK_COLORS;
    place(x, y, z, size * .92, size * (.56 + .5 * Math.abs(Math.sin(i))), size * (.7 + .4 * Math.abs(Math.cos(i * .7))),
      (i % 5 - 2) * .16, i * 1.17, palette[i % palette.length]);
  }
  for (let rib = 0; rib < ribs; rib++) {
    const z = THREE.MathUtils.lerp(nearZ - 1, farZ + 1, (rib + 1) / (ribs + 1));
    for (let j = 0; j < 9; j++) {
      const a = (j + .5) * Math.PI / 9;
      const size = 1 + (j % 3) * .18;
      place(Math.cos(a) * halfWidth * .92,
        -1 + Math.pow(Math.sin(a), .68) * (height + 1) * .93,
        z + Math.sin(j * 3.1 + rib) * .35,
        size * .9, size * (1.1 + (j % 2) * .3), size * 1.05,
        Math.PI - a * .35, a * 2,
        RIVER_STRATA[Math.min(RIVER_STRATA.length - 1, Math.floor(Math.sin(a) * 7))]);
    }
  }
  parent.add(rocks);
}
