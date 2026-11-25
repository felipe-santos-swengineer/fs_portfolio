import * as THREE from 'three';

const voussoir = '#827d78';
const darkStone = '#4e4b4e';
const spring = 5.05;
const crown = 10.35;
const naveHalfWidth = 8.58;
const wallHalfWidth = 11.6;
const vaultLength = 23.6;
const ribPositions = [-18, -10, -2, 6, 14, 22];

export function pointedOutline(width, spring, crown) {
  const points = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, left = 1 - t;
    points.push(new THREE.Vector2(-width * left * left, spring + (crown - spring) * t));
  }
  for (let i = 1; i <= 12; i++) {
    const t = i / 12;
    points.push(new THREE.Vector2(width * t * t, crown - (crown - spring) * t));
  }
  return points;
}

export function arcBand(parent, mesh, { width, spring, crown, trim = .24, depth = .32, color = voussoir, x = 0, y = 0, z = 0 }) {
  const outer = pointedOutline(width + trim, spring, crown + trim);
  const inner = pointedOutline(width, spring, crown).reverse();
  const shape = new THREE.Shape([...outer, ...inner]);
  shape.closePath();
  return mesh(parent, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), color, x, y, z);
}

function addMasonry(parent, side, endWall = false) {
  const courses = 10, blocksPerCourse = endWall ? 12 : 24;
  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ roughness: .96 }), courses * blocksPerCourse);
  const transform = new THREE.Object3D();
  const colors = ['#514d49', '#595550', '#615b55', '#484644', '#6a6259'].map(color => new THREE.Color(color));
  transform.scale.set(endWall ? 1.96 : .36, .485, endWall ? .36 : 1.96);
  for (let row = 0; row < courses; row++) for (let i = 0; i < blocksPerCourse; i++) {
    const along = (i - (blocksPerCourse - 1) / 2) * 2 + (row % 2) * .5;
    const across = side * (endWall ? vaultLength : wallHalfWidth);
    transform.position.set(endWall ? along : across, .26 + row * .51, endWall ? across : along);
    transform.updateMatrix();
    const index = row * blocksPerCourse + i;
    blocks.setMatrixAt(index, transform.matrix);
    blocks.setColorAt(index, colors[(row * 17 + i * 3 + row * i + side + 1) % colors.length]);
  }
  parent.add(blocks);
}

function createWallBay(scene, { mesh, box, cylinder, sphere }, side, z, emblem) {
  const bay = new THREE.Group();
  bay.position.set(side * 10.9, 0, z);
  bay.rotation.y = -side * Math.PI / 2;
  scene.add(bay);
  const recess = new THREE.Shape([
    new THREE.Vector2(-.88, .78),
    ...pointedOutline(.88, 3.4, 4.65),
    new THREE.Vector2(.88, .78),
  ]);
  mesh(bay, new THREE.ShapeGeometry(recess), '#26242a', 0, 0, -.07);
  box(bay, 2.67, .14, .65, darkStone, 0, .63, .11);
  arcBand(bay, mesh, { width: .88, spring: 3.4, crown: 4.65, depth: .26, z: .18 });
  arcBand(bay, mesh, { width: .72, spring: 3.4, crown: 4.5, trim: .09, depth: .15, color: darkStone, z: .24 });
  for (const x of [-1, 1]) {
    cylinder(bay, .14, 2.91, voussoir, x, 1.95, .32, 6);
    box(bay, .36, .16, .46, '#76717d', x, 3.37, .35);
  }
  box(bay, 2.4, .24, .8, voussoir, 0, .76, .33);

  const carved = '#73707a';
  const staff = '#827883';
  cylinder(bay, .44, .14, voussoir, 0, 1.04, .38);
  mesh(bay, new THREE.CylinderGeometry(.23, .42, 1.15, 7), carved, 0, 1.62, .38);
  sphere(bay, .245, carved, 0, 2.37, .44);
  const tool = box(bay, .079, 1.33, .095, staff, .47, 1.91, .65);
  tool.rotation.z = -.11;
  if (emblem === 'knight') {
    box(bay, .46, .19, .44, carved, 0, 2.24, .6);
    box(bay, .45, .09, .05, '#33353e', 0, 2.32, .685);
  } else {
    cylinder(bay, .254, .082, staff, 0, 2.57, .45);
    for (const x of [-.17, 0, .17]) {
      mesh(bay, new THREE.ConeGeometry(.083, emblem === 'queen' ? .19 : .14, 4), staff, x, 2.68, .51);
    }
    if (emblem === 'king') {
      box(bay, .065, .29, .065, staff, 0, 2.67, .54);
      box(bay, .22, .06, .065, staff, 0, 2.69, .54);
    }
  }
  const crest = box(bay, .53, .53, .13, '#565160', 0, 3.1, .31);
  crest.rotation.z = Math.PI / 4;
  const vertical = emblem === 'knight' ? .31 : .39;
  box(bay, .067, vertical, .04, '#9e879e', 0, 3.12, .398).rotation.z = emblem === 'knight' ? -.55 : 0;
  box(bay, .39, .062, .04, '#9e879e', 0, 3.12, .398);
}

