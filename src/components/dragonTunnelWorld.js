import * as THREE from 'three';

// The passage is a single, curved and descending cave between the cove and the dragon village.
export const TUNNEL = { startZ: 24, endZ: -46 };
const SPAN = TUNNEL.startZ - TUNNEL.endZ;
const clamp01 = value => Math.max(0, Math.min(1, value));
const wave = (value, phase = 0) =>
  Math.sin(value * 9.13 + phase) * .5 + Math.sin(value * 21.7 - phase * 1.7) * .28 + Math.sin(value * 41.3 + phase * 2.3) * .12;

export function tunnelProgress(z) { return clamp01((TUNNEL.startZ - z) / SPAN); }
export function tunnelCenter(z) {
  const t = tunnelProgress(z);
  return Math.sin(t * Math.PI * 2.1) * (1.5 + t * 1.9) + Math.sin(t * Math.PI * 5.3) * .32 + t * t * 1.1;
}
export function tunnelHalfWidth(z) {
  const t = tunnelProgress(z);
  return 5.6 + .75 * Math.sin(t * Math.PI * 2.7) + .3 * wave(t * 4, 1.2) + (t > .8 ? (t - .8) * 24 : 0);
}
export function tunnelFloor(z) {
  const t = tunnelProgress(z);
  return -t * t * 8.4 - Math.sin(t * Math.PI * 3.4) * .22;
}
export function tunnelCeiling(z) {
  const t = tunnelProgress(z);
  return tunnelFloor(z) + 8.7 - t * 1.3 + Math.sin(t * Math.PI * 4) * .45;
}
export function tunnelRegion(z) {
  const t = tunnelProgress(z);
  return t < .23 ? 'entrance' : t < .5 ? 'descent' : t < .84 ? 'depths' : 'arrival';
}

