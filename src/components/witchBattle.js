import * as THREE from 'three';

export const WITCH_LIVES = 3;
export const WITCH_LIGHTNING_HITS = 3;
const WAVES_PER_STRIKE = 3;
export const WITCH_WAVES = WITCH_LIGHTNING_HITS * WAVES_PER_STRIKE;
const CELL_SIZE = 4;
const COLUMNS = 9;
const timings = { warning: 4.5, shock: 2.4, recovery: 1.25, ascent: 1.2, strike: .65, spin: 5, descent: 1.2, fall: 1.45 };
const cells = Array.from({ length: COLUMNS * 12 }, (_, index) => ({
  index,
  x: (index % COLUMNS) * CELL_SIZE - 16,
  z: Math.floor(index / COLUMNS) * CELL_SIZE - 22,
}));

function safeCells(position, wave) {
  const distance = cell => Math.hypot(position.x - cell.x, position.z - cell.z);
  // Always offer a reachable refuge, including when the player is at a wall.
  const near = cells.filter(cell => Math.abs(cell.x) <= 12 && Math.abs(cell.z) <= 18
    && distance(cell) >= 5 && distance(cell) <= 11);
  const ahead = near.filter(cell => cell.z <= position.z - 2);
  const reachable = ahead.length ? ahead : near;
  reachable.sort((a, b) => Math.abs(a.x - position.x) - Math.abs(b.x - position.x));
  const first = reachable[(wave - 1) % Math.min(2, reachable.length)];
  const others = cells.filter(cell => Math.abs(cell.x) <= 12 && Math.abs(cell.z) <= 18
    && Math.hypot(cell.x - first.x, cell.z - first.z) >= 9);
  const second = others[wave * 13 % others.length];
  const third = others.find(cell => Math.hypot(cell.x - second.x, cell.z - second.z) >= 9);
  return [first, second, third];
}

export function isWitchRefuge(safe, position) {
  return safe.some(cell => Math.abs(position.x - cell.x) <= CELL_SIZE / 2
    && Math.abs(position.z - cell.z) <= CELL_SIZE / 2);
}

export function createWitchBattle(position) {
  return { phase: 'warning', wave: 1, lives: WITCH_LIVES, strikes: 0, remaining: timings.warning, safe: safeCells(position, 1), hit: false, reactionPending: false };
}

export function witchLightningProgress(battle) {
  if (battle.phase === 'strike' || battle.phase === 'spin') return 1;
  if (battle.phase === 'ascent') return 1 - battle.remaining / timings.ascent;
  if (battle.phase === 'descent') return battle.remaining / timings.descent;
  if (battle.phase === 'fall') return battle.remaining / timings.fall;
  return 0;
}

export function advanceWitchBattle(battle, dt, position) {
  if (!timings[battle.phase]) return;
  battle.remaining -= dt;
  if (battle.phase === 'spin' && !battle.reactionPending) battle.remaining = 0;
  if (battle.remaining <= 0) {
    if (battle.phase === 'warning') battle.phase = 'shock';
    else if (battle.phase === 'shock') battle.phase = battle.wave % WAVES_PER_STRIKE === 0 ? 'ascent' : 'recovery';
    else if (battle.phase === 'ascent') {
      battle.phase = 'strike';
      battle.strikes++;
    } else if (battle.phase === 'strike' && battle.reactionPending) battle.phase = 'spin';
    else if (battle.phase === 'strike' || battle.phase === 'spin') battle.phase = battle.strikes === WITCH_LIGHTNING_HITS ? 'fall' : 'descent';
    else if (battle.phase === 'fall') battle.phase = 'won';
    else {
      battle.phase = 'warning';
      battle.wave++;
      battle.safe = safeCells(position, battle.wave);
      battle.hit = false;
    }
    battle.remaining = timings[battle.phase] ?? 0;
  }
  if (battle.phase === 'shock' && !battle.hit && !isWitchRefuge(battle.safe, position)) {
    battle.hit = true;
    battle.lives--;
    if (!battle.lives) battle.phase = 'lost';
  }
}