function addVault(roof, mesh) {
  const outline = [
    new THREE.Vector2(-wallHalfWidth, spring),
    ...pointedOutline(naveHalfWidth, spring, crown),
    new THREE.Vector2(wallHalfWidth, spring),
  ];
  const positions = [], indices = [], colors = [];
  const shades = ['#625c58', '#57525a', '#60565b', '#6b625a'].map(color => new THREE.Color(color));
  for (let row = 0; row < 40; row++) {
    const from = -vaultLength + row * vaultLength / 20;
    const to = from + vaultLength / 20;
    for (let i = 1; i < outline.length; i++) {
      const a = outline[i - 1], b = outline[i];
      const offset = positions.length / 3;
      positions.push(a.x, a.y, from, b.x, b.y, from, a.x, a.y, to, b.x, b.y, to);
      indices.push(offset, offset + 1, offset + 2, offset + 2, offset + 1, offset + 3);
      const shade = shades[(row * 7 + i * 3 + row * i) % shades.length];
      for (let vertex = 0; vertex < 4; vertex++) colors.push(shade.r, shade.g, shade.b);
    }
  }
  const shell = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    .setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    .setIndex(indices);
  shell.computeVertexNormals();
  roof.add(new THREE.Mesh(shell, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98 })));

  const gable = new THREE.Shape(outline);
  gable.closePath();
  for (const side of [-1, 1]) {
    const end = mesh(roof, new THREE.ShapeGeometry(gable), '#524d51', 0, 0, side * vaultLength);
    end.rotation.y = side > 0 ? Math.PI : 0;
  }

  for (const z of ribPositions) {
    arcBand(roof, mesh, {
      width: naveHalfWidth - .42, spring: spring - .08, crown: crown - .4, trim: .42, depth: .73, z: z - .365,
    });
    for (const face of [-1, 1]) {
      arcBand(roof, mesh, {
        width: naveHalfWidth - .47, spring: spring - .08, crown: crown - .44, trim: .13, depth: .12,
        color: '#a39887', z: z + face * .43 - .06,
      });
    }
  }

  const heightAt = x => {
    const span = Math.abs(x);
    if (span >= naveHalfWidth) return spring;
    return THREE.MathUtils.lerp(spring, crown, 1 - Math.sqrt(span / naveHalfWidth));
  };
  for (let bay = 1; bay < ribPositions.length; bay++) {
    const from = ribPositions[bay - 1], to = ribPositions[bay], middle = (from + to) / 2;
    for (const side of [-1, 1]) for (const end of [from, to]) {
      const points = [];
      for (let step = 0; step <= 12; step++) {
        const t = step / 12, x = side * naveHalfWidth * (1 - t) ** 2;
        points.push(new THREE.Vector3(x, heightAt(x) - .17, THREE.MathUtils.lerp(end, middle, t)));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      mesh(roof, new THREE.TubeGeometry(curve, 16, .14, 5, false), '#83796f', 0, 0, 0);
    }
  }
  return heightAt;
}

function addColumn(scene, { mesh, box, cylinder }, x, z, metal) {
  box(scene, 1.66, .22, 1.66, darkStone, x, .11, z);
  box(scene, 1.39, .2, 1.39, voussoir, x, .32, z);
  cylinder(scene, .72, .24, '#6e655f', x, .54, z);
  for (let course = 0; course < 8; course++) {
    cylinder(scene, .59, .482, course % 3 === 0 ? '#716865' : '#5c5654', x, .88 + course * .486, z);
  }
  for (const side of [-1, 1]) {
    cylinder(scene, .14, 3.86, '#8a8075', x + side * .47, 2.59, z);
    cylinder(scene, .14, 3.86, '#8a8075', x, 2.59, z + side * .47);
  }
  cylinder(scene, .69, .18, '#9c8d7d', x, 4.46, z);
  mesh(scene, new THREE.CylinderGeometry(.89, .6, .41, 8), voussoir, x, 4.72, z);
  box(scene, 1.71, .21, 1.37, '#999082', x, 4.99, z);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(.61, .047, 5, 16), metal);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(x, 2.88, z);
  scene.add(collar);
}

function addFloor(scene, box) {
  const columns = 16, rows = 28;
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(1.42, .07, 1.67),
    new THREE.MeshStandardMaterial({ roughness: .94 }), columns * rows);
  const matrix = new THREE.Matrix4();
  const shades = ['#4d4945', '#57504b', '#615952', '#534d4e', '#655c53'].map(color => new THREE.Color(color));
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const index = row * columns + col;
    tiles.setMatrixAt(index, matrix.makeTranslation((col - 7.5) * 1.46, -.035, (row - 13.5) * 1.69));
    tiles.setColorAt(index, shades[(row * 13 + col * 3 + row * col) % shades.length]);
  }
  scene.add(tiles);
  for (const x of [-2.35, 2.35]) {
    box(scene, .095, .014, 41, '#a3937f', x, .007, .45);
    box(scene, .12, .014, 41, '#33313a', x * .91, .007, .45);
  }
  for (let z = -18.9; z <= 20; z += 2.48) {
    for (const x of [-1.53, 0, 1.53]) {
      const width = x === 0 ? 1.21 : .72;
      box(scene, width, .012, width, '#292933', x, .006, z).rotation.y = Math.PI / 4;
      box(scene, width * .77, .012, width * .77, '#8f7a69', x, .008, z).rotation.y = Math.PI / 4;
      box(scene, width * .53, .012, width * .53, '#4d5355', x, .01, z).rotation.y = Math.PI / 4;
    }
  }
}

