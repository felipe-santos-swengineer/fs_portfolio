import * as THREE from 'three';

const bankProfile = '9.65 + 0.58 * sin(z * 0.19 + side) + 0.37 * sin(z * 0.43 - side)';
const bankEdge = (z, side) => 9.65 + 0.58 * Math.sin(z * 0.19 + side) + 0.37 * Math.sin(z * 0.43 - side);

const waterVertex = `
  #include <fog_pars_vertex>
  varying vec2 surface;
  varying vec3 world;
  void main() {
    surface = uv;
    world = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const waterFragment = `
  #include <fog_pars_fragment>
  uniform float time;
  uniform float waterfall;
  uniform float outlet;
  uniform vec3 deep;
  uniform vec3 shallow;
  uniform vec3 foam;
  varying vec2 surface;
  varying vec3 world;
  void main() {
    float x = world.x;
    float z = world.z;
    float side = sign(x);
    float edge = ${bankProfile};
    float shore = smoothstep(edge - 2.3, edge + .2, abs(x));
    float throat = .5 + .5 * sin(z * .125 + .8);
    float flow = z + time * (5.4 + 1.5 * cos(x * .32));
    float crossWave = sin(x * 2.6 + sin(flow * .57) * 1.6 + z * .12);
    float chop = sin(flow * 1.9 + crossWave * 1.7) * sin(flow * .73 - x * 1.66);
    float curl = sin(flow * .97 + 2.6 * sin(x * 1.1 + flow * .22));
    float eddy = sin(16.0 * length(vec2(mod(x + 3.0, 6.0) - 3.0, mod(z + 9.0, 18.0) * .35 - 3.15)) - time * 3.0);
    float white = smoothstep(.61, .97, chop * .55 + curl * .45 + shore * (.22 + eddy * .12) + throat * .12);
    float opacity = mix(1.0, .68, shore);
    vec3 color = mix(deep, shallow, clamp(.19 + .17 * crossWave + .16 * chop + .42 * shore, 0.0, 1.0));
    vec3 view = normalize(cameraPosition - world);
    float reflection = pow(1.0 - abs(view.y), 3.0);
    color = mix(color, foam, white * .84 + reflection * (.07 + .05 * curl));
    if (waterfall > .5) {
      vec2 uv = surface;
      float streak = sin(uv.x * 49.0 + sin(uv.y * 17.0 + time * 2.0) * 1.1);
      float drop = uv.y + time * .83;
      float cascade = sin(drop * 33.0 + streak * 1.45) * sin(drop * 12.0 - uv.x * 17.0);
      color = mix(shallow * .57, foam, clamp(.43 + streak * .19 + cascade * .27 + (1.0 - uv.y) * .18, 0.0, 1.0));
      opacity = smoothstep(0.0, .13, min(uv.x, 1.0 - uv.x)) * .94;
    }
    if (outlet > .5) opacity *= smoothstep(0.0, .16, surface.y) * smoothstep(0.0, .10, min(surface.x, 1.0 - surface.x));
    gl_FragColor = vec4(color, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export function createRapidsWater(time, waterfall = false, outlet = false) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), time, waterfall: { value: Number(waterfall) }, outlet: { value: Number(outlet) },
      deep: { value: new THREE.Color('#164e63') }, shallow: { value: new THREE.Color('#38bdf8') },
      foam: { value: new THREE.Color('#e2e8f0') } },
    vertexShader: waterVertex, fragmentShader: waterFragment, fog: true,
    transparent: true, depthWrite: !waterfall, side: waterfall ? THREE.DoubleSide : THREE.FrontSide,
  });
}

