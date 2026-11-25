import * as THREE from 'three';

const TAU = Math.PI * 2;
const stoneColors = ['#334155', '#414458', '#4a4b5e', '#575362', '#78716c'];
const floorNoise = (x, z) => Math.sin(x * .21 + z * .16) * Math.cos(z * .29 - x * .07);

export function createTempleVillageScenery(scene, houses) {
  const root = new THREE.Group();
  scene.add(root);
  const occluders = [];
  const objects = new Map();
  const stoneBox = new THREE.BoxGeometry(1, 1, 1);
  const shaft = new THREE.CylinderGeometry(.86, 1, 1, 9);
  const shard = new THREE.CylinderGeometry(.59, 1, 1, 6);
  const cap = new THREE.ConeGeometry(.76, 1, 7);
  const boulder = new THREE.IcosahedronGeometry(1, 1);
  const vertices = boulder.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const irregular = 1 + .14 * Math.sin(x * 7 + y * 5) + .12 * Math.cos(z * 8 - x * 3);
    vertices.setXYZ(i, x * irregular + .18 * y, y * irregular, z * irregular);
  }
  boulder.computeVertexNormals();
  let seed = 9613;
  const range = (low, high) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return low + (high - low) * seed / 4294967296;
  };
  const surface = (color, roughness = .92, emissive = '#000000', intensity = 0) => {
    const key = [color, roughness, emissive, intensity].join('/');
    if (!objects.has(key)) {
      objects.set(key, new THREE.MeshStandardMaterial({ color, roughness, emissive,
        emissiveIntensity: intensity, flatShading: true }));
    }
    return objects.get(key);
  };
  const mesh = (parent, geometry, material, x, y, z, w = 1, h = 1, d = 1) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.scale.set(w, h, d);
    parent.add(object);
    return object;
  };
  const block = (parent, mat, x, y, z, w, h, d) => mesh(parent, stoneBox, mat, x, y, z, w, h, d);
  const pillar = (parent, mat, x, y, z, r, h) => mesh(parent, shaft, mat, x, y, z, r, h, r);
  const group = (x, z) => {
    const object = new THREE.Group();
    object.position.set(x, 0, z);
    root.add(object);
    return object;
  };
  const rock = stoneColors.map(color => surface(color));
  const wet = surface('#434a55', .48);
  const timber = surface('#594536');
  const beam = surface('#383037');
  const bronze = surface('#9b8151', .64);
  const oldGold = surface('#c8a96b', .62);
  const amber = surface('#efb45c', .51, '#f59e0b', .88);
  const moss = surface('#465e58');
  const fungus = surface('#70a28b', .82, '#34d399', .16);
  const veins = [
    surface('#6b6690', .51, '#6d28d9', .25),
    surface('#57919c', .47, '#67e8f9', .24),
  ];
  const floor = new THREE.PlaneGeometry(174, 174, 100, 100);
  floor.rotateX(-Math.PI / 2);
  const floorPositions = floor.attributes.position;
  const color = new THREE.Color();
  const floorColors = [];
  for (let i = 0; i < floorPositions.count; i++) {
    const x = floorPositions.getX(i), z = floorPositions.getZ(i);
    const noise = floorNoise(x, z);
    const inner = Math.abs(x) < 32 && z > -22 && z < 33;
    floorPositions.setY(i, inner ? -.065 + noise * .026 : -.3 + noise * .2);
    color.set(inner ? '#55505a' : '#363c4c').multiplyScalar(.87 + noise * .11 + .09 * Math.sin(i * 1.51));
    floorColors.push(color.r, color.g, color.b);
  }
  floor.setAttribute('color', new THREE.Float32BufferAttribute(floorColors, 3));
  floor.computeVertexNormals();
  mesh(root, floor, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .94 }), 0, 0, 0);

  // All sight lines inside the walkable rectangle and its orbit stay inside the outer rock shell.
  // The upper strata turn inward above the orbit; the center is rendered as a cutaway.
  const wallPositions = [], wallColors = [], wallIndices = [];
  const sections = 88;
  const strata = [[65, -1], [69, 4], [68, 10], [72, 16], [76, 23], [73, 30], [62, 36], [48, 42], [32, 49]];
  for (let i = 0; i < sections; i++) {
    const a = i * TAU / sections;
    for (let row = 0; row < strata.length; row++) {
      const [radius, y] = strata[row];
      const irregular = 1.7 * Math.sin(a * 5 + row * .37) + 1.6 * Math.cos(a * 13 - row * .66);
      wallPositions.push(Math.sin(a) * (radius + irregular), y + Math.sin(a * 8 + row) * 1.2,
        5 + Math.cos(a) * (radius + irregular));
      color.set(stoneColors[[1, 0, 2, 1, 2, 0, 1, 0, 0][row]])
        .multiplyScalar(.78 + .22 * Math.abs(Math.sin(a * 11 + row * .7)));
      wallColors.push(color.r, color.g, color.b);
      if (row > 0) {
        const p = i * strata.length + row, q = ((i + 1) % sections) * strata.length + row;
        wallIndices.push(p - 1, q - 1, p, p, q - 1, q);
      }
    }
  }
  const shell = new THREE.BufferGeometry();
  shell.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
  shell.setAttribute('color', new THREE.Float32BufferAttribute(wallColors, 3));
  shell.setIndex(wallIndices);
  shell.computeVertexNormals();
  mesh(root, shell, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true }), 0, 0, 0);

  const sample = new THREE.Object3D();
  const populate = (geometry, material, count, placement) => {
    const instances = new THREE.InstancedMesh(geometry, material, count);
    for (let i = 0; i < count; i++) {
      const { position, scale, rotation, tint } = placement(i);
      sample.position.fromArray(position);
      sample.scale.fromArray(scale);
      sample.rotation.set(...rotation);
      sample.updateMatrix();
      instances.setMatrixAt(i, sample.matrix);
      if (tint) instances.setColorAt(i, color.set(tint));
    }
    root.add(instances);
  };
  const chalk = surface('#ffffff');
  for (let sector = 0; sector < 8; sector++) {
    const azimuth = i => (sector + (i + .4) / 10) * TAU / 8;
    populate(boulder, chalk, 10, i => {
      const a = azimuth(i), radius = range(67, 71);
      return { position: [Math.sin(a) * radius, range(4, 9), 5 + Math.cos(a) * radius],
        scale: [range(3, 6), range(7, 15), range(2.8, 4.2)], rotation: [0, a, range(-.32, .32)],
        tint: stoneColors[i % 4] };
    });
    populate(cap, chalk, 10, i => {
      const a = azimuth(i), radius = range(35, 66);
      return { position: [Math.sin(a) * radius, range(30, 39), 5 + Math.cos(a) * radius],
        scale: [range(.75, 2.7), range(4.2, 12.5), range(.85, 2.75)], rotation: [range(-.25, .25), a, Math.PI + range(-.24, .24)],
        tint: stoneColors[i % 4] };
    });
  }

  const cutaway = (parent, x, y, z, w, h, d, tilt, material) => {
    const object = mesh(parent, boulder, material, x, y, z, w, h, d);
    object.rotation.set(.1, range(-.7, .7), tilt);
    return object;
  };
  const basinStone = surface('#5d5c65', .72);
  const floorStone = [surface('#726d69'), surface('#67656c'), surface('#837968'), surface('#625d61')];
  const paving = [];
  const path = (coordinates, width) => {
    const curve = new THREE.CatmullRomCurve3(coordinates.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    const steps = Math.ceil(curve.getLength() / .94);
    for (let i = 0; i <= steps; i++) {
      const p = curve.getPointAt(i / steps), t = curve.getTangentAt(i / steps);
      for (let j = 0; j < width; j++) {
        const side = (j - (width - 1) * .5) * .91 + range(-.055, .055);
        paving.push({ x: p.x + t.z * side, z: p.z - t.x * side, yaw: Math.atan2(t.x, t.z) + range(-.09, .09) });
      }
    }
  };
  path([[0, 36], [0, 27], [0, 18], [0, 8], [-4.6, 4], [-4.65, -.5], [0, -7], [0, -17]], 4);
  path([[0, 9], [4.6, 6], [5, 1], [4, -5.6], [0, -8.2]], 3);
  path([[-16, 18], [-8, 18.8], [0, 17.7], [8, 18.8], [16, 18]], 3);
  path([[-16, 7], [-10, 9], [0, 8.3], [10, 9], [16, 7]], 3);
  path([[-16, -7], [-8, -5], [0, -7], [8, -5], [16, -7]], 3);
  const pavingColors = ['#827b73', '#706c6a', '#8a7c66', '#776e6a', '#696574'];
  populate(stoneBox, chalk, paving.length, i => {
    const { x, z, yaw } = paving[i];
    return { position: [x, -.035 + i * .000013, z], scale: [range(.77, .86), .075, range(.74, .86)],
      rotation: [0, yaw, 0], tint: pavingColors[i % 5] };
  });
  const plazaRing = mesh(root, new THREE.RingGeometry(3.42, 4.18, 20), oldGold, 0, .01, 2);
  plazaRing.rotation.x = -Math.PI / 2;

  const archSeries = (parent, x, z, spring, radius, depth, material, sides = 11) => {
    for (let i = 0; i < sides; i++) {
      const a = (i + .5) * Math.PI / sides;
      const voussoir = block(parent, material, x + Math.cos(a) * radius, spring + Math.sin(a) * radius,
        z, Math.PI * radius / sides + .07, .57, depth);
      voussoir.rotation.z = a + Math.PI / 2;
    }
  };
  const passage = group(0, 31);
  occluders.push(passage);
  for (let i = 0; i < 12; i++) {
    const z = i * 1.09 - 2.5;
    const width = 4.85 - .19 * i;
    for (const side of [-1, 1]) {
      cutaway(passage, side * (width + .8), 1.45, z, 1.14, range(1.85, 2.5), 1.06, -side * .23, i % 2 ? rock[2] : wet);
    }
  }
  for (const z of [-.6, 3.9]) {
    const radius = z < 0 ? 2.55 : 2.3;
    archSeries(passage, 0, z, 2.65, radius, .65, surface('#77746d'), 10);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) block(passage, floorStone[i], side * radius, .35 + i * .66, z, .6, .69, .75);
      block(passage, amber, side * (radius + .48), 1.95, z - .42, .19, .36, .17);
    }
  }
  block(passage, surface('#121923'), 0, 2.3, 9.4, 7.6, 4.6, .7);
  const entryLight = new THREE.PointLight('#e8a962', 21, 13);
  entryLight.position.set(0, 2.5, 28.8);
  scene.add(entryLight);

  // The stone stair and open passage stay inside the existing sacred precinct.
  const temple = group(0, -22);
  occluders.push(temple);
  const masonry = surface('#898079');
  const trim = surface('#b5a18a');
  const recess = surface('#151927');
  const innerGold = surface('#b9a071', .54, '#c78d39', .25);
  for (let i = 0; i < 7; i++) {
    const width = 15.7 - i * .64;
    block(temple, floorStone[i % 4], 0, .14 + i * .19, 2.83 - i * .35, width, .28, 5.9);
    block(temple, trim, 0, .28 + i * .19, 5.76 - i * .35, width, .06, .12);
  }
  for (const side of [-1, 1]) {
    cutaway(temple, side * 9.7, 4, -4.5, 5, 7.5, 4.3, side * .19, rock[1]);
    cutaway(temple, side * 6.5, 7.65, -4.7, 4.25, 6.8, 3.75, -side * .26, rock[2]);
    for (let row = 0; row < 10; row++) {
      block(temple, floorStone[row % 4], side * (5.75 - row * .06), 1.23 + row * .92, -1.8,
        5.9 + (row % 2) * .15, .92, 3.08 - row * .055);
    }
    for (const x of [3.3, 6.7]) {
      block(temple, trim, side * x, 1.47, .31, 1.45, .35, 1.34);
      for (let drum = 0; drum < 8; drum++) pillar(temple, drum % 3 ? masonry : trim, side * x, 1.91 + drum * .77, .27, .55 - drum * .013, .78);
      block(temple, trim, side * x, 8.02, .27, 1.22, .44, 1.19);
    }
    block(temple, beam, side * 5.05, 5.67, -.12, 1.18, 3.55, .15);
    const banner = block(temple, surface('#633b47'), side * 5.05, 5.64, -.02, 1.06, 3.45, .045);
    banner.rotation.z = side * .035;
    const sigil = block(temple, oldGold, side * 5.05, 6.1, .03, .46, .46, .045);
    sigil.rotation.z = Math.PI / 4;
    for (let inset = 0; inset < 4; inset++) {
      const relief = block(temple, oldGold, side * (7.68 + inset * .26), 4.1, -.23, .065, 1.17 - inset * .12, .06);
      relief.rotation.z = -side * .2;
    }
  }
  archSeries(temple, 0, .48, 5.22, 2.54, .72, trim);
  archSeries(temple, 0, .89, 5.22, 2.03, .17, innerGold);
  for (const side of [-1, 1]) block(temple, trim, side * 2.52, 3.34, .45, .52, 3.77, .63);
  block(temple, recess, 0, 4.31, -4.2, 6.2, 7.4, .35);
  for (let i = 0; i < 5; i++) {
    block(temple, masonry, 0, 8.54 + i * .45, -1.21 - i * .26, 16.4 - i * 2.02, .46, 3.85);
  }
  const seal = mesh(temple, new THREE.TorusGeometry(.82, .074, 6, 32), innerGold, 0, 8.64, .81);
  seal.scale.y = .81;
  block(temple, oldGold, 0, 8.64, .86, .27, .27, .07).rotation.z = Math.PI / 4;
  for (let i = -3; i <= 3; i++) {
    block(temple, bronze, i * .47, 9.34, .46, .07, .27 + Math.abs(i % 2) * .14, .055).rotation.z = i * .075;
  }
  const templeLight = new THREE.PointLight('#edbf76', 83, 27);
  templeLight.position.set(0, 4.3, -12.5);
  scene.add(templeLight);

  const lantern = (parent, x, y, z) => {
    block(parent, beam, x, y + .3, z, .035, .42, .035);
    block(parent, amber, x, y, z, .15, .26, .15);
    for (const side of [-1, 1]) block(parent, beam, x, y + side * .14, z, .21, .045, .21);
  };
  const detailBench = (parent, x, z) => {
    block(parent, timber, x, .44, z, 1.42, .12, .4);
    for (const side of [-1, 1]) block(parent, beam, x + side * .47, .23, z, .11, .41, .3);
  };
  const roofs = [surface('#514553'), surface('#454a5d'), surface('#66554b')];
  houses.forEach(([x, z], i) => {
    const home = group(x, z);
    occluders.push(home);
    home.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
    const style = i % 3, width = 4.7 + .54 * style, depth = 3.45 + .38 * ((i + 1) % 3);
    const h = 2.48 + .45 * style;
    block(home, basinStone, 0, .17, 0, width + .2, .34, depth + .19);
    if (style !== 2) {
      for (let row = 0; row < 5; row++) {
        block(home, floorStone[(row + i) % 4], 0, .43 + row * h / 5, -.12,
          width - (row % 2) * .12, h / 5, depth);
      }
    } else {
      block(home, rock[3], 0, h * .43, -depth * .25, width, h * .87, depth * .57);
      block(home, timber, 0, h * .68, depth * .02, width * .86, h * .72, depth * .48);
    }
    for (const side of [-1, 1]) {
      block(home, beam, side * (width * .5 - .15), h * .5, depth * .46, .2, h, .24);
      const brace = block(home, timber, side * (width * .5 - .49), h * .77, depth * .51, .18, .85, .17);
      brace.rotation.z = side * .66;
      block(home, beam, side * width * .315, h * .58, depth * .508, .76, .63, .12);
      block(home, amber, side * width * .315, h * .58, depth * .58, .6, .45, .045);
      block(home, timber, side * width * .315, h * .58, depth * .61, .06, .5, .04);
    }
    block(home, beam, 0, .97, depth * .54, 1.05, 1.91, .16);
    for (let j = -2; j <= 2; j++) block(home, timber, j * .18, .93, depth * .57, .172, 1.72, .084);
    block(home, bronze, .28, 1.04, depth * .59, .13, .08, .07);
    block(home, basinStone, 0, .12, depth * .6, 1.5, .23, .61);
    lantern(home, .76, 2.16, depth * .6);
    if (style === 0) {
      for (const side of [-1, 1]) {
        const roofPanel = block(home, roofs[(i + 1) % 3], side * width * .264, h + .52, 0, width * .59, .26, depth + .79);
        roofPanel.rotation.z = -side * .32;
      }
      block(home, beam, 0, h + .96, 0, .26, .18, depth + .88);
    } else if (style === 1) {
      for (let course = 0; course < 4; course++) {
        block(home, floorStone[(course + 1) % 4], 0, h + .13 + course * .17, -.22,
          width + .42 - course * .57, .21, depth + .36 - course * .24);
      }
      block(home, bronze, 0, h + .17, depth * .54, width * .86, .09, .1);
    } else {
      const awning = block(home, roofs[0], 0, h - .04, depth * .42, width + .35, .22, depth * .94);
      awning.rotation.x = .24;
      cutaway(home, .2, h * .73, -depth * .46, width * .58, h * .69, .9, .15, rock[2]);
    }
    if (i % 2) detailBench(home, width * .28, depth * .52);
    else {
      pillar(home, timber, -width * .33, .4, depth * .48, .34, .7);
      pillar(home, bronze, -width * .33, .58, depth * .48, .35, .07);
      block(home, timber, -width * .19, .24, depth * .53, .46, .44, .53);
    }
  });

  for (const side of [-1, 1]) {
    const sanctuary = group(side * 22, -12);
    occluders.push(sanctuary);
    pillar(sanctuary, basinStone, 0, .14, 0, 3.73, .32);
    pillar(sanctuary, masonry, 0, .36, 0, 2.8, .19);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5 + .15) * TAU;
      const x = Math.cos(a) * 2.53, z = Math.sin(a) * 2.53;
      const height = i === 1 || i === 2 ? .67 : 2.3 + .33 * side;
      pillar(sanctuary, floorStone[i % 4], x, .4 + height / 2, z, .35, height);
      block(sanctuary, trim, x, height + .39, z, .8, .2, .78);
    }
    pillar(sanctuary, bronze, 0, .64, 0, .61, .49);
    mesh(sanctuary, cap, veins[side > 0 ? 0 : 1], 0, 1.19, 0, .49, .85, .48);
  }

  const groundDecor = [];
  const mineralFields = [[-32, 11], [32, 15], [-31, -10], [32, -13], [-17, 31], [17, 33], [5.5, 33], [-5, 35]];
  const mineralLight = new THREE.PointLight('#87a7e5', 38, 19);
  mineralLight.position.set(-29, 2.8, 10.5);
  scene.add(mineralLight);
  mineralFields.forEach(([x, z], i) => {
    for (let n = 0; n < 8; n++) {
      const px = x + range(-1.8, 1.8), pz = z + range(-2.25, 2.25);
      const length = range(.14, .66);
      const axis = range(-.63, .63);
      const crystal = mesh(root, shard, veins[(i + n) % 2], px, length * .31, pz, length * .26, length, length * .26);
      crystal.rotation.z = axis;
      const tip = mesh(root, cap, crystal.material, px - Math.sin(axis) * length * .61,
        length * .31 + Math.cos(axis) * length * .61, pz, length * .202, length * .33, length * .202);
      tip.rotation.z = axis;
      groundDecor.push({ x: px, z: pz, size: range(.25, .78) });
      if (n % 3 === 0) {
        const h = range(.12, .31);
        pillar(root, moss, px + .35, h * .48, pz + .32, h * .22, h);
        mesh(root, boulder, fungus, px + .35, h, pz + .32, h * .64, h * .3, h * .56);
      }
    }
  });
  populate(boulder, chalk, groundDecor.length, i => {
    const { x, z, size } = groundDecor[i];
    return { position: [x, .026, z], scale: [size, size * .23, size * .72],
      rotation: [0, i * .7, 0], tint: i % 5 === 0 ? '#4b6659' : stoneColors[i % 5] };
  });

  const clock = { value: 0 };
  const water = new THREE.MeshStandardMaterial({ color: '#466f7c', roughness: .25, metalness: .12, emissive: '#233b54', emissiveIntensity: .28 });
  water.onBeforeCompile = shader => {
    shader.uniforms.seepTime = clock;
    shader.vertexShader = 'varying vec3 seepWorld;\n' + shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      seepWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    `);
    shader.fragmentShader = 'uniform float seepTime; varying vec3 seepWorld;\n' + shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec2 p = seepWorld.xz;
      float ripple = sin(length(vec2(p.x * .7, sin(p.y * .55) * 3.0)) * 7.3 - seepTime * 2.1);
      float glint = smoothstep(.81, 1.0, ripple * sin(p.y * 2.1 + p.x * .62 + seepTime * .74));
      diffuseColor.rgb *= .78 + glint * .65 + .16 * sin(p.y * 2.65 + seepWorld.y * 8.0 + seepTime);
    `);
  };
  const pools = [[-34, 9, 2.6, 7.4], [34, 12, 3.2, 8], [-10, 33, 3.9, 1.5], [8, 33, 3.1, 1.3]];
  const poolShape = new THREE.CircleGeometry(1, 27);
  const perimeter = poolShape.attributes.position;
  for (let i = 1; i < perimeter.count; i++) {
    const a = i * TAU / 27, r = 1 + Math.sin(a * 5) * .062 + Math.cos(a * 3) * .11;
    perimeter.setXY(i, perimeter.getX(i) * r, perimeter.getY(i) * r);
  }
  poolShape.rotateX(-Math.PI / 2);
  pools.forEach(([x, z, w, d], i) => {
    mesh(root, poolShape, wet, x, -.07, z, w * 1.16, 1, d * 1.12);
    mesh(root, poolShape, water, x, -.035, z, w, 1, d);
    for (const side of [-1, 1]) {
      cutaway(root, x + side * w, .18, z + side * d * .54, .72, .45, 1.9, side * .12, wet);
      cutaway(root, x + side * w * .82, .11, z - side * d * .36, .58, .28, 1.28, side * .15, moss);
    }
    if (i < 2) for (let n = 0; n < 6; n++) {
      block(root, timber, x, .055, z + (n - 2.5) * .35, w * 2.0, .105, .31);
    }
  });
  for (const [x, z, h, side] of [[-36.7, 8, 5.1, -1], [36.9, 14, 6.7, 1]]) {
    const spring = group(x, z);
    occluders.push(spring);
    for (let i = 0; i < 5; i++) {
      cutaway(spring, side * (.42 + i * .16), h * (.11 + i * .19), (i % 3 - 1) * .43,
        .91 + i * .105, 1.22 + i * .10, 1.3, side * .16, i % 2 ? wet : rock[1]);
    }
    for (let i = 0; i < 3; i++) {
      const trickle = block(spring, surface('#6b939b', .35, '#4a7384', .26), -side * (.57 - i * .15),
        h * (.35 + .073 * i), -.48 + i * .37, .065, h * (.68 + .11 * i), .07 + .025 * i);
      trickle.rotation.z = side * .12;
    }
  }
  const motes = Array.from({ length: 84 }, (_, i) => {
    const [x, z, w, d] = pools[i % pools.length];
    const drop = i % 3 === 0;
    return { x: x + range(-w * .85, w * .85), z: z + range(-d * .76, d * .76), h: range(.4, drop ? 6 : 1.35),
      phase: range(0, 1), speed: range(.3, .84), drop };
  });
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new THREE.Float32BufferAttribute(new Float32Array(motes.length * 3), 3);
  particlePositions.setUsage(THREE.DynamicDrawUsage);
  particleGeometry.setAttribute('position', particlePositions);
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
    color: '#8dc7c5', size: .075, opacity: .46, transparent: true, depthWrite: false,
  }));
  particles.frustumCulled = false;
  root.add(particles);
  const update = time => {
    clock.value = time;
    motes.forEach(({ x, z, h, phase, speed, drop }, i) => {
      const drift = time * speed + phase;
      particlePositions.setXYZ(i, x + (drop ? 0 : Math.sin(drift) * .31),
        drop ? h * (1 - drift % 1) ** 2 : h + Math.sin(drift * 2) * .3,
        z + (drop ? 0 : Math.cos(drift) * .42));
    });
    particlePositions.needsUpdate = true;
  };
  // Repeated masonry courses and timber pieces share a draw call within each cutaway section.
  for (const section of occluders) {
    const byGeometry = new Map();
    for (const object of section.children) {
      if (!object.isMesh) continue;
      if (!byGeometry.has(object.geometry)) byGeometry.set(object.geometry, new Map());
      const byMaterial = byGeometry.get(object.geometry);
      if (!byMaterial.has(object.material)) byMaterial.set(object.material, []);
      byMaterial.get(object.material).push(object);
    }
    byGeometry.forEach((byMaterial, geometry) => byMaterial.forEach((pieces, material) => {
      if (pieces.length < 3) return;
      const instances = new THREE.InstancedMesh(geometry, material, pieces.length);
      pieces.forEach((piece, index) => {
        piece.updateMatrix();
        instances.setMatrixAt(index, piece.matrix);
        section.remove(piece);
      });
      section.add(instances);
    }));
  }
  update(0);
  return { occluders, update };
}