function addFloorWear(scene) {
  const cracks = [];
  for (let i = 0; i < 58; i++) {
    const x = ((i * 37) % 221) / 10 - 11, z = ((i * 71) % 428) / 10 - 21;
    const y = .019;
    cracks.push(x, y, z, x + .21, y, z + .18, x + .21, y, z + .18, x + .59, y, z - .06,
      x + .21, y, z + .18, x + .38, y, z + .44);
  }
  addFissures(scene, cracks);
}

function addWallWear(wall, side) {
  const cracks = [];
  for (let i = 0; i < 34; i++) {
    const x = side * (wallHalfWidth - .19), y = .49 + ((i * 17) % 39) / 10;
    const z = ((i * 67) % 433) / 10 - 22;
    cracks.push(x, y, z, x, y + .17, z + .24, x, y + .17, z + .24, x, y + .46, z + .15,
      x, y + .17, z + .24, x, y + .36, z + .55);
  }
  addFissures(wall, cracks);
}

function addFissures(scene, cracks) {
  const fissures = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(cracks, 3));
  scene.add(new THREE.LineSegments(fissures, new THREE.LineBasicMaterial({ color: '#302c2e' })));
}

export function buildChamberArchitecture(scene, helpers) {
  const { mesh, box } = helpers;
  const roof = new THREE.Group();
  scene.add(roof);
  const roofHeight = addVault(roof, mesh);
  const iron = new THREE.MeshStandardMaterial({ color: '#55423b', roughness: .84, metalness: .68 });
  const darkIron = new THREE.MeshStandardMaterial({ color: '#373336', roughness: .8, metalness: .68 });
  const linkShape = new THREE.TorusGeometry(.137, .032, 6, 12);
  const columns = [];
  const inscriptionPanels = [];

  const sideWalls = [];
  addFloor(scene, box);
  addFloorWear(scene);
  for (const side of [-1, 1]) {
    const wall = new THREE.Group();
    sideWalls.push(wall);
    scene.add(wall);
    addMasonry(wall, side);
    addWallWear(wall, side);
    addMasonry(scene, side, true);
    box(wall, .45, spring, 47.2, '#343131', side * 11.82, spring / 2, 0);
    box(scene, 23.7, spring, .4, '#343131', 0, spring / 2, side * 23.82);
    for (const y of [.32, 4.78, 5.02]) box(wall, .36, .17, 47.2, voussoir, side * 11.36, y, 0);

    for (const z of ribPositions) {
      const x = side * (naveHalfWidth - .1);
      addColumn(scene, helpers, x, z, darkIron);
      columns.push({ x, z, radius: .97 });
    }

    for (let i = 0; i < ribPositions.length - 1; i++) {
      const z = ribPositions[i] + 4;
      createWallBay(wall, helpers, side, z, ['knight', 'king', 'queen'][i % 3]);
      const panel = new THREE.Group();
      panel.position.set(side * 11.1, 3.31, z + 2.33);
      panel.rotation.y = -side * Math.PI / 2;
      wall.add(panel);
      box(panel, 1.14, 1.15, .15, darkStone, 0, 0, 0);
      box(panel, 1.01, .99, .08, '#6b605b', 0, 0, .08);
      inscriptionPanels.push(panel);

      const x = side * 4.75;
      const top = roofHeight(x) - .07;
      const mount = new THREE.Mesh(linkShape, iron);
      mount.position.set(x, top, z);
      roof.add(mount);
      for (let linkIndex = 0; linkIndex < 9; linkIndex++) {
        const link = new THREE.Mesh(linkShape, linkIndex % 3 === 0 ? iron : darkIron);
        link.position.set(x, top - .235 * (linkIndex + 1), z);
        link.scale.y = 1.26;
        link.rotation.y = (linkIndex % 2) * Math.PI / 2;
        roof.add(link);
      }
    }

    const light = new THREE.PointLight(side > 0 ? '#d5ab78' : '#a7b6d4', 72, 19);
    light.position.set(side * 7.5, 4.15, 11);
    scene.add(light);
  }

  return {
    columns,
    inscriptionPanels,
    updateArchitectureView({ x, y, z }, chessView = false) {
      sideWalls[0].visible = x > -wallHalfWidth;
      sideWalls[1].visible = x < wallHalfWidth;
      roof.visible = !chessView && Math.abs(x) < wallHalfWidth && Math.abs(z) < vaultLength
        && y < roofHeight(x) - .1;
    },
  };
}