export function createRapidsScenery(scene, riverY, distance, obstacles) {
  const root = new THREE.Group();
  scene.add(root);
  const time = { value: 0 };
  let seed = 14617;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const range = (min, max) => min + (max - min) * random();
  const material = (color, roughness = .9) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
  const mesh = (parent, geometry, surface, x, y, z) => {
    const object = new THREE.Mesh(geometry, surface);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  };
  const river = createRapidsWater(time);
  const fallingWater = createRapidsWater(time, true);
  const center = 5 - distance / 2;
  const water = mesh(root, new THREE.PlaneGeometry(25, distance + 100), river, 0, riverY(center), center);
  water.rotation.x = -Math.PI / 2 - Math.atan(riverY(6) - riverY(5));
  water.renderOrder = 1;
  const riverbed = mesh(root, water.geometry, material('#545849'), 0, riverY(center) - 1.52, center);
  riverbed.rotation.copy(water.rotation);

  const cliff = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, flatShading: true, side: THREE.DoubleSide });
  const rock = new THREE.IcosahedronGeometry(1, 1);
  const points = rock.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
    const ripple = 1 + .17 * Math.sin(x * 8 + z * 4) + .11 * Math.cos(y * 7 - x * 3);
    points.setXYZ(i, x * ripple + .17 * y, y * ripple, z * ripple);
  }
  rock.computeVertexNormals();
  const trunk = new THREE.CylinderGeometry(.58, 1, 1, 6);
  const crown = new THREE.ConeGeometry(1, 1, 7);
  const foliage = new THREE.IcosahedronGeometry(1, 0);
  const rockSurface = material('#ffffff', .69);
  const bark = material('#795548');
  const leaves = material('#ffffff');
  const undergrowth = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .96, side: THREE.DoubleSide });
  undergrowth.onBeforeCompile = shader => {
    shader.uniforms.windTime = time;
    shader.vertexShader = 'uniform float windTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vec3 anchor = instanceMatrix[3].xyz;
      transformed.x += position.y * position.y * sin(windTime * 1.8 + anchor.z * .4) * .16;
    `);
  };
  const grassPositions = [];
  for (let blade = 0; blade < 7; blade++) {
    const angle = blade * Math.PI * 2 / 7;
    const x = Math.cos(angle), z = Math.sin(angle);
    grassPositions.push(z * .08, 0, -x * .08, -z * .08, 0, x * .08, x * .55, .76 + .23 * Math.sin(blade), z * .55);
  }
  const grass = new THREE.BufferGeometry();
  grass.setAttribute('position', new THREE.Float32BufferAttribute(grassPositions, 3));
  grass.computeVertexNormals();
  const stone = ['#374151', '#52606b', '#64748b', '#555952'];
  const greens = ['#264d32', '#35563b', '#526b3f', '#697a4f'];
  const transform = new THREE.Object3D();
  const paint = new THREE.Color();
  const instance = (batch, index, x, y, z, sx, sy, sz, tilt, yaw, color) => {
    transform.position.set(x, y, z);
    transform.scale.set(sx, sy, sz);
    transform.rotation.set(tilt * .35, yaw, tilt);
    transform.updateMatrix();
    batch.setMatrixAt(index, transform.matrix);
    if (color) batch.setColorAt(index, paint.set(color));
  };
  const batch = (parent, geometry, surface, count) => {
    const object = new THREE.InstancedMesh(geometry, surface, count);
    parent.add(object);
    return object;
  };

  // Rows meet at identical sample positions so sections cull independently without seams.
  const offsets = [0, 1.1, 2.4, 4.4, 6.8, 10.5, 15, 22, 34];
  const elevations = [-1.4, .2, 1.2, 5, 9, 10.8, 12, 16, 19];
  const strata = ['#374151', '#555c54', '#696650', '#536260', '#64748b', '#526b3f', '#3a543a', '#4e604a', '#5f6c65'];
  const relief = (z, side) => 2.2 * Math.sin(z * .076 + side * 1.2) + 1.6 * Math.cos(z * .19 - side);
  const terrainY = (z, side, layer) => riverY(z) + elevations[layer] + relief(z, side) * Math.min(layer / 4, 1);
  const sectionLength = 24;
  for (let start = 35; start > -distance - 44; start -= sectionLength) {
    const section = new THREE.Group();
    root.add(section);
    const rocks = batch(section, rock, rockSurface, 32);
    const trunks = batch(section, trunk, bark, 18);
    const crowns = batch(section, crown, leaves, 42);
    const shrubs = batch(section, foliage, leaves, 40);
    const grasses = batch(section, grass, undergrowth, 60);
    for (const side of [-1, 1]) {
      const positions = [], colors = [], indices = [];
      for (let row = 0; row <= 8; row++) {
        const z = start - row * 3;
        offsets.forEach((offset, layer) => {
          const irregular = layer > 1 ? .48 * Math.sin(z * .65 + layer * 4 + side) : 0;
          positions.push(side * (bankEdge(z, side) + offset + irregular), terrainY(z, side, layer), z);
          paint.set(strata[layer]).multiplyScalar(.85 + .18 * Math.sin(z * .39 + layer * 2 + side));
          colors.push(paint.r, paint.g, paint.b);
          if (row && layer) {
            const a = row * offsets.length + layer;
            const b = a - offsets.length;
            if (side === 1) indices.push(b - 1, b, a, b - 1, a, a - 1);
            else indices.push(b - 1, a, b, b - 1, a - 1, a);
          }
        });
      }
      const terrain = new THREE.BufferGeometry();
      terrain.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      terrain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      terrain.setIndex(indices);
      terrain.computeVertexNormals();
      mesh(section, terrain, cliff, 0, 0, 0);

      const offset = side === -1 ? 0 : 1;
      for (let i = 0; i < 16; i++) {
        const z = start - range(.4, 23.6);
        const layer = i < 9 ? i % 2 : 2 + i % 5;
        const x = bankEdge(z, side) + offsets[layer];
        const size = layer < 2 ? range(.3, 1.35) : range(.8, 2.75);
        instance(rocks, offset * 16 + i, side * x, terrainY(z, side, layer) + size * .35, z,
          size * .92, size * range(.56, 1.75), size * range(.7, 1.55), range(-.55, .55), range(0, 6.28), stone[i % stone.length]);
      }
      const grove = start - range(4, 20);
      for (let i = 0; i < 7; i++) {
        const z = grove + range(-5, 5);
        const layer = 5 + i % 3;
        const x = side * (bankEdge(z, side) + offsets[layer]);
        const y = terrainY(z, side, layer) - .35;
        const size = range(2.8, 6.8), tilt = range(-.19, .19);
        instance(trunks, offset * 9 + i, x, y + size * .42, z, size * .047, size * 1.02, size * .047, tilt, 0);
        for (let tier = 0; tier < 3; tier++) {
          const height = size * (.48 + .26 * tier);
          const width = size * (.28 - .057 * tier);
          instance(crowns, offset * 21 + i * 3 + tier, x - tilt * height, y + height, z,
            width, size * (.65 - tier * .09), width, tilt, range(0, 6.28), greens[(i + tier) % greens.length]);
        }
      }
      for (let i = 0; i < 20; i++) {
        const z = grove + range(-9, 9);
        const layer = i % 3 === 0 ? 1 : 2 + i % 5;
        const x = bankEdge(z, side) + offsets[layer];
        const y = terrainY(z, side, layer);
        const size = range(.2, .8);
        instance(shrubs, offset * 20 + i, side * x, y + size * .24, z,
          size * 1.3, size * .65, size, range(-.4, .4), range(0, 6.28), greens[i % greens.length]);
      }
      for (let i = 0; i < 30; i++) {
        const z = i < 20 ? grove + range(-7, 7) : start - range(0, sectionLength);
        const layer = 1 + i % 3;
        const x = side * (bankEdge(z, side) + offsets[layer] + .2);
        const size = range(.35, 1.05);
        instance(grasses, offset * 30 + i, x, terrainY(z, side, layer) - .08, z,
          size, size * 1.18, size, side * range(-.2, .2), range(0, 6.28), greens[i % greens.length]);
      }
      for (let i = 0; i < 2; i++) {
        const z = start - 6 - i * 11;
        instance(trunks, offset * 9 + 7 + i, side * (bankEdge(z, side) + 1.8), terrainY(z, side, 1) + .35,
          z, .23, range(1.9, 3.2), .27, side * 1.37, range(-.3, .3));
      }
    }
  }

  const masonry = material('#647066');
  const joints = material('#3f4945');
  const coping = material('#818475');
  const block = new THREE.BoxGeometry(1, 1, 1);
  const archHeight = x => 6.8 + 6.2 * Math.sqrt(Math.max(0, 1 - (x / 9.2) ** 2));
  const bridge = new THREE.Shape();
  bridge.moveTo(-15.5, 5);
  bridge.lineTo(-15.5, 14.5);
  bridge.lineTo(15.5, 14.5);
  bridge.lineTo(15.5, 5);
  bridge.lineTo(9.2, 5);
  for (let i = 0; i <= 28; i++) {
    const x = 9.2 - 18.4 * i / 28;
    bridge.lineTo(x, archHeight(x));
  }
  bridge.lineTo(-9.2, 5);
  bridge.closePath();
  const bridgeZ = -38;
  const bridgeY = riverY(bridgeZ);
  mesh(root, new THREE.ExtrudeGeometry(bridge, { depth: 3.2, bevelEnabled: false }), masonry, 0, bridgeY, bridgeZ - 1.6);
  const trim = batch(root, block, coping, 98);
  let trimIndex = 0;
  for (const face of [-1, 1]) {
    for (let i = 0; i < 21; i++) {
      const angle = (i + .5) * Math.PI / 21;
      const x = 9.2 * Math.cos(angle), y = 6.8 + 6.2 * Math.sin(angle);
      instance(trim, trimIndex++, x, bridgeY + y + .25, bridgeZ + face * 1.7,
        1.02, .64, .34, Math.atan2(-6.2 * Math.cos(angle), 9.2 * Math.sin(angle)), 0);
    }
    for (let i = 0; i < 28; i++) {
      const height = i % 4 === 0 ? 1.03 : range(.43, .66);
      instance(trim, trimIndex++, i * 1.1 - 14.85, bridgeY + 14.5 + height / 2, bridgeZ + face * 1.34,
        1.06, height, .65, 0, 0);
    }
  }
  for (const x of [-14, 14]) {
    for (let row = 0; row < 6; row++) {
      const course = mesh(root, new THREE.CylinderGeometry(1.64, 1.72, .69, 8), row % 3 === 0 ? joints : masonry,
        x, bridgeY + 14.2 + row * .67, bridgeZ);
      course.rotation.y = Math.PI / 8;
    }
  }

  const spraySources = [];
  const cascade = (side, z, height, width) => {
    const y = riverY(z), x = bankEdge(z, side);
    const positions = [], uv = [], indices = [];
    for (let row = 0; row <= 10; row++) {
      const v = row / 10;
      for (let column = 0; column <= 6; column++) {
        const u = column / 6;
        positions.push(side * (x - 1.5 + 1.7 * v + 3.1 * v ** 3 + .16 * Math.sin(u * 22 + v * 6)),
          y + .05 + height * v, z + (u - .5) * width * (1.24 - .37 * v) + .25 * Math.sin(v * 7));
        uv.push(u, v);
        if (row && column) {
          const a = row * 7 + column;
          indices.push(a - 8, a - 7, a, a - 8, a, a - 1);
        }
      }
    }
    const sheet = new THREE.BufferGeometry();
    sheet.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    sheet.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    sheet.setIndex(indices);
    mesh(root, sheet, fallingWater, 0, 0, 0).renderOrder = 2;
    spraySources.push({ x: side * (x - 1.5), z, width, count: width > 4 ? 54 : 22 });
    const apron = mesh(root, rock, joints, side * (x + 2.9), y + height * .47, z);
    apron.scale.set(1.65, height * .57, width * .66);
    const headwall = mesh(root, rock, joints, side * (x + 7), y + height * .66, z);
    headwall.scale.set(3.45, height * .34, width * .74);
  };
  cascade(1, -50, 16, 5.7);
  cascade(1, -54, 10, 1.45);
  cascade(-1, -111, 8.4, 2.2);
  cascade(1, -177, 6.6, 1.6);
  cascade(-1, -248, 12, 3.1);
  cascade(1, -319, 8.1, 2.4);

  const decalMaterial = new THREE.MeshBasicMaterial({ color: '#e2e8f0', transparent: true, opacity: .57, depthWrite: false, vertexColors: false });
  const wake = new THREE.RingGeometry(.76, 1, 21, 1, .18, 4.1);
  wake.rotateX(-Math.PI / 2);
  const foamPatches = [];
  for (const { x, z, width } of spraySources) foamPatches.push({ x, z, width });
  for (const item of obstacles) foamPatches.push({ x: item.x, z: 5 - item.distance + .72, width: item.type === 'log' ? 2.1 : 1.35 });
  const rings = batch(root, wake, decalMaterial, foamPatches.length * 3);
  rings.frustumCulled = false;
  rings.renderOrder = 3;

  const droplets = spraySources.flatMap(source => Array.from({ length: source.count }, () => ({
    source, phase: random(), speed: range(.42, 1.45), dx: range(-1, 1), dz: range(-1, 1), lift: range(.35, 2.9),
  })));
  const sprayGeometry = new THREE.BufferGeometry();
  const sprayPositions = new THREE.Float32BufferAttribute(new Float32Array(droplets.length * 3), 3);
  sprayPositions.setUsage(THREE.DynamicDrawUsage);
  sprayGeometry.setAttribute('position', sprayPositions);
  const spray = new THREE.Points(sprayGeometry, new THREE.PointsMaterial({ color: '#e2e8f0', size: .32, opacity: .33,
    transparent: true, depthWrite: false, map: createSprayTexture() }));
  spray.frustumCulled = false;
  spray.renderOrder = 4;
  root.add(spray);

  const driftingLeaves = Array.from({ length: 48 }, () => ({ z: range(-distance - 18, 28), x: range(2.5, 8),
    side: random() < .5 ? -1 : 1, speed: range(1.1, 2.4), phase: range(0, 6.28) }));
  const flotsam = batch(root, foliage, leaves, driftingLeaves.length);
  flotsam.frustumCulled = false;
  const update = elapsed => {
    time.value = elapsed;
    foamPatches.forEach(({ x, z, width }, i) => {
      for (let j = 0; j < 3; j++) {
        const phase = (elapsed * .63 + j / 3 + i * .13) % 1;
        const downstream = z - phase * 2.2;
        instance(rings, i * 3 + j, x, riverY(downstream) + .14, downstream,
          width * (.44 + phase * .52), 1, .34 + phase * .96, 0, phase * .68 + j * 1.3);
      }
    });
    rings.instanceMatrix.needsUpdate = true;
    droplets.forEach(({ source, phase, speed, dx, dz, lift }, i) => {
      const age = (phase + elapsed * speed) % 1;
      const x = source.x + dx * age * 2.6;
      const z = source.z + dz * source.width * (.32 + age * .35) - age * 1.4;
      sprayPositions.setXYZ(i, x, riverY(z) + .06 + Math.sin(Math.PI * age) * lift, z);
    });
    sprayPositions.needsUpdate = true;
    driftingLeaves.forEach(({ x, z, side, speed, phase }, i) => {
      const downstream = 28 - (28 - z + elapsed * speed) % (distance + 47);
      instance(flotsam, i, side * x + .28 * Math.sin(elapsed + phase), riverY(downstream) + .06, downstream,
        .12, .025, .21, .06, phase + elapsed * .8, i % 3 === 0 ? '#a58549' : '#526b3f');
    });
    flotsam.instanceMatrix.needsUpdate = true;
    flotsam.instanceColor.needsUpdate = true;
  };
  update(0);
  return { update, dispose: () => spray.material.map.dispose() };
}

function createSprayTexture() {
  const size = 32;
  const rgba = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const radius = Math.hypot((x + .5) * 2 / size - 1, (y + .5) * 2 / size - 1);
      rgba[index] = rgba[index + 1] = rgba[index + 2] = 255;
      rgba[index + 3] = 255 * Math.max(0, 1 - radius) ** 1.65;
    }
  }
  const texture = new THREE.DataTexture(rgba, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
