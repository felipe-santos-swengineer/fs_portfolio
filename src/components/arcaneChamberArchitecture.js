import * as THREE from 'three';

const voussoir = '#686674';
const darkStone = '#383b48';

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

function addMasonry(scene) {
  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ roughness: .96 }), 2 * 9 * 23 + 2 * 9 * 12);
  const transform = new THREE.Object3D();
  const colors = ['#383c49', '#424452', '#4e4d59', '#343643', '#535361'];
  let index = 0;
  for (const side of [-1, 1]) for (let row = 0; row < 9; row++) {
    for (let i = 0; i < 23; i++) {
      transform.position.set(side * 11.45, .39 + row * .84, (i - 11) * 2.02 + (row % 2) * .85);
      transform.scale.set(.36, .79, 1.96);
      transform.updateMatrix();
      blocks.setMatrixAt(index, transform.matrix);
      blocks.setColorAt(index++, new THREE.Color(colors[(row * 17 + i * 3 + side + 1) % colors.length]));
    }
    for (let i = 0; i < 12; i++) {
      transform.position.set((i - 5.5) * 1.98 + (row % 2) * .77, .39 + row * .84, side * 23.46);
      transform.scale.set(1.93, .79, .32);
      transform.updateMatrix();
      blocks.setMatrixAt(index, transform.matrix);
      blocks.setColorAt(index++, new THREE.Color(colors[(row * 7 + i * 2 + side + 1) % colors.length]));
    }
  }
  scene.add(blocks);
}

function createWallBay(scene, { mesh, box, cylinder, sphere }, side, z, emblem) {
  const bay = new THREE.Group();
  bay.position.set(side * 10.9, 0, z);
  bay.rotation.y = -side * Math.PI / 2;
  scene.add(bay);
  box(bay, 2.3, 3.75, .22, '#222630', 0, 2.35, 0);
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

function addVault(ceiling, mesh, from, to) {
  const outline = pointedOutline(8.82, 3.74, 7.43);
  const positions = [], indices = [];
  outline.forEach(({ x, y }, index) => {
    positions.push(x, y - 8, from, x, y - 8, to);
    if (index === 0) return;
    const a = (index - 1) * 2, b = index * 2;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  });
  const shell = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)).setIndex(indices);
  shell.computeVertexNormals();
  mesh(ceiling, shell, '#353745', 0, 0, 0);
}

export function buildChamberArchitecture(scene, helpers, ceiling) {
  const { mesh, box } = helpers;
  addMasonry(scene);
  addVault(ceiling, mesh, -23, 22);
  for (const z of [-16, -6, 4, 14]) {
    arcBand(ceiling, mesh, { width: 8.73, spring: 3.55, crown: 7.11, trim: .25, depth: .65, y: -8, z });
    arcBand(ceiling, mesh, { width: 8.49, spring: 3.55, crown: 6.96, trim: .14, depth: .13, color: '#82788c', y: -8, z: z + .68 });
    const boss = box(ceiling, .52, .46, .7, '#777083', 0, -.91, z + .34);
    boss.rotation.z = Math.PI / 4;
    for (const side of [-1, 1]) {
      box(scene, .68, 3.71, .76, darkStone, side * 8.82, 1.85, z + .28);
      box(scene, 1.13, .28, 1.14, voussoir, side * 8.82, 3.45, z + .28);
      box(scene, 1.28, .19, 1.24, '#605d6c', side * 8.82, .18, z + .28);
    }
  }
  for (const side of [-1, 1]) {
    [-11, -1, 9].forEach((z, i) => createWallBay(scene, helpers, side, z, ['king', 'queen', 'knight'][i]));
    for (const z of [-18, -8, 3, 13]) {
      for (let i = 0; i < 9; i++) {
        const link = mesh(ceiling, new THREE.TorusGeometry(.119, .025, 5, 9),
          i % 3 ? '#33323a' : '#5d4853', side * 6.85, -1.04 - i * .177, z);
        link.scale.y = 1.27;
        link.rotation.y = i % 2 ? Math.PI / 2 : 0;
      }
    }
    for (const y of [.3, 4.97, 7.27]) box(scene, .27, .16, 44, voussoir, side * 11.13, y, 0);
  }

  const cracks = [];
  for (let i = 0; i < 28; i++) {
    const x = ((i * 37) % 181) / 10 - 9, z = ((i * 71) % 388) / 10 - 20;
    const y = Math.abs(x) < 2.5 ? .088 : .028;
    cracks.push(x, y, z, x + .29, y, z + .18, x + .29, y, z + .18, x + .67, y, z - .06,
      x + .29, y, z + .18, x + .46, y, z + .44);
  }
  const fissures = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(cracks, 3));
  scene.add(new THREE.LineSegments(fissures, new THREE.LineBasicMaterial({ color: '#262530' })));
  for (let z = -17.7; z < 15; z += 2.6) {
    for (const x of [-1.87, 1.87]) {
      box(scene, .47, .013, .47, '#79707d', x, .065, z).rotation.y = Math.PI / 4;
      box(scene, .31, .013, .31, '#4d4c58', x, .073, z).rotation.y = Math.PI / 4;
    }
  }
}
