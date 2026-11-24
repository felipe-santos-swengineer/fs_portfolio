import * as THREE from 'three';
import { arcBand } from './arcaneChamberArchitecture';

export const ARCANE_COLOR = '#b492ff';
const thresholdStone = '#4a4657';
const brass = '#8e7781';
const glyphs = [
  [[-.5,-.5],[0,.5],[.5,-.5],[-.31,-.08],[.32,-.08]],
  [[0,-.5],[0,.5],[-.44,.05],[0,-.18],[.45,.26]],
  [[0,-.48],[-.46,0],[0,.48],[.46,0],[0,-.48]],
  [[-.43,-.45],[-.43,.45],[.42,.16],[-.43,-.1],[.42,-.42]],
];

export function runeArc(parent, material, { count, radius, size, plane = 'floor', y = 0, z = 0, from = 0, length = 2 * Math.PI }) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const angle = from + length * i / count;
    const a = Math.sin(angle), b = Math.cos(angle);
    const add = ([x, h]) => {
      const px = a * (radius + h * size) + b * x * size;
      const py = b * (radius + h * size) - a * x * size;
      positions.push(px, plane === 'floor' ? y : y + py, plane === 'floor' ? z + py : z);
    };
    const rune = glyphs[i % glyphs.length];
    for (let j = 1; j < rune.length; j++) { add(rune[j - 1]); add(rune[j]); }
  }
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  parent.add(new THREE.LineSegments(geometry, material));
}

export function engraveChessPlinth(board, { box }) {
  box(board, 5.55, .14, 5.55, '#474252', 0, .08, 0);
  box(board, 5.5, .09, 5.5, '#7b6676', 0, .22, 0);
  const ink = new THREE.LineBasicMaterial({ color: '#ddc7e6' });
  for (const side of [-1, 1]) for (let i = -5; i <= 5; i++) {
    const slot = new THREE.Group();
    slot.position.set(i * .46, .34, side * 2.71);
    slot.rotation.y = side > 0 ? 0 : Math.PI;
    runeArc(slot, ink, { count: 1, radius: 0, size: .13, plane: 'wall' });
    board.add(slot);
  }
}

function createGuardian(scene, { mesh, box, cylinder, sphere }, x, z) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  root.rotation.y = -Math.sign(x) * .22;
  scene.add(root);
  box(root, 1.92, .27, 1.6, brass, 0, .15, 0);
  box(root, 1.65, .7, 1.39, thresholdStone, 0, .64, 0);
  box(root, 1.78, .14, 1.5, '#6c6372', 0, 1.03, 0);
  mesh(root, new THREE.CylinderGeometry(.36, .69, 1.58, 7), '#676270', 0, 1.87, 0);
  for (const side of [-1, 1]) {
    box(root, .19, 1.22, .25, '#827b87', side * .31, 1.78, .4).rotation.z = side * .18;
    sphere(root, .29, thresholdStone, side * .42, 2.34, 0);
    box(root, .18, .88, .21, thresholdStone, side * .46, 1.98, .09).rotation.z = side * .21;
  }
  sphere(root, .48, '#777080', 0, 2.83, -.059).scale.set(1, 1.22, .91);
  sphere(root, .31, '#24212d', 0, 2.78, .27).scale.y = 1.16;
  for (const side of [-1, 1]) {
    box(root, .13, .039, .024, ARCANE_COLOR, side * .12, 2.80, .566);
  }
  box(root, .104, 1.63, .11, brass, 0, 1.94, .58);
  box(root, .58, .1, .12, '#98808b', 0, 2.44, .6);
  mesh(root, new THREE.OctahedronGeometry(.155), '#c7afed', 0, 2.62, .61);
  return root;
}

function createFlame(root, y, material) {
  const flame = new THREE.Group();
  flame.position.y = y;
  for (let i = 0; i < 3; i++) {
    const tongue = new THREE.Mesh(new THREE.ConeGeometry(.14 - i * .017, .43 - i * .055, 5), material);
    tongue.position.set((i - 1) * .096, .13 + i * .057, i % 2 ? -.09 : .05);
    tongue.rotation.z = (i - 1) * .27;
    flame.add(tongue);
  }
  root.add(flame);
  return flame;
}