export function createWitchBattleFloor(scene) {
  const floor = new THREE.Group();
  floor.visible = false;
  scene.add(floor);
  const tile = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
  tile.rotateX(-Math.PI / 2);
  const chargeMaterial = new THREE.MeshBasicMaterial({ color: '#313de9', transparent: true, opacity: .52, depthWrite: false });
  const charged = new THREE.InstancedMesh(tile, chargeMaterial, cells.length);
  const arcMaterial = new THREE.MeshBasicMaterial({ color: '#c3efff', transparent: true, opacity: .88, depthWrite: false });
  const zigzag = [[-1, 0], [-.52, .16], [-.28, -.18], [.11, .21], [.46, -.09], [1, .05]];
  const ribbon = new THREE.Shape();
  zigzag.forEach(([x, y], i) => { if (i === 0) ribbon.moveTo(x, y); else ribbon.lineTo(x, y); });
  [...zigzag].reverse().forEach(([x, y]) => ribbon.lineTo(x, y - .065));
  ribbon.closePath();
  const arcGeometry = new THREE.ShapeGeometry(ribbon);
  arcGeometry.rotateX(-Math.PI / 2);
  const arcs = new THREE.InstancedMesh(arcGeometry, arcMaterial, cells.length * 4);
  charged.renderOrder = 1;
  arcs.renderOrder = 2;
  charged.frustumCulled = arcs.frustumCulled = false;
  floor.add(charged, arcs);

  const pads = Array.from({ length: 3 }, () => {
    const pad = new THREE.Group();
    const surface = new THREE.Mesh(tile, new THREE.MeshBasicMaterial({ color: '#1fc26e', transparent: true, opacity: .54, depthWrite: false }));
    surface.position.y = .025;
    pad.add(surface);
    const edge = new THREE.MeshBasicMaterial({ color: '#afffbd' });
    for (const side of [-1, 1]) {
      const horizontal = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, .035, .075), edge);
      horizontal.position.set(0, .04, side * CELL_SIZE / 2);
      const vertical = new THREE.Mesh(new THREE.BoxGeometry(.075, .035, CELL_SIZE), edge);
      vertical.position.set(side * CELL_SIZE / 2, .04, 0);
      pad.add(horizontal, vertical);
    }
    const marker = new THREE.Mesh(new THREE.ConeGeometry(.58, .7, 4), edge);
    marker.position.y = 1.35;
    marker.rotation.z = Math.PI;
    pad.add(marker);
    floor.add(pad);
    return pad;
  });

  const transform = new THREE.Matrix4(), arc = new THREE.Object3D();
  function update(battle) {
    floor.visible = battle.phase === 'warning' || battle.phase === 'shock';
    charged.visible = arcs.visible = battle.phase === 'shock';
    if (!floor.visible) return;
    const safeIndices = new Set(battle.safe.map(cell => cell.index));
    pads.forEach((pad, index) => pad.position.set(battle.safe[index].x, 0, battle.safe[index].z));
    let tileIndex = 0, arcIndex = 0;
    for (const cell of cells) {
      if (safeIndices.has(cell.index)) continue;
      charged.setMatrixAt(tileIndex++, transform.makeTranslation(cell.x, .02, cell.z));
      for (let i = 0; i < 4; i++) {
        arc.position.set(cell.x + (i % 2 ? .9 : -.9), .068, cell.z + (i > 1 ? .9 : -.9));
        arc.scale.set(.62 + ((cell.index + i) % 4) * .07, 1, .85 + i * .15);
        arc.rotation.y = cell.index + i;
        arc.updateMatrix();
        arcs.setMatrixAt(arcIndex++, arc.matrix);
      }
    }
    charged.count = tileIndex;
    arcs.count = arcIndex;
    charged.instanceMatrix.needsUpdate = arcs.instanceMatrix.needsUpdate = true;
  }
  function animate(time, reduced) {
    arcMaterial.opacity = reduced ? .88 : .76 + Math.sin(time * 6) * .12;
  }
  return { update, animate };
}

export function createWitchLightning(scene) {
  const bolt = new THREE.Group();
  bolt.visible = false;
  const material = new THREE.MeshBasicMaterial({ color: '#d1f5ff', fog: false });
  const points = [[0, 1, 0], [.75, 2.6, .2], [-.35, 4.5, -.28], [.7, 6.7, 0], [.05, 9, .35], [1.2, 13, .1]]
    .map(point => new THREE.Vector3(...point));
  const up = new THREE.Vector3(0, 1, 0);
  points.slice(1).forEach((point, index) => {
    const start = points[index], direction = point.clone().sub(start);
    const segment = new THREE.Mesh(new THREE.CylinderGeometry(.09, .13, direction.length(), 5), material);
    segment.position.copy(start).lerp(point, .5);
    segment.quaternion.setFromUnitVectors(up, direction.normalize());
    bolt.add(segment);
  });
  const light = new THREE.PointLight('#8bd6ff', 55, 12);
  light.position.y = 1;
  bolt.add(light);
  scene.add(bolt);
  return bolt;
}
