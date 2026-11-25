import * as THREE from 'three';

const stoneColors = ['#4b5665', '#64748b', '#586470', '#717677'];
const foliageColors = ['#243d30', '#354d40', '#465c3b', '#526b54'];
const sanctuary = { x: -18.75, z: 10.6 };
const westClearings = [[7, -16, 4], [7, -34, 5]];
const eastClearings = [[5, -22, 4], [8, -57, 7], [14, -83, 7]];
function bankHeight(distance, z, side) {
  const inland = Math.max(0, distance - 1.8);
  const northCrossing = THREE.MathUtils.smoothstep(Math.abs(z + 42), 2.2, 6);
  const oldClearings = side < 0 ? westClearings : eastClearings;
  let relief = northCrossing;
  for (const [dx, dz, radius] of oldClearings) {
    const separation = Math.hypot(dx - distance, dz - z);
    relief *= THREE.MathUtils.smoothstep(separation, radius * .65, radius + 3);
  }
  if (side < 0) relief *= THREE.MathUtils.smoothstep(Math.hypot(-sanctuary.x - 12 - distance, sanctuary.z - z), 4.6, 8);
  return -.15 + relief * Math.min(inland / 15, 1) *
    (1.5 + Math.sin(z * .16 + side) * .8 + Math.sin(distance * .6 - z * .27) * .65);
}

function buildBanks(scene) {
  const positions = [], colors = [], indices = [];
  const moss = new THREE.Color('#465c3b'), gravel = new THREE.Color('#69706b');
  const soil = new THREE.Color('#313c36'), tint = new THREE.Color();
  const columns = 14, rows = 112;
  for (const side of [-1, 1]) {
    const offset = positions.length / 3;
    for (let row = 0; row <= rows; row++) {
      const z = -118 + row * 160 / rows;
      const edge = 12.02 + .52 * Math.sin(z * .33 + side) + .31 * Math.cos(z * .71 - side);
      for (let col = 0; col <= columns; col++) {
        const distance = col === 0 ? 0 : col === 1 ? 1.1 : 1.1 + (col - 1) * 2.8;
        const height = col === 0 ? -.32 + Math.sin(z * .69) * .12 : bankHeight(distance, z, side);
        positions.push(side * (edge + distance), height, z);
        const grain = .5 + .5 * Math.sin(row * 5.17 + col * 3.8 + side);
        tint.copy(soil).lerp(moss, .38 + grain * .52);
        if (col < 2) tint.lerp(gravel, .45 + grain * .3);
        colors.push(tint.r, tint.g, tint.b);
        if (row === rows || col === columns) continue;
        const a = offset + row * (columns + 1) + col, b = a + columns + 1;
        if (side === 1) indices.push(a, b, a + 1, a + 1, b, b + 1);
        else indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    .setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    .setIndex(indices);
  geometry.computeVertexNormals();
  scene.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })));
}