export function buildArcaneRitual(scene, helpers, boardZ, doorZ) {
  const { mesh, box, cylinder } = helpers;
  const stoneInk = new THREE.LineBasicMaterial({ color: '#897795' });
  const runeInk = new THREE.LineBasicMaterial({ color: ARCANE_COLOR, transparent: true, depthWrite: false });
  const crystals = new THREE.MeshStandardMaterial({ color: '#9180bc', emissive: '#664dad', emissiveIntensity: .75, roughness: .35, metalness: .2 });
  const flameMaterial = new THREE.MeshBasicMaterial({ color: '#9879ff', transparent: true, opacity: .8, depthWrite: false });
  const ground = new THREE.Group();
  ground.position.z = boardZ;
  scene.add(ground);
  cylinder(ground, 4.05, .07, '#3b3747', 0, .052, 0, 12);
  const circle = (radius, width, material) => {
    const band = new THREE.Mesh(new THREE.RingGeometry(radius - width, radius, 80), material);
    band.rotation.x = -Math.PI / 2;
    band.position.y = .097;
    ground.add(band);
  };
  circle(3.95, .045, new THREE.MeshBasicMaterial({ color: '#877294' }));
  circle(3.29, .037, new THREE.MeshBasicMaterial({ color: '#8a7c91' }));
  const magicBand = new THREE.MeshBasicMaterial({ color: ARCANE_COLOR, transparent: true, depthWrite: false });
  circle(3.38, .019, magicBand);
  runeArc(ground, stoneInk, { count: 32, radius: 3.71, size: .245, y: .1 });
  runeArc(ground, runeInk, { count: 32, radius: 3.71, size: .245, y: .104 });

  const obelisks = [], flames = [], guardians = [], stones = [];
  for (const side of [-1, 1]) {
    for (const offset of [-3.55, 3.55]) {
      const root = new THREE.Group();
      root.position.set(side * 3.73, 0, boardZ + offset);
      scene.add(root);
      stones.push({ x: root.position.x, z: root.position.z, radius: .65 });
      box(root, 1.02, .22, 1.02, brass, 0, .125, 0);
      box(root, .77, .15, .77, thresholdStone, 0, .3, 0);
      mesh(root, new THREE.CylinderGeometry(.29, .44, 1.5, 4), thresholdStone, 0, 1.08, 0).rotation.y = Math.PI / 4;
      box(root, .58, .14, .58, '#a18d9e', 0, 1.82, 0);
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.33), crystals);
      crystal.position.y = 2.28;
      crystal.scale.y = 1.64;
      root.add(crystal);
      obelisks.push({ root, crystal });
      flames.push(createFlame(root, 2.64, flameMaterial));
    }

    const guardian = createGuardian(scene, helpers, side * 3.9, doorZ + 2.4);
    guardians.push(guardian);
    stones.push({ x: guardian.position.x, z: guardian.position.z, radius: 1.14 });
    const brazier = new THREE.Group();
    brazier.position.set(side * 2.54, 0, doorZ + 1.35);
    scene.add(brazier);
    cylinder(brazier, .37, .16, brass, 0, .12, 0);
    cylinder(brazier, .16, .88, thresholdStone, 0, .56, 0);
    mesh(brazier, new THREE.CylinderGeometry(.48, .22, .32, 8), brass, 0, 1.1, 0);
    flames.push(createFlame(brazier, 1.26, flameMaterial));
    guardians.push(brazier);
    stones.push({ x: brazier.position.x, z: brazier.position.z, radius: .48 });
  }

  const gate = new THREE.Group();
  gate.position.z = doorZ;
  scene.add(gate);
  const pointedFrame = { width: 2.28, spring: 4.02, crown: 6.45 };
  arcBand(gate, mesh, { ...pointedFrame, trim: .43, depth: .44, z: .22, color: '#746979' });
  arcBand(gate, mesh, { ...pointedFrame, width: 2.07, crown: 6.2, trim: .16, depth: .22, z: .39, color: brass });
  arcBand(gate, mesh, { ...pointedFrame, width: 1.86, crown: 6.03, trim: .16, depth: .19, z: .32, color: thresholdStone });
  for (const side of [-1, 1]) {
    box(gate, .43, 4, .52, '#6d626f', side * 2.48, 2.02, .4);
    box(gate, .17, 3.86, .12, brass, side * 2.29, 2.09, .73);
    box(gate, .7, .28, .73, '#827582', side * 2.48, 4.03, .42);
    for (let i = 0; i < 6; i++) {
      const group = new THREE.Group();
      group.position.set(side * 2.51, .62 + i * .55, .691);
      runeArc(group, runeInk, { count: 1, radius: 0, size: .19, plane: 'wall' });
      gate.add(group);
    }
    for (let i = 0; i < 7; i++) {
      const link = mesh(gate, new THREE.TorusGeometry(.155, .034, 5, 10), '#746473',
        side * (1.44 - i * .096), 5.08 - Math.sin(i * .21) * .27, .6);
      link.scale.y = 1.33;
      link.rotation.set(0, i % 2 ? 1.05 : 0, side * -.58);
    }
  }
  const heraldry = new THREE.Shape();
  heraldry.moveTo(-.62, .63); heraldry.lineTo(.62, .63); heraldry.lineTo(.54, -.16);
  heraldry.quadraticCurveTo(.39, -.54, 0, -.71);
  heraldry.quadraticCurveTo(-.39, -.54, -.54, -.16);
  heraldry.closePath();
  mesh(gate, new THREE.ExtrudeGeometry(heraldry, { depth: .08, bevelEnabled: false }), '#4e385a', 0, 5.28, .62);
  for (const x of [-.3, 0, .3]) {
    box(gate, .13, .31 + (x === 0 ? .16 : 0), .046, '#c6a5a5', x, 5.35, .73);
  }
  box(gate, .76, .12, .05, '#c6a5a5', 0, 5.19, .73);
  box(gate, .31, .26, .05, '#c6a5a5', 0, 4.94, .735).rotation.z = Math.PI / 4;
  const gateLight = new THREE.PointLight('#a57efa', 19, 10);
  gateLight.position.set(0, 3.1, doorZ + 1.7);
  scene.add(gateLight);
  const boardLight = new THREE.PointLight('#bfb3ee', 45, 11);
  boardLight.position.set(0, 4.45, boardZ);
  scene.add(boardLight);

  const conduits = [-1, 1].map(side => {
    const points = [
      new THREE.Vector3(side * 2.12, .098, boardZ - 3.17),
      new THREE.Vector3(side * 1.12, .098, doorZ + 3.45),
      new THREE.Vector3(side * .53, .098, doorZ + .47),
    ];
    for (let i = 1; i < points.length; i++) {
      const from = points[i - 1], to = points[i];
      const length = from.distanceTo(to);
      const edge = box(scene, .15, .024, length, '#756480', (from.x + to.x) / 2, .069, (from.z + to.z) / 2);
      edge.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), runeInk));
    const path = new THREE.CurvePath();
    for (let i = 1; i < points.length; i++) path.add(new THREE.LineCurve3(points[i - 1], points[i]));
    const pulse = new THREE.Mesh(new THREE.IcosahedronGeometry(.1), flameMaterial);
    scene.add(pulse);
    return { path, pulse };
  });

  const dust = new THREE.Group();
  scene.add(dust);
  const positions = new Float32Array(66 * 3);
  const dustGeometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const motes = new THREE.Points(dustGeometry, new THREE.PointsMaterial({
    color: '#d6beff', transparent: true, opacity: .69, size: .065, depthWrite: false,
  }));
  motes.frustumCulled = false;
  dust.add(motes);

  return {
    stones,
    update(time, revealed, unlocked, reduced, chessView) {
      const live = revealed && !unlocked;
      const pulse = reduced ? .7 : .63 + .19 * Math.sin(time * 2.25);
      runeInk.opacity = live ? pulse : .16;
      magicBand.opacity = live ? pulse : .08;
      crystals.emissiveIntensity = live ? 1.3 + pulse : .35;
      gateLight.intensity = live ? 22 + pulse * 7 : 9;
      boardLight.intensity = revealed ? 54 : 23;
      // Tall scenery clears the orbit view, while the floor and its engravings stay in place.
      for (const { root, crystal } of obelisks) {
        root.visible = !chessView;
        crystal.rotation.y = reduced ? .32 : time * .52;
      }
      for (const guardian of guardians) guardian.visible = !chessView;
      flames.forEach((flame, index) => {
        flame.scale.y = reduced ? 1 : 1 + Math.sin(time * 3.4 + index) * .15;
      });
      conduits.forEach(({ path, pulse: spark }, index) => {
        spark.visible = live;
        spark.position.copy(path.getPointAt(reduced ? .42 : (time * .43 + index * .47) % 1));
        spark.position.y += .026;
      });
      dust.visible = live && !chessView;
      if (!dust.visible) return;
      for (let i = 0; i < positions.length / 3; i++) {
        const bySeal = i >= 45;
        const angle = i * 2.399 + (reduced ? 0 : time * .16);
        const radius = bySeal ? .62 + (i % 5) * .24 : 2.8 + (i % 7) * .17;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = bySeal ? 1.2 + (i % 9) * .28 : .14 + (i % 9) * .132;
        positions[i * 3 + 2] = (bySeal ? doorZ + .65 : boardZ) + Math.sin(angle) * radius * (bySeal ? .25 : 1);
      }
      dustGeometry.attributes.position.needsUpdate = true;
    },
  };
}
