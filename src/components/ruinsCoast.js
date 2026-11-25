import * as THREE from 'three';
import { createRapidsWater } from './rapidsScenery';
import { COLUMNS, SHIPWRECK, SHORE_POINTS, SHRINES, shorePoint } from './ruinsWorld';

const TAU = Math.PI * 2;
const shoreline = Array.from({ length: SHORE_POINTS }, (_, index) => shorePoint(index));

const seaVertex = `
  #include <fog_pars_vertex>
  uniform float tide;
  varying vec3 world;
  void main() {
    world = (modelMatrix * vec4(position, 1.0)).xyz;
    vec3 surface = position;
    surface.z += .048 * sin(world.x * .31 + world.z * .24 + tide)
               + .026 * sin(world.z * .66 + tide * 1.4);
    vec4 mvPosition = modelViewMatrix * vec4(surface, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const seaFragment = `
  #include <fog_pars_fragment>
  uniform float tide;
  uniform vec3 ocean;
  uniform vec3 turquoise;
  uniform vec3 maritime;
  uniform vec3 foam;
  uniform vec3 sunlight;
  uniform vec3 shallows[${SHRINES.length + COLUMNS.length + 1}];
  varying vec3 world;
  void main() {
    vec2 p = world.xz;
    float angle = atan(p.x, p.y + .0001);
    float coast = 37.8 + sin(angle * 5.0) * 1.3 + cos(angle * 9.0) * .55 - length(p);
    float shallow = (1.0 - smoothstep(.0, 9.0, coast)) * smoothstep(-1.8, 1.0, coast);
    float edge = coast;
    for (int i = 0; i < ${SHRINES.length + COLUMNS.length + 1}; ++i) {
      float distanceToRock = length(p - shallows[i].xy) - shallows[i].z;
      shallow = max(shallow, (1.0 - smoothstep(.0, 3.4, distanceToRock)) * .88);
      edge = min(edge, distanceToRock);
    }
    float wave = sin(dot(p, vec2(.56, .4)) + tide * 1.2);
    float crossing = sin(dot(p, vec2(-.91, .35)) - tide * .83 + wave * .45);
    vec3 normal = normalize(vec3(.08 * wave + .035 * crossing, 1.0, .094 * crossing + .03 * wave));
    vec3 view = normalize(cameraPosition - world);
    float fresnel = pow(1.0 - clamp(dot(normal, view), 0.0, 1.0), 4.0);
    float glint = pow(max(dot(reflect(-normalize(vec3(-.56, .5, -.65)), normal), view), 0.0), 42.0);
    float cells = abs(sin(p.x * 1.84 + crossing * 1.5) * sin(p.y * 1.52 + wave * 1.45));
    float caustic = smoothstep(.76, .98, cells) * shallow;
    float breaker = edge - .28 - .42 * sin(tide * 1.05 + angle * 10.0);
    float wash = (1.0 - smoothstep(.025, .34, abs(breaker))) * (.51 + .32 * crossing);
    wash += (1.0 - smoothstep(.035, .23, abs(edge - 1.05 + .22 * wave))) * .17;
    vec3 color = mix(ocean, turquoise, shallow * .78 + .045 * wave);
    color = mix(color, maritime, fresnel * .31);
    color = mix(color, foam, clamp(wash * .83 + caustic * .13, 0.0, .9));
    color += sunlight * min(.43, glint * .42);
    gl_FragColor = vec4(color, min(1.0, 1.0 - shallow * .41 + wash * .4 + fresnel * .15));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export function createCoveCoast(scene) {
  const coast = new THREE.Group();
  scene.add(coast);
  let seed = 43731;
  const range = (min, max) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return min + (max - min) * (seed / 4294967296);
  };
  const material = (color, roughness = .89) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
  const put = (parent, geometry, surface, x, y, z) => {
    const object = new THREE.Mesh(geometry, surface);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  };
  const sand = ['#798b76', '#9c9e83', '#ac9975', '#d9c49a', '#c7ae85', '#8b8d64', '#736f5a', '#62685a'];
  const strata = [
    [-10, -1.4], [-4, -.67], [-.3, -.09], [1.55, .17], [4.5, .34], [8.2, .55], [11.7, .44], [15.8, -.6],
  ];
  const beachHeight = (index, layer) => {
    const a = index * TAU / SHORE_POINTS;
    return strata[layer][1] + (.09 * Math.sin(a * 6.0) + .06 * Math.cos(a * 13)) * Math.min(layer / 3, 1);
  };
  const positions = [], colors = [], indices = [];
  const tint = new THREE.Color();
  shoreline.forEach(({ x, z }, index) => {
    const radius = Math.hypot(x, z);
    strata.forEach(([offset], layer) => {
      const scale = 1 + (offset + (layer > 2 ? .48 * Math.sin(index * .83 + layer) : 0)) / radius;
      const bankX = x * scale, bankZ = z * scale;
      const mouth = bankZ > 24 ? 1 - THREE.MathUtils.smoothstep(Math.abs(bankX), 5.5, 10) : 0;
      positions.push(bankX, beachHeight(index, layer) - 2 * mouth, bankZ);
      tint.set(sand[layer]).multiplyScalar(1 + .07 * Math.sin(index * 1.51 + layer) + .055 * Math.cos(index * .69));
      colors.push(tint.r, tint.g, tint.b);
      if (layer > 0) {
        const a = index * strata.length + layer;
        const b = ((index + 1) % SHORE_POINTS) * strata.length + layer;
        indices.push(a - 1, b - 1, a, a, b - 1, b);
      }
    });
  });
  const beach = new THREE.BufferGeometry();
  beach.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  beach.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  beach.setIndex(indices);
  beach.computeVertexNormals();
  put(coast, beach, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }), 0, 0, 0);
  const seaPlane = new THREE.PlaneGeometry(206, 206, 64, 64);
  const seabed = put(coast, seaPlane, material('#637d73'), 0, -1.6, 0);
  seabed.rotation.x = -Math.PI / 2;
  const tide = { value: 0 };
  const sea = put(coast, seaPlane, new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), tide,
      ocean: { value: new THREE.Color('#164e63') },
      turquoise: { value: new THREE.Color('#2dd4bf') },
      maritime: { value: new THREE.Color('#38bdf8') },
      foam: { value: new THREE.Color('#f1f5f9') },
      sunlight: { value: new THREE.Color('#e8b86d') },
      shallows: { value: [
        ...SHRINES.map(({ x, z }) => new THREE.Vector3(x, z, 2.8)),
        ...COLUMNS.map(([x, z]) => new THREE.Vector3(x, z, 1.0)),
        new THREE.Vector3(SHIPWRECK.x, SHIPWRECK.z, 2.7),
      ] },
    },
    vertexShader: seaVertex, fragmentShader: seaFragment, fog: true, transparent: true, depthWrite: false,
  }), 0, 0, 0);
  sea.rotation.x = -Math.PI / 2;
  sea.renderOrder = -1;

  const rock = new THREE.IcosahedronGeometry(1, 1);
  const vertices = rock.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const noise = 1 + .15 * Math.sin(x * 7 + y * 8) + .13 * Math.cos(z * 9 - y * 3);
    vertices.setXYZ(i, x * noise + .24 * y, y * noise, z * noise);
  }
  rock.computeVertexNormals();
  const block = new THREE.BoxGeometry(1, 1, 1);
  const post = new THREE.CylinderGeometry(.85, 1, 1, 7);
  const transform = new THREE.Object3D();
  const set = (instances, i, x, y, z, sx, sy, sz, yaw, color, lean = 0) => {
    transform.position.set(x, y, z);
    transform.scale.set(sx, sy, sz);
    transform.rotation.set(0, yaw, lean);
    transform.updateMatrix();
    instances.setMatrixAt(i, transform.matrix);
    instances.setColorAt(i, tint.set(color));
  };
  const batch = (geometry, surface, count) => {
    const instances = new THREE.InstancedMesh(geometry, surface, count);
    coast.add(instances);
    return instances;
  };
  const stones = ['#64748b', '#575e62', '#828984', '#6f775d', '#918775'];
  // Trace the rapids upstream from the arrival basin. The upper bend disappears
  // behind the canyon walls; at the lower end the foam fades into the cove.
  const riverSections = [
    // centre x, elevation, z, half-width
    [0, .11, 28, 7.4], [0, .15, 35, 6.7], [0, .4, 41, 6.2],
    [-.5, 1.1, 46, 5.8], [-1, 2.8, 49, 5.4], [-1, 3.2, 55, 5.2],
    [1, 4.2, 62, 5.1], [5, 5.8, 68, 4.8], [12, 7.2, 73, 4.6],
    [21, 8.5, 78, 4.4], [28, 9.2, 87, 4.1],
  ];
  const channel = new THREE.PlaneGeometry(1, 1, 1, riverSections.length - 1);
  const channelPoints = channel.attributes.position, channelUV = channel.attributes.uv;
  const walls = batch(rock, material('#ffffff'), (riverSections.length - 2) * 2);
  riverSections.forEach(([x, y, z, halfWidth], row) => {
    for (const [column, side] of [[0, -1], [1, 1]]) {
      const index = row * 2 + column;
      channelPoints.setXYZ(index, x + side * halfWidth, y, z);
      channelUV.setXY(index, column, (z - 28) / 59);
      if (row < 2) continue;
      const height = Math.min(8, 1.5 + (row - 2) * 1.25);
      set(walls, (row - 2) * 2 + column, x + side * (halfWidth + 2.4),
        y + height * .16, z, 4.1, height, 6.4, side * row * .32, stones[(row + column) % stones.length]);
    }
  });
  channel.computeBoundingSphere();
  const current = put(coast, channel, createRapidsWater(tide, false, true), 0, 0, 0);
  current.renderOrder = 1;
  const wood = ['#78583d', '#8c6a4d', '#9e8060', '#594735'];
  const plants = ['#496b45', '#60764b', '#777e51', '#959262'];
  const grassPositions = [];
  for (let blade = 0; blade < 7; blade++) {
    const a = blade * TAU / 7, x = Math.cos(a), z = Math.sin(a);
    grassPositions.push(z * .08, 0, -x * .08, -z * .08, 0, x * .08, x * .53, .66 + .28 * Math.sin(blade * 1.4), z * .53);
  }
  const grass = new THREE.BufferGeometry();
  grass.setAttribute('position', new THREE.Float32BufferAttribute(grassPositions, 3));
  grass.computeVertexNormals();
  const grassSurface = new THREE.MeshStandardMaterial({ roughness: 1, side: THREE.DoubleSide });
  grassSurface.onBeforeCompile = shader => {
    shader.uniforms.tide = tide;
    shader.vertexShader = 'uniform float tide;\n' + shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      transformed.x += position.y * position.y * sin(tide * 1.65 + instanceMatrix[3].z * .47) * .23;
    `);
  };
  for (let sector = 0; sector < 8; sector++) {
    const boulders = batch(rock, material('#ffffff', .68), 20);
    const grasses = batch(grass, grassSurface, 42);
    const shells = batch(rock, material('#ffffff'), 22);
    const driftwood = batch(post, material('#ffffff'), 5);
    const centre = sector * 7 + range(1.5, 5.5);
    const placement = (i, offset) => {
      const index = sector * 7 + Math.floor(range(0, 7));
      const point = shoreline[i % 3 === 0 ? index : Math.round(centre + range(-2.3, 2.3)) % SHORE_POINTS];
      const scale = 1 + offset / Math.hypot(point.x, point.z);
      let x = point.x * scale + range(-.8, .8);
      const z = point.z * scale + range(-.8, .8);
      if (z > 30 && Math.abs(x) < 9) x += x < 0 ? -10 : 10;
      return [x, z];
    };
    for (let i = 0; i < 20; i++) {
      const offshore = i < 7;
      const [x, z] = placement(i, offshore ? range(-1.9, -.3) : range(3.5, 11));
      const size = range(.3, 1.45);
      set(boulders, i, x, offshore ? -.27 : .36, z, size * 1.32, offshore ? .5 : .27, size * .84, range(0, TAU), stones[i % stones.length]);
    }
    for (let i = 0; i < 42; i++) {
      const [x, z] = placement(i, range(4.2, 11.3));
      set(grasses, i, x, .42, z, range(.32, .8), range(.19, .48), range(.3, .65), range(0, TAU), plants[i % plants.length]);
    }
    for (let i = 0; i < 22; i++) {
      const [x, z] = placement(i, range(1.85, 4.15));
      set(shells, i, x, .34, z, range(.06, .15), .038, range(.06, .17), range(0, TAU), i % 4 ? '#e3d8ba' : '#bd8061');
    }
    for (let i = 0; i < 5; i++) {
      const [x, z] = placement(i, range(1.55, 6.3));
      set(driftwood, i, x, .43, z, .15, range(.85, 2.4), .13, 0, wood[i % wood.length], range(1.38, 1.68));
    }
  }

  // Buildings and cliff silhouettes start beyond the maximum orbit reach. The whole inner coast is a cutaway.
  const cliffStone = material('#64748b');
  const cliffShade = material('#49585d');
  const cliffMoss = material('#496b45');
  const cliffs = [
    { x: -25, z: -75, size: 1.2 }, { x: 31, z: -74, size: 1.05 },
    { x: 78, z: -18, size: .84 }, { x: -78, z: 22, size: .76 },
    { x: 28, z: 74, size: .92 },
  ];
  cliffs.forEach(({ x, z, size }, i) => {
    const promontory = put(coast, rock, cliffStone, x, 2, z);
    promontory.scale.set(9.2 * size, 6.1 * size, 8.8 * size);
    promontory.rotation.y = i * 1.4;
    for (let j = 0; j < 5; j++) {
      const angle = j * TAU / 5;
      const crag = put(coast, rock, j % 2 ? cliffShade : cliffStone, x + Math.sin(angle) * 4.7, 1.1 + j * .32, z + Math.cos(angle) * 4.4);
      crag.scale.set(range(2.6, 4.4), range(2.4, 5.7) * size, range(2.3, 3.9));
      crag.rotation.y = angle;
      const moss = put(coast, rock, cliffMoss, crag.position.x, crag.position.y + crag.scale.y * .76, crag.position.z);
      moss.scale.set(crag.scale.x * .81, .48, crag.scale.z * .78);
    }
  });
  const arch = new THREE.Group();
  arch.position.set(57, 0, -56);
  arch.rotation.y = -.68;
  coast.add(arch);
  for (let i = 0; i <= 10; i++) {
    const angle = i * Math.PI / 10;
    const segment = put(arch, rock, i % 3 === 0 ? cliffShade : cliffStone,
      6.9 * Math.cos(angle), 1.25 + 7.1 * Math.sin(angle), .4 * Math.sin(i * 2));
    segment.scale.set(range(1.7, 2.25), range(1.8, 2.55), range(2.0, 3.05));
    segment.rotation.z = angle * .7;
  }
  const lighthouse = new THREE.Group();
  lighthouse.position.set(-25, 7, -75);
  coast.add(lighthouse);
  const masonry = [material('#85867a'), material('#a9a38d'), material('#736f64')];
  for (let row = 0; row < 11; row++) {
    const radius = 2.48 - row * .078;
    const course = put(lighthouse, post, masonry[row % 3], 0, .47 + row * .93, 0);
    course.scale.set(radius, .96, radius);
    course.rotation.y = row % 2 ? .2 : .27;
  }
  put(lighthouse, new THREE.CylinderGeometry(2.18, 1.85, .64, 9), masonry[1], 0, 10.35, 0);
  const metal = material('#424946');
  const lamp = new THREE.MeshStandardMaterial({ color: '#ffe1a1', emissive: '#e8b86d', emissiveIntensity: .75 });
  put(lighthouse, new THREE.CylinderGeometry(.66, .83, 1.56, 8), lamp, 0, 11.7, 0);
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8;
    const strut = put(lighthouse, post, metal, 1.68 * Math.sin(a), 11.65, 1.68 * Math.cos(a));
    strut.scale.set(.12, 2.12, .12);
  }
  put(lighthouse, new THREE.ConeGeometry(2.48, 2.5, 8), metal, 0, 13.7, 0);
  put(lighthouse, new THREE.SphereGeometry(.22, 8, 6), lamp, 0, 15.02, 0);
  for (let row = 0; row < 3; row++) {
    const slit = put(lighthouse, block, metal, .21 * (row - 1), 2.28 + row * 2.56, 2.36 - row * .24);
    slit.scale.set(.32, .75, .11);
  }

  const dock = (index, sideways) => {
    const { x, z } = shoreline[index];
    const angle = Math.atan2(x, z);
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = angle;
    coast.add(group);
    const planks = wood.map(color => material(color));
    for (let i = 0; i < 16; i++) {
      const deck = put(group, block, planks[i % planks.length], 0, .38, -2.15 + i * .36);
      deck.scale.set(3.6 + range(-.22, .12), .14, .33);
      deck.rotation.y = range(-.04, .04);
    }
    for (const side of [-1, 1]) {
      const support = put(group, block, planks[3], side * 1.3, .24, .42);
      support.scale.set(.2, .2, 5.6);
      for (let i = 0; i < 4; i++) {
        const pile = put(group, post, planks[0], side * 1.58, .03, -2.1 + i * 1.63);
        pile.scale.set(.15, 1.55, .16);
        const rope = put(group, new THREE.TorusGeometry(.15, .031, 4, 10), planks[2], pile.position.x, .65, pile.position.z);
        rope.rotation.x = Math.PI / 2;
      }
    }
    const cargo = put(group, block, planks[3], sideways * .94, .58, 2.45);
    cargo.scale.set(.62, .43, .54);
    const barrel = put(group, post, planks[1], -sideways * 1.13, .59, 2.85);
    barrel.scale.set(.26, .42, .26);
    const rail = put(group, post, planks[2], sideways * 1.39, .52, 3.23);
    rail.scale.set(.22, .54, .22);
  };
  dock(4, 1);
  dock(20, -1);
  dock(50, 1);

  const wallStones = batch(block, material('#ffffff'), 24);
  for (let i = 0; i < 24; i++) {
    const { x, z } = shoreline[24 + Math.floor(i / 8) * 2];
    const angle = Math.atan2(x, z);
    const along = (i % 8 - 3.5) * .71;
    set(wallStones, i, x * 1.11 + Math.cos(angle) * along, .42 + range(.04, .1),
      z * 1.11 - Math.sin(angle) * along, range(.59, .78), range(.27, .52), range(.59, .82),
      angle + range(-.13, .13), stones[i % stones.length]);
  }

  const skiffSurface = [material('#604631'), material('#78583d'), material('#a3845c')];
  const boats = [12, 36, 44].map((index, i) => {
    const { x, z } = shoreline[index];
    const boat = new THREE.Group();
    boat.position.set(x * .976, .07, z * .976);
    boat.rotation.y = Math.atan2(x, z) + 1.04;
    boat.scale.setScalar(.58 + i * .055);
    coast.add(boat);
    addCoveHull(boat, (parent, geometry, shade, bx, by, bz) => put(parent, geometry, skiffSurface[shade], bx, by, bz));
    return boat;
  });
  const wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, .51, .1, .03, 1.16, -.12, -.28,
    0, 0, -.16, 0, 0, 0, 1.16, -.12, -.28,
  ], 3));
  const feathers = new THREE.MeshBasicMaterial({ color: '#ede7d9', side: THREE.DoubleSide });
  const gulls = Array.from({ length: 4 }, () => {
    const bird = new THREE.Group();
    const left = put(bird, wing, feathers, 0, 0, 0);
    const right = put(bird, wing, feathers, 0, 0, 0);
    left.scale.x = -1;
    coast.add(bird);
    return { bird, left, right };
  });
  const update = elapsed => {
    tide.value = elapsed;
    boats.forEach((boat, i) => {
      boat.position.y = .07 + Math.sin(elapsed * 1.15 + i) * .045;
      boat.rotation.z = Math.sin(elapsed * .91 + i * 2) * .045;
    });
    gulls.forEach(({ bird, left, right }, i) => {
      const angle = elapsed * .14 + i * .23 + .2;
      bird.position.set(-27 + 11 * Math.sin(angle), 11 + i * .7 + Math.sin(angle * 2), -77 + 6 * Math.cos(angle));
      bird.rotation.y = Math.atan2(11 * Math.cos(angle), -6 * Math.sin(angle));
      right.rotation.z = Math.sin(elapsed * 4.1 + i * 1.9) * .28;
      left.rotation.z = -right.rotation.z;
    });
  };
  update(0);
  return update;
}

export function addCoveHull(parent, add, damaged = false) {
  const stations = [[-2.8, .13], [-2.12, .84], [-1.27, 1.29], [-.18, 1.47], [.94, 1.36], [1.86, 1.05], [2.43, .63]];
  const planks = [[], [], []];
  for (const side of [-1, 1]) {
    for (let i = 0; i < stations.length - 1; i++) {
      const [z0, w0] = stations[i], [z1, w1] = stations[i + 1];
      const broken = damaged && side === 1 && i === 4;
      for (let strake = 0; strake < (broken ? 1 : 3); strake++) {
        const lower = strake * .24, upper = lower + .255;
        const endRise = z => Math.abs(z) ** 2 * .035;
        const point = (z, w, y) => [side * w * (.62 + y * .51), y - .26 + endRise(z), z];
        const a = point(z0, w0, lower), b = point(z1, w1, lower);
        const c = point(z0, w0, upper), d = point(z1, w1, upper);
        planks[strake].push(...(side === 1 ? [...a, ...c, ...b, ...b, ...c, ...d] : [...a, ...b, ...c, ...b, ...d, ...c]));
      }
    }
  }
  planks.forEach((positions, strake) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    add(parent, geometry, strake, 0, 0, 0).material.side = THREE.DoubleSide;
  });
  for (let i = 0; i < 5; i++) {
    const [z, width] = stations[i + 1];
    add(parent, new THREE.BoxGeometry(width * 1.5, .12, .88), 2, 0, .4 + .018 * i, z);
  }
}

export function createCoveOcclusion(groups, { blockedOpacity = .14, forcedOpacity = null } = {}) {
  const meshes = [], owners = new Map();
  const layers = groups.map(group => {
    const layer = { materials: new Set(), opacity: 1, blocked: false };
    group.traverse(object => {
      if (!object.isMesh || !object.material || object.material.transparent) return;
      meshes.push(object);
      owners.set(object, layer);
      layer.materials.add(object.material);
    });
    return layer;
  });
  const setOpacity = (layer, opacity, force = false) => {
    if (!force && opacity === layer.opacity) return;
    layer.opacity = opacity;
    layer.materials.forEach(surface => {
      surface.opacity = opacity;
      const transparent = opacity < 1;
      if (surface.transparent !== transparent) {
        surface.transparent = transparent;
        surface.depthWrite = !transparent;
        surface.needsUpdate = true;
      }
    });
  };
  const ray = new THREE.Raycaster();
  const direction = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const focus = new THREE.Vector3();
  const previousEye = new THREE.Vector3(Infinity, Infinity, Infinity);
  const previousFocus = previousEye.clone();
  const hits = [];
  let previousGateHeight;
  return (camera, player, dt, immediate, gateHeight) => {
    if (forcedOpacity !== null) {
      layers.forEach(layer => setOpacity(layer, forcedOpacity, true));
      return;
    }
    camera.getWorldPosition(origin);
    player.getWorldPosition(focus);
    if (previousEye.distanceToSquared(origin) > .0004 || previousFocus.distanceToSquared(focus) > .0004 ||
        previousGateHeight === undefined || Math.abs(previousGateHeight - gateHeight) > .02) {
      previousEye.copy(origin);
      previousFocus.copy(focus);
      previousGateHeight = gateHeight;
      groups.forEach(group => group.updateWorldMatrix(true, true));
      layers.forEach(layer => { layer.blocked = false; });
      for (const height of [.35, 1.1, 1.85]) {
        direction.copy(focus).sub(origin);
        direction.y += height;
        ray.far = Math.max(0, direction.length() - .12);
        ray.set(origin, direction.normalize());
        hits.length = 0;
        ray.intersectObjects(meshes, false, hits);
        hits.forEach(hit => { owners.get(hit.object).blocked = true; });
      }
    }
    layers.forEach(layer => {
      const target = layer.blocked ? blockedOpacity : 1;
      // Clear newly obstructing silhouettes immediately, then ease the restoration.
      const opacity = immediate || target < layer.opacity ? target : Math.min(target, layer.opacity + dt * 4.6);
      setOpacity(layer, opacity);
    });
  };
}