export function createTempleCutaway(groups) {
  const ray = new THREE.Raycaster();
  const eye = new THREE.Vector3(), focus = new THREE.Vector3(), direction = new THREE.Vector3();
  const lastEye = new THREE.Vector3(Infinity, Infinity, Infinity), lastFocus = lastEye.clone();
  const lastTarget = lastEye.clone();
  const hits = [];
  const layers = groups.map(group => {
    const bounds = new THREE.Box3().setFromObject(group);
    const materials = new Map(), meshes = [];
    group.traverse(object => {
      if (!object.isMesh || !object.material || object.material.transparent) return;
      const original = object.material;
      if (!materials.has(original)) materials.set(original, original.clone());
      object.material = materials.get(original);
      meshes.push(object);
    });
    return { bounds, materials, meshes, opacity: 1, blocked: false };
  });
  const clearView = (target, height) => {
    direction.copy(target).sub(eye);
    direction.y += height;
    ray.far = Math.max(0, direction.length() - .17);
    ray.set(eye, direction.normalize());
    layers.forEach(layer => {
      if (layer.blocked || !ray.ray.intersectsBox(layer.bounds)) return;
      hits.length = 0;
      ray.intersectObjects(layer.meshes, false, hits);
      layer.blocked = hits.length > 0;
    });
  };
  return {
    update(camera, player, nearby, dt, reduced) {
      camera.getWorldPosition(eye);
      player.getWorldPosition(focus);
      const changed = lastEye.distanceToSquared(eye) > .0004 || lastFocus.distanceToSquared(focus) > .0004 ||
        (nearby ? lastTarget.distanceToSquared(nearby) > .0004 : Number.isFinite(lastTarget.x));
      if (changed) {
        lastEye.copy(eye);
        lastFocus.copy(focus);
        if (nearby) lastTarget.copy(nearby);
        else lastTarget.set(Infinity, Infinity, Infinity);
        layers.forEach(layer => { layer.blocked = false; });
        clearView(focus, .68);
        clearView(focus, 1.7);
        if (nearby) clearView(nearby, .15);
      }
      layers.forEach(layer => {
        const target = layer.blocked ? .13 : 1;
        const opacity = reduced || target < layer.opacity ? target : Math.min(1, layer.opacity + dt * 4.2);
        if (layer.opacity === opacity) return;
        layer.opacity = opacity;
        layer.materials.forEach(material => {
          material.opacity = opacity;
          const transparent = opacity < 1;
          if (material.transparent !== transparent) {
            material.transparent = transparent;
            material.depthWrite = !transparent;
            material.needsUpdate = true;
          }
        });
      });
    },
    // The scene traversal also disposes the clones. Some original surfaces are exclusive to the cutaway groups.
    originalMaterials: new Set(layers.flatMap(layer => Array.from(layer.materials.keys()))),
  };
}