function addMotes(scene, random) {
  const positions = [], kinds = [];
  for (let i = 0; i < 138; i++) {
    const kind = i < 32 ? 0 : i < 63 ? 1 : i < 105 ? 2 : 3;
    const side = i % 2 ? -1 : 1;
    if (kind === 0) positions.push(sanctuary.x + (random() - .5) * 7, random() * 5, sanctuary.z + (random() - .5) * 7);
    else if (kind === 1) positions.push(side * (7.8 + random() * 3.4), -.26 + random() * .15, 16 - random() * 125);
    else positions.push(side * (11.5 + random() * 8), .45 + random() * 3.2, 23 - random() * 138);
    kinds.push(kind);
  }
  const geometry = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    .setAttribute('kind', new THREE.Float32BufferAttribute(kinds, 1));
  const time = { value: 0 };
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { time },
    vertexShader: `
      attribute float kind;
      uniform float time;
      varying float vKind, opacity;
      void main() {
        vec3 p = position;
        float phase = dot(position.xz, vec2(.73,.32));
        p.x += sin(time * .5 + phase) * .32;
        if (kind < .5) p.y = mod(p.y + time * .58, 5.0);
        else if (kind > 2.5) p.y = .55 + mod(p.y - .55 - time * .28 + 4.0, 4.0);
        else p.y += sin(time * .8 + phase) * (kind < 1.5 ? .03 : .2);
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(86.0 / max(1.0, -view.z), 1.0, 7.0);
        vKind = kind;
        opacity = (.36 + .24 * sin(time * 1.2 + phase)) * (1.0 - smoothstep(24.0, 67.0, -view.z));
      }
    `,
    fragmentShader: `
      varying float vKind, opacity;
      void main() {
        vec2 p = gl_PointCoord - .5;
        float shape = 1.0 - smoothstep(.08, .5, length(p));
        vec3 tint = vec3(.47,.59,.74);
        if (vKind > .5) tint = vec3(.13,.59,.57);
        if (vKind > 1.5) tint = vec3(.59,.67,.27);
        if (vKind > 2.5) {
          tint = vec3(.29,.37,.15);
          shape = 1.0 - smoothstep(.14,.5,length(vec2(p.x*1.5,p.y)));
        }
        gl_FragColor = vec4(tint, shape * opacity);
        #include <colorspace_fragment>
      }
    `,
  });
  const motes = new THREE.Points(geometry, material);
  motes.renderOrder = 1;
  scene.add(motes);
  return time;
}

