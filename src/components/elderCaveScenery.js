import * as THREE from 'three';
import { CAVE_ALCOVES, CAVE_BRANCHES, CAVE_DIVIDERS, CAVE_STAIRS_START, caveBlocked } from './caveWorld';

const TAU = Math.PI * 2;
const rockColors = ['#374151', '#4b4b59', '#55535c', '#625c60', '#78716c'];

// Sample the existing collision union on both sides of each rectangle edge.
function caveEdges() {
  const regions = [...CAVE_ALCOVES, ...CAVE_BRANCHES, ...CAVE_DIVIDERS];
  const ordered = values => Array.from(new Set(values)).sort((a, b) => a - b);
  const xs = ordered([-11.1, 11.1, -2.15, 2.15, ...regions.flatMap(r => [r.minX, r.maxX])]);
  const zs = ordered([-239.2, CAVE_STAIRS_START, 9, ...regions.flatMap(r => [r.minZ, r.maxZ])]);
  const edges = [];
  for (const alongX of [true, false]) {
    const fixed = alongX ? zs : xs, runs = alongX ? xs : zs;
    for (const coordinate of fixed) {
      let start = runs[0], previous = 0;
      for (let i = 0; i <= runs.length - 1; i++) {
        const middle = (runs[i] + runs[i + 1]) / 2;
        const sample = side => alongX ? caveBlocked(middle, coordinate + side * .015) :
          caveBlocked(coordinate + side * .015, middle);
        const normal = i === runs.length - 1 ? 0 : Number(sample(-1)) - Number(sample(1));
        if (normal === previous) continue;
        if (previous) {
          const end = runs[i], sections = Math.ceil((end - start) / 5.8);
          for (let j = 0; j < sections; j++) {
            const length = (end - start) / sections, center = start + length * (j + .5);
            edges.push({ alongX, coordinate, center, length, normal: previous });
          }
        }
        previous = normal;
        start = runs[i];
      }
    }
  }
  return edges;
}