function randomizer(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

const PALETTES = {
  entrance: ['#62675c', '#4f5a51', '#6b6a5b', '#4a544b', '#5c614d'],
  descent: ['#414a47', '#333c3b', '#4a4640', '#2d3535', '#3d4a44'],
  depths: ['#2b2c30', '#3a2a25', '#24282c', '#463027', '#302930'],
  arrival: ['#6b5a48', '#806b4e', '#5c5148', '#8a724e', '#716552'],
};
function paletteAt(t) { return t < .23 ? PALETTES.entrance : t < .5 ? PALETTES.descent : t < .84 ? PALETTES.depths : PALETTES.arrival; }

function rockTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'), random = randomizer(4817);
  ctx.fillStyle = '#cfd0cb';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const shade = Math.floor(150 + random() * 80);
    ctx.fillStyle = `rgba(${shade},${shade},${shade - 4},${.08 + random() * .16})`;
    ctx.fillRect(random() * 256, random() * 256, 1 + random() * 3, 1 + random() * 2);
  }
  ctx.strokeStyle = 'rgba(55,60,58,.28)';
  for (let i = 0; i < 26; i++) {
    let x = random() * 256, y = random() * 256;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineWidth = .6 + random() * 1.4;
    for (let step = 0; step < 6; step++) { x += (random() - .5) * 36; y += random() * 16; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 11);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glyphTexture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#e0bb74'; ctx.lineWidth = 7;
  ctx.shadowColor = '#d59443'; ctx.shadowBlur = 14;
  ctx.beginPath();
  if (kind === 'eye') {
    ctx.moveTo(34, 128); ctx.quadraticCurveTo(128, 40, 222, 128); ctx.quadraticCurveTo(128, 216, 34, 128);
    ctx.moveTo(128, 90); ctx.lineTo(155, 128); ctx.lineTo(128, 166); ctx.lineTo(101, 128); ctx.closePath();
    ctx.moveTo(74, 78); ctx.lineTo(60, 52); ctx.moveTo(182, 78); ctx.lineTo(196, 52);
  } else if (kind === 'claw') {
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(66 + i * 58, 44); ctx.quadraticCurveTo(54 + i * 58, 130, 88 + i * 58, 212);
    }
    ctx.moveTo(46, 200); ctx.lineTo(210, 200);
  } else if (kind === 'wing') {
    ctx.moveTo(34, 176); ctx.quadraticCurveTo(96, 58, 210, 48);
    for (let i = 0; i < 4; i++) ctx.lineTo(182 - i * 38, 96 + i * 28);
    ctx.lineTo(34, 176); ctx.moveTo(58, 154); ctx.lineTo(126, 80);
  } else {
    ctx.moveTo(128, 26); ctx.lineTo(208, 128); ctx.lineTo(128, 230); ctx.lineTo(48, 128); ctx.closePath();
    ctx.moveTo(128, 68); ctx.lineTo(168, 128); ctx.lineTo(128, 188); ctx.lineTo(88, 128); ctx.closePath();
  }
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 1, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,231,174,.85)');
  gradient.addColorStop(.22, 'rgba(255,161,72,.45)');
  gradient.addColorStop(1, 'rgba(255,110,40,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function revealTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#f4d696'); gradient.addColorStop(.42, '#d4924d');
  gradient.addColorStop(.78, '#5b3823'); gradient.addColorStop(1, '#141211');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#2b201a';
  for (let i = 0; i < 6; i++) {
    const x = 28 + i * 92;
    ctx.fillRect(x, 90 + (i % 2) * 14, 20, 166);
    ctx.fillRect(x - 7, 84 + (i % 2) * 14, 34, 10);
  }
  ctx.beginPath(); ctx.moveTo(0, 82); ctx.quadraticCurveTo(256, 10, 512, 82); ctx.lineTo(512, 112);
  ctx.quadraticCurveTo(256, 44, 0, 112); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1c1714';
  ctx.beginPath(); ctx.moveTo(256, 232); ctx.lineTo(196, 148); ctx.lineTo(244, 170); ctx.lineTo(256, 128);
  ctx.lineTo(268, 170); ctx.lineTo(316, 148); ctx.closePath(); ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createDragonTunnel(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const random = randomizer(9613);
  const sample = new THREE.Object3D();
  const tint = new THREE.Color();
  const rockMap = rockTexture(), haloMap = glowTexture(), revealMap = revealTexture();
  const glyphMaps = { eye: glyphTexture('eye'), claw: glyphTexture('claw'), wing: glyphTexture('wing'), rune: glyphTexture('rune') };
  const torches = [], drips = [], dust = [], embers = [];

  const shellPositions = [], shellColors = [], shellUvs = [], shellIndices = [], waterPositions = [], waterColors = [];
  const sections = 72, segments = 14;
  const zAt = i => THREE.MathUtils.lerp(TUNNEL.startZ + 4, TUNNEL.endZ - 4, i / sections);
  for (let i = 0; i <= sections; i++) {
    const z = zAt(i), t = tunnelProgress(z), palette = paletteAt(t);
    for (let j = 0; j <= segments; j++) {
      const angle = Math.PI * j / segments, seam = wave(i * .27 + j * .61, j * .3);
      const half = tunnelHalfWidth(z) * (1 + seam * .055);
      shellPositions.push(tunnelCenter(z) + Math.cos(angle) * half,
        tunnelFloor(z) - .7 + Math.pow(Math.sin(angle), .68) * (tunnelCeiling(z) - tunnelFloor(z) + .7 + seam * .25), z);
      tint.set(palette[(i + j) % palette.length]).multiplyScalar(.84 + seam * .15);
      shellColors.push(tint.r, tint.g, tint.b);
      shellUvs.push(j / segments, z / 8);
    }
    for (const side of [-1, 1]) {
      waterPositions.push(tunnelCenter(z) + side * tunnelHalfWidth(z) * 1.04, tunnelFloor(z) + .12, z);
      const color = t > .82 ? '#233b36' : '#16383a';
      tint.set(color).multiplyScalar(.86 + wave(i * .31 + side) * .14);
      waterColors.push(tint.r, tint.g, tint.b);
    }
  }
  for (let i = 0; i < sections; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j, b = a + segments + 1;
      shellIndices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const ribbonIndices = [];
  for (let i = 0; i < sections; i++) {
    const a = i * 2, b = a + 2;
    ribbonIndices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const surface = (positions, colors, indices, material, uvs) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    if (uvs) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    root.add(new THREE.Mesh(geometry, material));
  };
  surface(shellPositions, shellColors, shellIndices, new THREE.MeshStandardMaterial({
    map: rockMap, bumpMap: rockMap, bumpScale: .14, vertexColors: true,
    side: THREE.DoubleSide, flatShading: true, roughness: .96,
  }), shellUvs);
  surface(waterPositions, waterColors, ribbonIndices, new THREE.MeshStandardMaterial({
    vertexColors: true, side: THREE.DoubleSide, roughness: .44, metalness: .08,
  }));

  // Repeated stones, teeth and mineral growths are instanced to keep draw calls low.
  const boulderGeometry = new THREE.IcosahedronGeometry(1, 0);
  const stones = new THREE.InstancedMesh(boulderGeometry, new THREE.MeshStandardMaterial({ flatShading: true, roughness: .94 }), 170);
  for (let i = 0; i < 170; i++) {
    const z = THREE.MathUtils.lerp(TUNNEL.startZ, TUNNEL.endZ, (i + random() * .6) / 170);
    const side = i % 2 ? 1 : -1, t = tunnelProgress(z), palette = paletteAt(t);
    sample.position.set(tunnelCenter(z) + side * tunnelHalfWidth(z) * (.92 + random() * .07),
      tunnelFloor(z) + random() * .7 - .4, z);
    sample.rotation.set(random() * .8, random() * Math.PI, random() * .5);
    sample.scale.set(.5 + random() * .6, .5 + random() * 1, .7 + random() * 1.4);
    sample.updateMatrix(); stones.setMatrixAt(i, sample.matrix);
    tint.set(palette[i % palette.length]).multiplyScalar(.75 + random() * .35);
    if (t < .2 && i % 4 === 0) tint.lerp(new THREE.Color('#4c6748'), .55);
    stones.setColorAt(i, tint);
  }
  root.add(stones);

  const toothGeometry = new THREE.ConeGeometry(1, 1, 6), toothMaterial = new THREE.MeshStandardMaterial({ flatShading: true, roughness: .9 });
  for (const hanging of [true, false]) {
    const count = hanging ? 84 : 62;
    const teeth = new THREE.InstancedMesh(toothGeometry, toothMaterial, count);
    for (let i = 0; i < count; i++) {
      const z = THREE.MathUtils.lerp(TUNNEL.startZ - 2, TUNNEL.endZ + 2, (i + random() * .8) / count);
      const side = i % 2 ? 1 : -1, width = tunnelHalfWidth(z);
      const length = .6 + random() * (hanging ? 1.9 : 1.4);
      const x = tunnelCenter(z) + side * width * (hanging ? .55 + random() * .4 : .84 + random() * .13);
      sample.position.set(x, hanging ? tunnelCeiling(z) - length * .42 : tunnelFloor(z) + length * .42, z);
      sample.rotation.set(0, random() * Math.PI, hanging ? Math.PI + side * .08 : side * .06);
      sample.scale.set(.2 + random() * .3, length, .2 + random() * .26);
      sample.updateMatrix(); teeth.setMatrixAt(i, sample.matrix);
      tint.set(tunnelProgress(z) < .3 ? '#646e5e' : '#4a4a46').multiplyScalar(.75 + random() * .3);
      teeth.setColorAt(i, tint);
    }
    root.add(teeth);
  }

  const rootMaterial = new THREE.MeshStandardMaterial({ color: '#3b2d22', roughness: .95, flatShading: true });
  for (let i = 0; i < 9; i++) {
    const z = THREE.MathUtils.lerp(TUNNEL.startZ - 9, TUNNEL.endZ + 16, i / 8);
    const side = i % 2 ? 1 : -1, half = tunnelHalfWidth(z);
    const top = tunnelCeiling(z) - .2, curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(tunnelCenter(z) + side * half * .95, top, z),
      new THREE.Vector3(tunnelCenter(z) + side * half * .78, top - 1.5, z - .4),
      new THREE.Vector3(tunnelCenter(z) + side * half * .68, top - 3.1 - random() * 1.4, z + .7),
      new THREE.Vector3(tunnelCenter(z) + side * half * .6, top - 4.5 - random() * 1.2, z + 1.2),
    ]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, .055 + random() * .045, 5, false), rootMaterial));
  }

  const crystalGeometry = new THREE.OctahedronGeometry(1, 0);
  const crystalSpots = [];
  [['#4bbfae', '#1c8179'], ['#d78b45', '#a34a20']].forEach(([color, emissive], kind) => {
    const crystals = new THREE.InstancedMesh(crystalGeometry, new THREE.MeshStandardMaterial({
      color, emissive, emissiveIntensity: .9, roughness: .35, flatShading: true,
    }), 30);
    for (let i = 0; i < 30; i++) {
      const z = THREE.MathUtils.lerp(TUNNEL.startZ - 30, TUNNEL.endZ + 8, (i + random() * .7) / 30);
      const side = i % 2 ? 1 : -1;
      const x = tunnelCenter(z) + side * tunnelHalfWidth(z) * (.86 + random() * .12);
      const y = tunnelFloor(z) + .5 + random() * 2.5;
      sample.position.set(x, y, z);
      sample.rotation.set(random() * .5, random() * Math.PI, random() * .4);
      sample.scale.setScalar(.13 + random() * .45);
      sample.updateMatrix(); crystals.setMatrixAt(i, sample.matrix);
      if (i === 4 && kind === 1) crystalSpots.push([x, y, z]);
    }
    root.add(crystals);
  });

  const fissures = new THREE.InstancedMesh(new THREE.BoxGeometry(.1, 1, .1),
    new THREE.MeshBasicMaterial({ color: '#bf5428', transparent: true, opacity: .82, depthWrite: false }), 18);
  for (let i = 0; i < 18; i++) {
    const z = THREE.MathUtils.lerp(TUNNEL.startZ - 30, TUNNEL.endZ + 6, (i + random() * .6) / 18);
    const side = i % 2 ? 1 : -1;
    sample.position.set(tunnelCenter(z) + side * (tunnelHalfWidth(z) - .22), tunnelFloor(z) + 1.4 + random() * 3.6, z);
    sample.rotation.set(0, 0, (random() - .5) * .55);
    sample.scale.set(1, .7 + random() * 2, 1);
    sample.updateMatrix(); fissures.setMatrixAt(i, sample.matrix);
  }
  root.add(fissures);

  const glyphPlanes = [
    ['rune', .11, 1], ['claw', .27, -1], ['eye', .39, 1], ['rune', .52, -1],
    ['wing', .63, 1], ['claw', .74, -1], ['eye', .86, 1], ['wing', .94, -1],
  ];
  glyphPlanes.forEach(([kind, progress, side], i) => {
    const z = THREE.MathUtils.lerp(TUNNEL.startZ, TUNNEL.endZ, progress);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(kind === 'wing' ? 2.8 : 1.5, kind === 'wing' ? 1.9 : 1.5),
      new THREE.MeshBasicMaterial({ map: glyphMaps[kind], transparent: true, depthWrite: false, opacity: .78, side: THREE.DoubleSide }));
    plane.position.set(tunnelCenter(z) + side * (tunnelHalfWidth(z) - .14), tunnelFloor(z) + 2.6 + (i % 3) * .5, z);
    plane.rotation.set(0, side > 0 ? -Math.PI / 2 : Math.PI / 2, (i % 2 ? 1 : -1) * .06);
    root.add(plane);
  });

  const clawMarks = new THREE.InstancedMesh(new THREE.BoxGeometry(.08, 1.1, .08),
    new THREE.MeshBasicMaterial({ color: '#a47c43', transparent: true, opacity: .62 }), 18);
  const markLocations = [-2, -23, -37];
  for (let i = 0; i < 18; i++) {
    const location = Math.floor(i / 3), z = markLocations[location % markLocations.length];
    const side = location % 2 ? 1 : -1, offset = (i % 3 - 1) * .34;
    sample.position.set(tunnelCenter(z) + side * (tunnelHalfWidth(z) - .12), tunnelFloor(z) + 2.4 + offset * .3, z + offset);
    sample.rotation.set(0, 0, (i % 3 - 1) * .28 + side * .12);
    sample.scale.set(1, .8 + random() * .6, 1);
    sample.updateMatrix(); clawMarks.setMatrixAt(i, sample.matrix);
  }
  root.add(clawMarks);

  const stoneMaterial = new THREE.MeshStandardMaterial({ color: '#5a564c', roughness: .95, flatShading: true });
  const goldMaterial = new THREE.MeshStandardMaterial({ color: '#a88753', emissive: '#5a3c15', emissiveIntensity: .45, roughness: .55, metalness: .25 });
  const arch = (z, ornate) => {
    const group = new THREE.Group();
    group.position.set(tunnelCenter(z), tunnelFloor(z), z);
    root.add(group);
    const half = tunnelHalfWidth(z) - .45;
    [-1, 1].forEach(side => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.28, .38, 6.4, 7), stoneMaterial);
      pillar.position.set(side * half, 3.2, 0); group.add(pillar);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(.9, .35, .9), stoneMaterial);
      foot.position.set(side * half, .17, 0); group.add(foot);
      if (ornate) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(.34, .06, 6, 14), goldMaterial);
        band.position.set(side * half, 3.9, 0); band.rotation.x = Math.PI / 2; group.add(band);
      }
    });
    // Keep the crossbeam above the boat's mast and sail instead of cutting through them.
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + 1, .5, .7), stoneMaterial);
    lintel.position.y = 6.4; group.add(lintel);
    if (ornate) {
      const crest = new THREE.Mesh(new THREE.ConeGeometry(.4, 1, 5), goldMaterial);
      crest.position.y = 6.85; group.add(crest);
    }
  };
  arch(TUNNEL.startZ - 2, false);
  arch(-20, false);
  [-39, -43, -46].forEach(z => arch(z, true));

  const altar = z => {
    const group = new THREE.Group();
    group.position.set(tunnelCenter(z) + tunnelHalfWidth(z) - .35, tunnelFloor(z), z);
    root.add(group);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.7, .9, .7, 8), stoneMaterial);
    base.position.y = .35; group.add(base);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.3, 0), new THREE.MeshStandardMaterial({
      color: '#c8a15d', emissive: '#b76825', emissiveIntensity: 1.1, roughness: .4,
    }));
    gem.position.y = 1.05; group.add(gem);
  };
  altar(-9); altar(-33);

  const fragment = new THREE.Group();
  fragment.position.set(tunnelCenter(-28) - tunnelHalfWidth(-28) - .1, tunnelFloor(-28), -28);
  fragment.rotation.set(.18, .5, -.22);
  fragment.scale.setScalar(.8);
  root.add(fragment);
  const brokenBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, .7, 2.1), stoneMaterial);
  brokenBody.position.y = .4; fragment.add(brokenBody);
  const brokenHead = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.5, 5), stoneMaterial);
  brokenHead.position.set(.5, 1, .9); fragment.add(brokenHead);
  [-1, 1].forEach(side => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(.12, .9, 5), stoneMaterial);
    horn.position.set(.5 + side * .35, 1.8, .9); horn.rotation.z = side * .4; fragment.add(horn);
  });

  const haloMaterial = new THREE.SpriteMaterial({ map: haloMap, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  [12, -4, -18, -31, -42].forEach((z, i) => {
    const side = i % 2 ? 1 : -1, x = tunnelCenter(z) + side * (tunnelHalfWidth(z) - .55), y = tunnelFloor(z) + 3.1;
    const bracket = new THREE.Mesh(new THREE.ConeGeometry(.15, .6, 6), new THREE.MeshStandardMaterial({ color: '#604730', roughness: .9 }));
    bracket.position.set(x, y - .5, z); bracket.rotation.z = side * .3; root.add(bracket);
    const flame = new THREE.Mesh(new THREE.OctahedronGeometry(.19, 0), new THREE.MeshStandardMaterial({
      color: '#ffd08a', emissive: '#e78132', emissiveIntensity: 1.6, flatShading: true,
    }));
    flame.position.set(x, y, z); flame.scale.y = 1.6; root.add(flame);
    const halo = new THREE.Sprite(haloMaterial.clone());
    halo.position.set(x, y, z); halo.scale.set(2.2, 2.2, 1); root.add(halo);
    torches.push({ flame, halo, phase: i * 1.7 });
  });

  const points = (count, color, size, opacity, additive) => new THREE.Points(
    new THREE.BufferGeometry(), new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  const dustPoints = points(240, '#b9c0b4', .075, .5, false);
  const emberPoints = points(70, '#ff9c4a', .12, .8, true);
  const dustPositions = [], emberPositions = [];
  for (let i = 0; i < 240; i++) {
    const z = THREE.MathUtils.lerp(TUNNEL.startZ, TUNNEL.endZ, random());
    dustPositions.push(tunnelCenter(z) + (random() - .5) * tunnelHalfWidth(z) * 1.7,
      tunnelFloor(z) + .5 + random() * 5.5, z);
    dust.push({ phase: random() * Math.PI * 2, speed: .2 + random() * .5 });
  }
  for (let i = 0; i < 70; i++) {
    const z = THREE.MathUtils.lerp(-26, TUNNEL.endZ, random());
    emberPositions.push(tunnelCenter(z) + (random() - .5) * tunnelHalfWidth(z), tunnelFloor(z) + random() * 4, z);
    embers.push({ phase: random() * Math.PI * 2, speed: .25 + random() * .6 });
  }
  [dustPoints, emberPoints].forEach((points, i) => {
    const positions = i ? emberPositions : dustPositions;
    points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.slice(), 3));
    root.add(points);
  });

  const dripGeometry = new THREE.SphereGeometry(.055, 6, 5), dripMaterial = new THREE.MeshStandardMaterial({
    color: '#9dc5c6', emissive: '#27575a', emissiveIntensity: .5, roughness: .25 });
  const dripMesh = new THREE.InstancedMesh(dripGeometry, dripMaterial, 12);
  for (let i = 0; i < 12; i++) {
    const z = -18 - i * 2.3;
    const side = i % 2 ? 1 : -1;
    const drip = { x: tunnelCenter(z) + side * (tunnelHalfWidth(z) * .62 + random() * .6), z, top: tunnelCeiling(z) - 1, bottom: tunnelFloor(z) + .2, phase: random() };
    drips.push(drip);
    sample.position.set(drip.x, drip.top, drip.z);
    sample.scale.setScalar(.7);
    sample.updateMatrix(); dripMesh.setMatrixAt(i, sample.matrix);
  }
  dripMesh.instanceMatrix.needsUpdate = true;
  root.add(dripMesh);

  const reveal = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), new THREE.MeshBasicMaterial({ map: revealMap, side: THREE.DoubleSide, fog: false }));
  reveal.position.set(tunnelCenter(TUNNEL.endZ), tunnelFloor(TUNNEL.endZ) + 4.4, TUNNEL.endZ - 3.5);
  root.add(reveal);
  const villageLight = new THREE.PointLight('#ffc070', 26, 30);
  villageLight.position.set(tunnelCenter(TUNNEL.endZ), tunnelFloor(TUNNEL.endZ) + 4, TUNNEL.endZ + 1);
  root.add(villageLight);
  [-1, 1].forEach(side => {
    const silhouette = new THREE.Mesh(new THREE.CylinderGeometry(.6, .8, 8, 8), new THREE.MeshBasicMaterial({ color: '#241a16', fog: false }));
    silhouette.position.set(tunnelCenter(TUNNEL.endZ) + side * 5, tunnelFloor(TUNNEL.endZ) + 4, TUNNEL.endZ - 2);
    root.add(silhouette);
  });
  crystalSpots.forEach(([x, y, z]) => {
    const light = new THREE.PointLight('#d07a38', 6, 11);
    light.position.set(x, y, z); root.add(light);
  });

  const fogColors = { entrance: '#182828', descent: '#111b1c', depths: '#0a0d10', arrival: '#251b16' };
  const fogTargets = { entrance: new THREE.Color('#182828'), descent: new THREE.Color('#111b1c'),
    depths: new THREE.Color('#0a0d10'), arrival: new THREE.Color('#251b16') };
  scene.background = new THREE.Color(fogColors.entrance);
  scene.fog = new THREE.Fog(fogColors.entrance, 14, 56);

  return {
    update(time, dt, reduceMotion, region) {
      scene.background.lerp(fogTargets[region], Math.min(1, dt * .5));
      scene.fog.color.copy(scene.background);
      if (reduceMotion) return;
      torches.forEach(({ flame, halo, phase }) => {
        const flicker = 1 + Math.sin(time * 9 + phase) * .16 + Math.sin(time * 17 + phase) * .07;
        flame.scale.y = 1.6 * flicker;
        flame.material.emissiveIntensity = 1.6 * flicker;
        halo.material.opacity = .55 + .25 * (flicker - 1);
      });
      [dustPoints, emberPoints].forEach((points, i) => {
        const attribute = points.geometry.attributes.position, list = i ? embers : dust;
        for (let n = 0; n < list.length; n++) {
          const { phase, speed } = list[n];
          attribute.setY(n, attribute.getY(n) + Math.sin(time * speed + phase) * dt * .05);
        }
        attribute.needsUpdate = true;
      });
      drips.forEach((drip, i) => {
        const travel = (drip.top - drip.bottom) * ((time * .35 + drip.phase) % 1);
        sample.position.set(drip.x, drip.top - travel, drip.z);
        sample.scale.setScalar(.7 + (travel / (drip.top - drip.bottom)) * .5);
        sample.updateMatrix(); dripMesh.setMatrixAt(i, sample.matrix);
      });
      dripMesh.instanceMatrix.needsUpdate = true;
    },
  };
}