export function buildLakeSanctuary(scene, mistTexture) {
  buildBanks(scene);
  let seed = 73821;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const shapes = {
    rock: new THREE.DodecahedronGeometry(1, 0),
    leaf: new THREE.IcosahedronGeometry(1, 1),
    block: new THREE.BoxGeometry(1, 1, 1),
    column: new THREE.CylinderGeometry(.45, .52, 1, 9),
    branch: new THREE.CylinderGeometry(.51, 1, 1, 6),
    crystal: new THREE.OctahedronGeometry(1),
    fungus: new THREE.SphereGeometry(1, 9, 5, 0, Math.PI * 2, 0, Math.PI * .55),
    tile: new THREE.CylinderGeometry(1, 1, 1, 18),
  };
  const batches = new Map(), transform = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0), axis = new THREE.Vector3();
  const queue = (shape, color) => {
    const sector = Math.floor(transform.position.z / 28);
    const key = shape + ':' + sector;
    if (!batches.has(key)) batches.set(key, { shape, instances: [] });
    transform.updateMatrix();
    batches.get(key).instances.push({ matrix: transform.matrix.clone(), color });
  };
  const part = (shape, color, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => {
    transform.position.set(x, y, z);
    transform.scale.set(sx, sy, sz);
    transform.rotation.set(rx, ry, rz);
    queue(shape, color);
  };
  const branch = (from, to, radius, color) => {
    axis.subVectors(to, from);
    transform.position.copy(from).lerp(to, .5);
    transform.scale.set(radius, axis.length(), radius);
    transform.quaternion.setFromUnitVectors(up, axis.normalize());
    queue('branch', color);
  };
  const stone = (x, y, z, sx, sy, sz, turn = 0, index = 0) =>
    part('block', stoneColors[index % stoneColors.length], x, y, z, sx, sy, sz, 0, turn);

  const movingFronds = [];
  const frondMaterial = new THREE.MeshStandardMaterial({ color: '#405c4b', roughness: .92 });
  const tree = (x, y, z, size, willow, phase) => {
    const bark = phase % 2 ? '#4b443b' : '#534b41';
    const base = new THREE.Vector3(x, y - .12, z);
    const bend = new THREE.Vector3(x + Math.cos(phase) * size * .13, y + size * .45, z - size * .07);
    const top = new THREE.Vector3(x + Math.sin(phase) * size * .17, y + size * .88, z + size * .08);
    branch(base, bend, size * .105, bark);
    branch(bend, top, size * .07, bark);
    for (let i = 0; i < 5; i++) {
      const angle = phase + i * 2.4;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      const root = new THREE.Vector3(x + dx * size * .18, y + .07, z + dz * size * .18);
      branch(base.clone().addScaledVector(up, size * .18), root, size * .049, bark);
      branch(root, new THREE.Vector3(x + dx * size * .32, y - .26, z + dz * size * .32), size * .028, bark);
      const fork = new THREE.Vector3(top.x + dx * size * .28, top.y + (i % 3 - 1) * size * .12, top.z + dz * size * .28);
      branch(i % 2 ? bend : top, fork, size * .045, bark);
      const color = foliageColors[(phase + i) % foliageColors.length];
      part('leaf', color, fork.x, fork.y, fork.z, size * .26, size * .15, size * .23, .15, angle);
      if (willow && i === 0 && phase % 3 === 0) {
        const pivot = new THREE.Group();
        pivot.position.copy(fork);
        const frond = new THREE.Mesh(shapes.leaf, frondMaterial);
        frond.position.y = -size * .19;
        frond.scale.set(size * .083, size * .31, size * .06);
        pivot.add(frond);
        scene.add(pivot);
        movingFronds.push({ pivot, phase });
      }
      if (willow) for (let strand = 0; strand < 3; strand++) {
        const droop = size * (.15 + random() * .18);
        part('leaf', foliageColors[(i + strand + 1) % 4],
          fork.x + dx * strand * .45, fork.y - droop * .64, fork.z + dz * strand * .45,
          size * .074, droop, size * .062, dx * .13, angle, dz * .16);
      }
    }
  };
  const fern = (x, y, z, size) => {
    for (let i = 0; i < 5; i++) {
      const angle = i * 2.4 + x;
      part('leaf', foliageColors[i % 4], x + Math.cos(angle) * size * .25, y + size * .27,
        z + Math.sin(angle) * size * .25, size * .095, size * .076, size * .48, -.65, Math.PI / 2 - angle);
    }
  };

  const reserved = [
    [-19, -16, 4.5], [-19, -35, 5], [17, -22, 4], [16, -57, 4], [24, -57, 4],
    [26, -83, 8], [sanctuary.x, sanctuary.z, 6], [15.8, -27, 4], [-15.2, -68, 4], [15.4, -96, 4],
  ];
  const openGround = (x, z) => Math.abs(z + 42) > 4 &&
    reserved.every(([rx, rz, radius]) => Math.hypot(x - rx, z - rz) > radius);
  const warmGlow = new THREE.MeshStandardMaterial({ color: '#c8a96b', emissive: '#ce8e48', emissiveIntensity: .65 });
  const paleGlow = new THREE.MeshStandardMaterial({ color: '#a3d9d2', emissive: '#65c9c3', emissiveIntensity: .52 });
  const violetGlow = new THREE.MeshStandardMaterial({ color: '#a99adb', emissive: '#8b5cf6', emissiveIntensity: .62 });
  const lamp = (x, y, z) => {
    stone(x, y + .09, z, .57, .18, .58);
    part('column', '#776a53', x, y + .64, z, .23, 1.1, .23);
    stone(x, y + 1.19, z, .41, .12, .41);
    const globe = new THREE.Mesh(shapes.crystal, warmGlow);
    globe.position.set(x, y + 1.42, z);
    globe.scale.set(.17, .26, .17);
    scene.add(globe);
    for (const dx of [-.15, .15]) for (const dz of [-.15, .15]) {
      part('block', '#524c41', x + dx, y + 1.43, z + dz, .035, .35, .035);
    }
    part('column', '#575044', x, y + 1.65, z, .49, .14, .49);
  };

  for (let i = 0; i < 76; i++) {
    const side = i % 2 ? 1 : -1, z = 24 - random() * 138;
    const distance = 2.6 + random() * (i < 28 ? 3.5 : 23);
    const x = side * (12 + distance);
    if (!openGround(x, z)) continue;
    tree(x, bankHeight(distance, z, side), z, 3.9 + random() * 5.8, i < 28, i);
  }
  for (let i = 0; i < 135; i++) {
    const side = i % 2 ? 1 : -1, z = 26 - random() * 142;
    const distance = random() * 6.5 - .17, x = side * (12.42 + distance);
    if (!openGround(x, z)) continue;
    const y = bankHeight(distance, z, side);
    const size = .28 + random() * .78, angle = random() * Math.PI;
    part('rock', stoneColors[i % 4], x, y, z, size, size * .48, size * .73, angle * .2, angle, -.13);
    if (i % 2) {
      part('leaf', '#465c3b', x + .13, y + size * .29, z - .09, size * .78, size * .16, size * .62, .12, angle);
      fern(x + .57, y, z + .26, size);
    }
    if (i % 5 === 0) for (let j = 0; j < 3; j++) {
      const offset = j * .18;
      part('column', '#ada893', x + .6 + offset, y + .13 + offset * .3, z - .38, .086, .22 + offset, .086);
      part('fungus', j === 1 ? '#9c8cb2' : '#82aea0', x + .6 + offset, y + .245 + offset * .8, z - .38,
        .12 + offset * .12, .09, .12 + offset * .12);
    }
  }
  for (let i = 0; i < 62; i++) {
    const side = i % 2 ? -1 : 1;
    const x = side * (12.9 + random() * 4), z = 25 - random() * 139;
    if (!openGround(x, z)) continue;
    const y = bankHeight(Math.abs(x) - 12, z, side);
    for (let blade = 0; blade < 3; blade++) {
      part('branch', foliageColors[(i + blade) % 4], x + blade * .11, y + .2, z,
        .035, .24 + random() * .32, .045, -.14, i, (blade - 1) * .28);
    }
    if (i % 3 === 0) {
      part('leaf', i % 2 ? '#bba477' : '#a995b8', x + .12, y + .41, z, .095, .065, .1);
    }
  }
  // The timber dock remains the landing surface. The old paving starts behind it.
  for (let row = 0; row < 9; row++) for (let col = -2; col <= 2; col++) {
    const z = 22.5 + row * 1.65, x = col * .78 + (random() - .5) * .23;
    stone(x, .008, z, .62 + random() * .12, .08, 1.18 + random() * .29, (random() - .5) * .24, row + col + 4);
  }
  lamp(-4.5, .03, 24.7);
  lamp(4.9, .03, 26.4);

  const pillar = (x, y, z, height, index) => {
    stone(x, y + .12, z, 1.42, .37, 1.35, .08, index);
    stone(x, y + .38, z, 1.16, .19, 1.14, -.03, 1);
    const courses = Math.ceil(height / .6);
    for (let i = 0; i < courses; i++) {
      part('column', stoneColors[(i + index) % 4], x + Math.sin(i) * .027, y + .58 + i * .52, z,
        1.02 - i * .013, .48, .98 - i * .012, .015, i * .17);
    }
    const top = y + .62 + (courses - 1) * .52;
    stone(x, top + .23, z, 1.19, .18, 1.16, .09, 3);
    return top + .28;
  };
  const fracturedArch = (x, z, span, start, rise, broken) => {
    for (const side of [-1, 1]) for (let i = 0; i < (side === broken ? 4 : 8); i++) {
      const t = i / 8;
      const dx = -side * span * 2 * t;
      const dy = rise * 2 * (1 - t);
      const angle = Math.atan2(dy, dx);
      part('block', stoneColors[(i + side + 1) % 4], x + side * span * (1 - t * t),
        start + rise * (2 * t - t * t), z, .59 + random() * .14, .49, .92, 0, 0, angle);
    }
  };
  const runePoints = [];
  const runeCircle = (x, y, z, radius, count) => {
    for (let i = 0; i < count; i++) {
      const a = i * Math.PI * 2 / count, nx = Math.sin(a), nz = Math.cos(a);
      const points = [[-.15, -.18], [0, .18], [.15, -.18], [0, -.04], [-.15, -.18]];
      for (let j = 1; j < points.length; j++) for (const [u, v] of [points[j - 1], points[j]]) {
        runePoints.push(x + nx * (radius + v) + nz * u, y, z + nz * (radius + v) - nx * u);
      }
    }
  };
  const crystal = (x, y, z, scale, violet = false) => {
    part('rock', '#45545c', x, y - .28 * scale, z, scale, scale * .52, scale * .77, .4, -.32);
    const mesh = new THREE.Mesh(shapes.crystal, violet ? violetGlow : paleGlow);
    mesh.position.set(x, y + scale * .31, z);
    mesh.scale.set(scale * .31, scale * .94, scale * .39);
    mesh.rotation.set(-.16, x, .23);
    scene.add(mesh);
  };
  const { x, z } = sanctuary;
  // The low shore steps reach the water while the monument stays beyond the hull's route.
  part('tile', '#465661', x, -.18, z, 5.35, .66, 5.12, 0, .13);
  part('tile', '#555f6b', x, .25, z, 4.78, .22, 4.69, 0, .23);
  part('tile', '#647073', x, .4, z, 4.31, .16, 4.28, 0, .12);
  runeCircle(x, .487, z, 3.85, 28);
  for (let i = 0; i < 5; i++) {
    stone(-12.25 - i * .27, -.15 + i * .13, z + .54, .62, .28 + i * .12, 2.96 - i * .13, i * .028, i);
  }
  const leftTop = pillar(x - 2.64, .47, z - 1.64, 3.8, 1);
  pillar(x + 2.64, .47, z - 1.64, 3.8, 3);
  pillar(x - 2.87, .47, z + 1.4, 1.7, 2);
  pillar(x + 2.56, .47, z + 1.8, 2.55, 0);
  fracturedArch(x, z - 1.64, 2.64, leftTop, 2.05, 1);
  stone(x, .69, z, 2.12, .42, 1.94, -.12, 1);
  stone(x, 1.07, z, 1.8, .35, 1.58, -.12, 2);
  part('column', '#687682', x, 2.1, z, 1.81, 1.95, 1.16, 0, -.12);
  part('rock', '#718089', x, 3.18, z - .05, .69, .56, .39, .1, -.12);
  part('rock', '#7b8588', x, 3.85, z + .05, .47, .62, .42, -.15, .2, -.1);
  part('rock', '#384b57', x, 3.78, z + .34, .3, .35, .17, -.12, .2);
  part('block', '#899094', x - .59, 2.73, z + .22, .31, 1.24, .37, -.22, -.14, -.38);
  part('block', '#778088', x + .53, 2.53, z + .14, .28, .86, .32, -.12, .06, .37);
  part('block', '#a19a7b', x - .92, 2.65, z + .61, .12, 2.22, .15, -.27, 0, -.25);
  for (let i = 0; i < 13; i++) {
    const a = i * 2.4;
    fern(x + Math.cos(a) * (3.1 + i % 3 * .64), .35, z + Math.sin(a) * 3.9, .44 + random() * .75);
  }
  crystal(x + 3.7, .62, z - .48, 1.16);
  crystal(x + 3.4, .48, z + .26, .56, true);
  crystal(x - 3.4, .57, z + .12, .83, true);
  crystal(x - .85, .53, z + 3.5, .58);
  lamp(x + 2.1, .49, z + 3.1);

  for (const [rx, rz, side] of [[15.8, -27, 1], [-15.2, -68, -1], [15.4, -96, 1]]) {
    const top = pillar(rx - 1.56, -.09, rz, 2.72, 2);
    pillar(rx + 1.56, -.09, rz, 2.72, 1);
    fracturedArch(rx, rz, 1.56, top, 1.27, side);
    for (let i = 0; i < 5; i++) {
      stone(rx + side * (2.5 + i * .66), .16 + i * .16, rz - .14 * i, 1.0, .48 + i * .24, .94, i * .11, i);
      fern(rx + side * (1.3 + i * .57), .05 + i * .08, rz + .78, .46);
    }
    part('tile', '#566476', rx, -.06, rz + 2.2, 1.58, .39, 1.48);
    runeCircle(rx, .15, rz + 2.2, 1.25, 9);
    crystal(rx, .45, rz + 2.2, .85, side > 0);
  }
  // Staggered masonry and a fallen lintel break up the silhouette of the far bank.
  for (let course = 0; course < 4; course++) {
    for (let bay = 0; bay < 7 - course; bay++) {
      if (course > 0 && bay === 1) continue;
      const wallX = -16.5 - bay * .82 - (course % 2) * .4;
      stone(wallX, .08 + course * .4, -67.8, .78, .39, .72,
        (random() - .5) * .18, course + bay);
      if ((bay + course) % 3 === 0) {
        part('leaf', '#435b42', wallX, .16 + course * .4, -67.41, .47, .18, .17);
      }
    }
  }
  part('column', '#626e78', -14.2, .18, -65.9, .95, 2.1, 1.02, 0, -.2, Math.PI / 2);
  const runes = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(runePoints, 3));
  scene.add(new THREE.LineSegments(runes, new THREE.LineBasicMaterial({ color: '#a0c6bd' })));

  const batchMaterial = new THREE.MeshStandardMaterial({ roughness: .93 });
  const fungusMaterial = new THREE.MeshStandardMaterial({
    roughness: .87, emissive: '#739b91', emissiveIntensity: .22,
  });
  const color = new THREE.Color();
  for (const { shape, instances } of batches.values()) {
    const mesh = new THREE.InstancedMesh(shapes[shape], shape === 'fungus' ? fungusMaterial : batchMaterial, instances.length);
    instances.forEach((item, i) => {
      mesh.setMatrixAt(i, item.matrix);
      mesh.setColorAt(i, color.set(item.color));
    });
    scene.add(mesh);
  }

  const mist = [[-13, 8, 12, 1.4], [-16, 7, 10, 2.9], [13, -25, 11, 1.8],
    [-14, -59, 13, 2.6], [13, -94, 14, 2.4], [-8, -105, 11, 1.5]].map(([mx, mz, width, height]) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: mistTexture, color: '#93aec2', opacity: .34, transparent: true, depthWrite: false,
    }));
    sprite.position.set(mx, height * .4, mz);
    sprite.scale.set(width, height, 1);
    sprite.renderOrder = 3;
    scene.add(sprite);
    return { sprite, mx };
  });
  for (const [mx, mz, turn] of [[-16, 12, -.26], [15, -29, .32], [-15, -73, -.34]]) {
    const shaft = new THREE.Sprite(new THREE.SpriteMaterial({
      map: mistTexture, color: '#a9c6db', opacity: .15, rotation: turn, transparent: true, depthWrite: false,
    }));
    shaft.position.set(mx, 4.25, mz);
    shaft.scale.set(1.8, 10, 1);
    scene.add(shaft);
  }
  const lunarLight = new THREE.PointLight('#86c9d7', 24, 15, 2);
  lunarLight.position.set(x + 2.7, 3.2, z + 1.7);
  scene.add(lunarLight);
  const motesTime = addMotes(scene, random);
  return time => {
    motesTime.value = time;
    movingFronds.forEach(({ pivot, phase }) => {
      pivot.rotation.z = .1 + Math.sin(time * .85 + phase) * .1;
    });
    paleGlow.emissiveIntensity = .48 + Math.sin(time * .78) * .12;
    violetGlow.emissiveIntensity = .56 + Math.sin(time * .63 + 1.8) * .11;
    mist.forEach(({ sprite, mx }, i) => { sprite.position.x = mx + Math.sin(time * .17 + i) * 1.17; });
  };
}