export function createElderCaveScenery(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const stone = new THREE.BoxGeometry(1, 1, 1);
  const timberPost = new THREE.CylinderGeometry(.85, 1, 1, 7);
  const rock = new THREE.IcosahedronGeometry(1, 1);
  const positions = rock.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const erosion = 1 + .19 * Math.cos(x * 6 + y * 3) + .11 * Math.sin(z * 7 - y * 6);
    positions.setXYZ(i, x * erosion + y * .18, y * erosion, z * erosion);
  }
  rock.computeVertexNormals();
  const spike = new THREE.CylinderGeometry(.87, .035, 1, 6, 2);
  let seed = 53471;
  const between = (low, high) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return low + (high - low) * seed / 4294967296;
  };
  const materials = new Map();
  const surface = (color, roughness = .9, emission = '#000000', strength = 0) => {
    const key = [color, roughness, emission, strength].join('/');
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
      color, roughness, emissive: emission, emissiveIntensity: strength, flatShading: true,
    }));
    return materials.get(key);
  };
  const wood = surface('#594536');
  const wornWood = surface('#745b43');
  const charcoal = surface('#3a3032');
  const leather = surface('#6f4049');
  const oldGold = surface('#c8a96b', .68);
  const pages = surface('#d6c3a1');
  const clay = surface('#78605c');
  const wet = surface('#414b58', .41);
  const moss = surface('#36594a');
  const paperInk = surface('#75645f');
  const mineral = surface('#7c6889', .48, '#7c3aed', .22);
  const glow = surface('#f5ba72', .58, '#f59e0b', .95);
  const tint = new THREE.Color();
  const put = (parent, geometry, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);
    parent.add(object);
    return object;
  };
  const board = (parent, mat, x, y, z, xSize, ySize, zSize) =>
    put(parent, stone, mat, x, y, z, xSize, ySize, zSize);
  const post = (parent, mat, x, y, z, radius, h) =>
    put(parent, timberPost, mat, x, y, z, radius, h, radius);
  const group = (x, z, rotation = 0) => {
    const object = new THREE.Group();
    object.position.set(x, 0, z);
    object.rotation.y = rotation;
    root.add(object);
    return object;
  };
  const batch = (parent, geometry, material, items) => {
    const instances = new THREE.InstancedMesh(geometry, material, items.length);
    for (let i = 0; i < items.length; i++) {
      const { position, scale, rotation, color } = items[i];
      transform.position.fromArray(position);
      transform.scale.fromArray(scale);
      transform.rotation.fromArray(rotation);
      transform.updateMatrix();
      instances.setMatrixAt(i, transform.matrix);
      if (color) instances.setColorAt(i, tint.set(color));
    }
    parent.add(instances);
    return instances;
  };
  const transform = new THREE.Object3D();
  const ground = new THREE.PlaneGeometry(118, 273, 58, 136);
  ground.rotateX(-Math.PI / 2);
  const groundPositions = ground.attributes.position;
  const groundColors = [];
  for (let i = 0; i < groundPositions.count; i++) {
    const x = groundPositions.getX(i), z = groundPositions.getZ(i) - 115.5;
    const ripple = Math.sin(x * .52 + z * .28) * Math.cos(x * .31 - z * .47);
    groundPositions.setY(i, -.095 + ripple * .041);
    const onTrail = !caveBlocked(x, z);
    const warm = z > -12 || z < -202;
    tint.set(onTrail ? (warm ? '#6f5f57' : '#53515b') : '#303746').multiplyScalar(.88 + .13 * ripple);
    groundColors.push(tint.r, tint.g, tint.b);
  }
  ground.setAttribute('color', new THREE.Float32BufferAttribute(groundColors, 3));
  ground.computeVertexNormals();
  put(root, ground, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96 }), 0, 0, -115.5);

  const highWalls = [];
  const wallTint = surface('#ffffff');
  const shelves = [], stalactites = [], overhangs = [];
  caveEdges().forEach(({ alongX, coordinate, center, length, normal }, i) => {
    const yaw = alongX ? 0 : Math.PI / 2;
    const frontage = (!alongX && Math.abs(coordinate) === 11.1 && ((center > -12 && center < 9) || (center > -219 && center < -203)));
    const inset = frontage ? 3.25 : .82;
    const newShelf = (along, vertical, outward, width, height, deep, tilt = 0) => ({
      position: alongX ? [center + along, vertical, coordinate - normal * outward] :
        [coordinate - normal * outward, vertical, center + along],
      scale: [width, height, deep], rotation: [between(-.18, .18), yaw + tilt, between(-.18, .18)],
      color: rockColors[(i + Math.floor(height)) % rockColors.length],
    });
    shelves.push(newShelf(0, .18, .36, length * .56, .36, .52));
    const tallPieces = [
      newShelf(0, 2.8, inset + 1, length * .62, between(2.9, 4.2), 1.34, between(-.15, .15)),
      newShelf(length * .18, 6.3, inset + 1.8, length * .6, between(3, 5.3), 1.84, between(-.2, .2)),
    ];
    const walls = batch(root, rock, wallTint, tallPieces);
    highWalls.push({ object: walls, axis: alongX ? 'z' : 'x', other: alongX ? 'x' : 'z',
      coordinate, center, normal, inset, reach: length * .78 });
    if (i % 2 === 0 && coordinate !== 9) {
      stalactites.push(newShelf(between(-.8, .8), between(17.6, 19.9), inset + 1.8,
        between(.5, 1.8), between(2, 5.7), between(.7, 2.1)));
    }
  });
  // Small chunks of peripheral ceiling frame the corridor above the maximum orbit height.
  for (let z = 11; z > -246; z -= 11.5) {
    for (const side of [-1, 1]) {
      overhangs.push({ position: [side * between(12, 17), between(18.9, 21), z],
        scale: [between(4, 7), between(2.2, 4.9), between(5.4, 8.1)],
        rotation: [between(-.2, .2), between(-.3, .3), side * .19], color: rockColors[1] });
    }
  }
  batch(root, rock, wallTint, shelves);
  batch(root, spike, wallTint, stalactites);
  batch(root, rock, wallTint, overhangs);
  const entranceLights = [];
  const setPieces = [];
  const candles = [];
  const candle = (parent, x, y, z, h, phase) => {
    post(parent, pages, x, y + h / 2, z, h * .23, h);
    const flame = put(parent, rock, glow, x, y + h + .08, z, .06, .12, .057);
    candles.push({ flame, phase });
  };
  const light = (x, y, z, color, intensity, distance) => {
    const lamp = new THREE.PointLight(color, intensity, distance);
    lamp.position.set(x, y, z);
    scene.add(lamp);
    entranceLights.push({ lamp, intensity });
  };
  light(-8, 4, 1, '#eab27a', 38, 20);
  light(8, 3.6, -7, '#e8a26e', 33, 18);
  light(-10, 3.1, -210, '#f0b579', 48, 19);
  light(9, 2.8, -207, '#9d87c8', 24, 16);
  light(-43.5, 2.9, -70.8, '#d7a47a', 16, 10);
  light(43, 3, -111.3, '#d7a47a', 16, 10);

  // Narrow shoulders hint at a passage from the village while leaving its mouth open above the player.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const z = 9.8 + i * .79;
      const x = side * (4.9 - i * .35);
      put(root, rock, wet, x, .22, z, 1.12, .52, .83).rotation.y = i * .4;
      if (i % 2 === 0) {
        board(root, oldGold, x - side * .3, .46, z, .04, .11, .24).rotation.z = side * .27;
      }
    }
  }

  // All furniture faces the walked route from shallow recesses beyond its collision edge.
  const books = ['#754c53', '#566077', '#4a6356', '#8a694e', '#5d4b63', '#9c7862'];
  const bookcase = (x, z, side, rows) => {
    const shelf = group(x, z, -side * Math.PI / 2);
    setPieces.push(shelf);
    const width = 3.85;
    const height = rows * .62 + .32;
    board(shelf, charcoal, 0, height / 2, -.43, width, height, .2);
    for (const end of [-1, 1]) board(shelf, wood, end * width * .49, height / 2, 0, .19, height, .85);
    const bookSpines = [], bookLeaves = [];
    for (let row = 0; row <= rows; row++) {
      const level = .16 + row * .62;
      board(shelf, wornWood, 0, level, .01, width, .125, .88);
      if (row === rows) continue;
      let cursor = -1.64;
      while (cursor < 1.62) {
        const w = between(.11, .25), h = between(.21, .47);
        const book = { position: [cursor, level + .07 + h / 2, between(.13, .29)],
          scale: [w, h, .28], rotation: [0, 0, between(-.12, .12)],
          color: books[Math.floor(between(0, books.length))] };
        bookSpines.push(book);
        bookLeaves.push({ ...book, position: [cursor, level + .07 + h / 2, book.position[2] + .143],
          scale: [w * .76, h * .8, .013], color: '#b9a587' });
        cursor += w + between(.028, .11);
      }
    }
    batch(shelf, stone, wallTint, bookSpines);
    batch(shelf, stone, wallTint, bookLeaves);
    for (const xOffset of [-1.55, 1.36]) candle(shelf, xOffset, height + .03, .24, .18, z + xOffset);
  };
  const table = (parent, w, d, h) => {
    board(parent, wornWood, 0, h, 0, w, .145, d);
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      board(parent, wood, a * (w * .48 - .1), h / 2, b * (d * .46 - .06), .14, h, .15);
    }
    return h + .09;
  };
  const manuscript = (parent, x, y, z) => {
    board(parent, leather, x, y + .019, z, .67, .046, .49);
    for (const side of [-1, 1]) {
      board(parent, pages, x + side * .156, y + .074, z, .31, .041, .43).rotation.z = -side * .13;
      for (let i = 0; i < 4; i++) board(parent, paperInk, x + side * .155, y + .098,
        z + .115 - i * .068, .205 - (i % 2) * .047, .006, .011);
    }
  };
  const rug = (parent, x, z, w, d) => {
    board(parent, charcoal, x, -.032, z, w + .16, .036, d + .2);
    board(parent, leather, x, -.009, z, w, .021, d);
    for (const side of [-1, 1]) {
      board(parent, oldGold, x + side * w * .45, .014, z, .055, .018, d * .95);
      board(parent, oldGold, x, .014, z + side * d * .44, w * .89, .017, .065);
    }
    for (let i = -2; i <= 2; i++) {
      board(parent, oldGold, x, .016, z + i * d * .14, .22, .017, .22).rotation.y = Math.PI / 4;
    }
  };
  bookcase(-11.96, 1.5, -1, 4);
  bookcase(-11.95, -3.5, -1, 3);
  bookcase(-11.92, -207, -1, 4);
  const studies = group(-11.75, -212.4, Math.PI / 2);
  setPieces.push(studies);
  const deskTop = table(studies, 3.2, 1.24, .91);
  manuscript(studies, -.18, deskTop, .19);
  board(studies, pages, -.81, deskTop + .023, -.31, .51, .042, .24).rotation.y = .24;
  post(studies, charcoal, .39, deskTop + .07, .19, .071, .13);
  candle(studies, -1.26, deskTop, -.23, .3, 1.3);
  candle(studies, 1.21, deskTop, -.27, .24, 2);
  const armchair = group(-12, -216.5, Math.PI / 2);
  setPieces.push(armchair);
  rug(armchair, 0, 1.15, 2.25, 2.6);
  board(armchair, wood, 0, .52, 0, 1.22, .15, 1);
  board(armchair, leather, 0, .65, .06, 1.05, .16, .89);
  board(armchair, wood, 0, 1.26, -.48, 1.22, 1.41, .19).rotation.x = .09;
  board(armchair, leather, 0, 1.29, -.34, .91, 1.02, .09).rotation.x = .09;
  board(armchair, oldGold, 0, 1.76, -.3, .16, .16, .058).rotation.z = Math.PI / 4;
  for (const side of [-1, 1]) {
    board(armchair, wornWood, side * .59, .92, -.02, .16, .105, 1.02);
    for (const z of [-.39, .39]) board(armchair, wood, side * .52, .39, z, .14, .78, .16);
  }
  post(armchair, wornWood, .99, .92, -.35, .044, 1.85).rotation.z = .19;
  put(armchair, rock, oldGold, .81, 1.82, -.35, .09, .11, .09);

  const residence = group(12, 1.4, -Math.PI / 2);
  setPieces.push(residence);
  board(residence, wood, 0, .28, -.1, 2.52, .55, 1.18);
  board(residence, pages, 0, .58, -.1, 2.37, .14, 1.1);
  board(residence, leather, -.28, .66, -.1, 1.76, .08, 1.15);
  put(residence, rock, pages, .87, .71, -.09, .32, .13, .44);
  board(residence, charcoal, -2.17, .31, -.12, .79, .59, .73);
  board(residence, wood, -2.17, .63, -.12, .83, .12, .76);
  board(residence, oldGold, -2.17, .47, .268, .14, .16, .032);
  const hearth = group(12.1, -4.9, -Math.PI / 2);
  setPieces.push(hearth);
  for (const side of [-1, 1]) for (let row = 0; row < 4; row++) {
    board(hearth, surface(rockColors[1 + row % 3]), side * .72, .24 + row * .34, 0, .43, .36, .9);
  }
  board(hearth, wet, 0, 1.64, 0, 2, .32, .99);
  board(hearth, charcoal, 0, .64, -.42, 1.22, 1.29, .23);
  for (let i = 0; i < 5; i++) {
    post(hearth, wornWood, .29 - i * .14, .15 + i * .025, .12, .09, .52).rotation.z = 1.32 + i * .09;
    candle(hearth, .36 - i * .18, .17, .19, .18 + i * .027, i * 1.5);
  }

  const laboratory = group(11.75, -209, -Math.PI / 2);
  setPieces.push(laboratory);
  const benchTop = table(laboratory, 4.2, 1.25, 1.02);
  manuscript(laboratory, -.42, benchTop, .13);
  const bottles = [surface('#7f9e95', .24, '#3c7255', .16), mineral, surface('#9085a2', .25)];
  for (let i = 0; i < 6; i++) {
    const bx = (i - 2.5) * .47, bz = i % 2 ? -.32 : .25;
    if (i === 2) continue;
    const h = between(.12, .23);
    put(laboratory, rock, bottles[i % 3], bx, benchTop + h, bz, .125, h, .12);
    post(laboratory, bottles[i % 3], bx, benchTop + h * 2.02, bz, .055, .14);
    post(laboratory, wood, bx, benchTop + h * 2.02 + .083, bz, .06, .055);
  }
  post(laboratory, clay, 1.66, benchTop + .13, .19, .25, .24);
  post(laboratory, wornWood, 1.63, benchTop + .31, .18, .047, .39).rotation.z = -.43;
  candle(laboratory, -1.78, benchTop, .27, .24, 5.3);
  for (let i = 0; i < 3; i++) {
    const hoop = put(laboratory, new THREE.TorusGeometry(.28 - .045 * i, .027, 6, 18), oldGold,
      .98, benchTop + .49, -.25);
    hoop.rotation.set(i * .78, i * .59, .21);
  }
  const circle = group(11.6, -215);
  setPieces.push(circle);
  const inscription = put(circle, new THREE.RingGeometry(.9, 1.06, 24), oldGold, 0, .026, 0);
  inscription.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 10; i++) {
    const a = i * TAU / 10;
    board(circle, oldGold, Math.sin(a) * .78, .032, Math.cos(a) * .78, .074, .029, .17).rotation.y = a;
    if (i % 2 === 0) candle(circle, Math.sin(a) * 1.27, .03, Math.cos(a) * 1.27, .12, a);
  }
  const crystal = put(circle, rock, mineral, 0, .66, 0, .23, .49, .23);
  crystal.rotation.z = .22;

  const trail = [], damp = [], fungi = [];
  for (let z = 8; z > -220; z -= 4.75) {
    const side = Math.floor(-z / 5) % 2 ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      const x = between(.35, 2.25) * side;
      if (!caveBlocked(x, z)) trail.push({ position: [x, -.025, z + i * .52],
        scale: [between(.42, .78), .046, between(.31, .62)], rotation: [0, between(0, TAU), 0],
        color: rockColors[(i + 2) % rockColors.length] });
    }
    const x = side * between(10.4, 11.35);
    damp.push({ position: [x, .006, z], scale: [between(.33, .74), .043, between(.38, 1.03)],
      rotation: [0, between(0, TAU), 0], color: '#465563' });
    if (Math.floor(-z / 5) % 3 === 0) for (let i = 0; i < 4; i++) {
      fungi.push({ position: [x + between(-.36, .36), between(.055, .13), z + between(-.7, .7)],
        scale: [between(.10, .18), .076, between(.09, .15)],
        rotation: [0, i, .15], color: i % 2 ? '#71867e' : '#567e70' });
    }
  }
  batch(root, stone, wallTint, trail);
  batch(root, rock, wet, damp);
  batch(root, rock, moss, fungi);
  const dripSites = [[7.8, 6], [-8.8, -9], [-9.9, -73], [8.9, -118], [-10.2, -154], [8.5, -211]];
  const water = surface('#526777', .25, '#395265', .12);
  const ripples = [];
  for (const [x, z] of dripSites) {
    put(root, rock, water, x, -.02, z, 1.15, .047, .58);
    const ripple = put(root, new THREE.RingGeometry(.9, 1, 26), new THREE.MeshBasicMaterial({
      color: '#9cb6be', transparent: true, opacity: .2, depthWrite: false,
    }), x, .028, z);
    ripple.rotation.x = -Math.PI / 2;
    ripples.push({ ripple, drop: put(root, rock, water, x, 1.8, z, .041, .094, .045) });
  }
  for (let z = 5; z > -221; z -= 9.1) {
    const side = z % 2 > -.9 ? 1 : -1;
    const x = side * 10.2;
    if (caveBlocked(x, z)) continue;
    const lantern = group(x, z);
    put(lantern, rock, charcoal, 0, .06, 0, .47, .11, .46);
    post(lantern, wood, 0, .33, 0, .08, .67);
    board(lantern, charcoal, 0, .75, 0, .25, .16, .24);
    candle(lantern, 0, .83, 0, .12, z);
  }
  for (const [x, z] of [[-43.5, -70.8], [43, -111.3]]) {
    const rest = group(x, z);
    put(rest, rock, wet, 0, .27, 0, .69, .34, .64);
    candle(rest, .23, .54, .16, .18, z);
    candle(rest, -.16, .57, .3, .24, z + 2);
  }
  const motes = Array.from({ length: 35 }, (_, i) => ({
    x: i < 19 ? between(10.75, 12.8) : between(10.3, 12.2),
    z: i < 19 ? between(-5.55, -4.3) : between(-216.2, -213.9),
    offset: between(0, 1), speed: between(.18, .43),
  }));
  const moteGeometry = new THREE.BufferGeometry();
  const motePositions = new THREE.Float32BufferAttribute(new Float32Array(motes.length * 3), 3);
  motePositions.setUsage(THREE.DynamicDrawUsage);
  moteGeometry.setAttribute('position', motePositions);
  const sparks = new THREE.Points(moteGeometry, new THREE.PointsMaterial({
    color: '#ceb59e', size: .065, opacity: .42, transparent: true, depthWrite: false,
  }));
  sparks.frustumCulled = false;
  root.add(sparks);
  const sightLine = new THREE.Vector3();
  const cutaway = (camera, player, focus) => {
    const eye = camera.position;
    for (const wall of highWalls) {
      const { axis, other, coordinate, center, normal, inset, reach } = wall;
      // The innermost face of each wall lies at its collision edge or in the recess behind it.
      const plane = coordinate - normal * Math.max(.15, inset - 1.15);
      const blocks = point => {
        if (!point || Math.abs(eye[other] - center) > 19 || Math.abs(eye[axis] - plane) > 22) return false;
        if ((eye[axis] - plane) * normal > 1.6 && (point[axis] - plane) * normal > 1.6) return false;
        sightLine.copy(point).sub(eye);
        if (Math.abs(sightLine[axis]) < .001) return false;
        const t = (plane - eye[axis]) / sightLine[axis];
        return t > -.22 && t < 1.04 && Math.abs(eye[other] + sightLine[other] * t - center) < reach + .9;
      };
      wall.object.visible = !blocks(player) && !blocks(focus);
    }
    // Tall furniture sits entirely outside the route. Remove its silhouette when the orbit
    // moves through its niche and places the furniture in front of an interaction.
    for (const piece of setPieces) {
      const { x, z } = piece.position;
      const obstructs = point => {
        if (!point || Math.abs(eye.z - z) > 16) return false;
        const dx = point.x - eye.x;
        if (Math.abs(dx) < .001) return false;
        const t = (x - eye.x) / dx;
        return t > -.12 && t < 1 && Math.abs(eye.z + (point.z - eye.z) * t - z) < 2.7;
      };
      piece.visible = !obstructs(player) && !obstructs(focus);
    }
  };
  const update = time => {
    candles.forEach(({ flame, phase }) => {
      flame.scale.y = .107 + .018 * Math.sin(time * 6 + phase);
      flame.rotation.z = Math.sin(time * 3 + phase) * .1;
    });
    entranceLights.forEach(({ lamp, intensity }, i) => {
      lamp.intensity = intensity * (1 + .035 * Math.sin(time * 2.7 + i * .7));
    });
    crystal.position.y = .65 + .07 * Math.sin(time * 1.2);
    crystal.rotation.y = time * .21;
    ripples.forEach(({ ripple, drop }, i) => {
      const age = (time * .68 + i / ripples.length) % 1;
      ripple.scale.set(.12 + age * .89, .11 + age * .46, 1);
      ripple.material.opacity = (1 - age) * .28;
      drop.position.y = 2.3 * (1 - age ** 2) + .04;
    });
    motes.forEach(({ x, z, offset, speed }, i) => {
      const age = (offset + time * speed) % 1;
      motePositions.setXYZ(i, x + Math.sin(age * TAU + i) * .13, .34 + age * (i < 19 ? 1.32 : .98), z);
    });
    motePositions.needsUpdate = true;
  };
  update(0);
  return { update, cutaway };
}
