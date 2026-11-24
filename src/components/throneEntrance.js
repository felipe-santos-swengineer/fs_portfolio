import * as THREE from 'three';
import { Chess } from 'chess.js';
import { createWizardPiece } from './wizardChessPieces';
import { createWizardChessAttack } from './wizardChessAttack';
import { createWizardChessCamera } from './wizardChessCamera';
import { ARCANE_COLOR, engraveChessPlinth, runeArc } from './arcaneChamberRitual';

export const THRONE_DOOR_Z = -20.6;
export const BOARD_Z = -13;

export function createThroneEntrance(scene, { mesh, box, cylinder, sphere }) {
  const door = new THREE.Group();
  const pieces = new Map();
  const tiles = new Map();
  const activePieces = [];
  const ray = new THREE.Raycaster();
  const lightSquare = new THREE.MeshBasicMaterial({ color: '#efd58e', transparent: true, opacity: .38 });
  const targetSquare = new THREE.MeshBasicMaterial({ color: '#83eabd', transparent: true, opacity: .42 });
  const boardView = createWizardChessCamera(BOARD_Z);
  const leaves = [];
  door.position.z = THRONE_DOOR_Z;
  scene.add(door);
  for (const side of [-1, 1]) {
    box(door, .65, 4, 1.1, '#5e596a', side * 2.1, 2, 0);
    const leaf = new THREE.Group();
    leaf.position.x = side * 1.77;
    door.add(leaf);
    leaves.push({ leaf, side });
    box(leaf, 1.76, 4.3, .23, '#302a39', -side * .88, 2.15, 0);
    for (let i = 0; i < 6; i++) {
      box(leaf, .251, 4, .04, i % 2 ? '#3b3142' : '#383041', -side * (.195 + .272 * i), 2.17, .128);
    }
    for (const height of [.35, 1.45, 3.58, 4.16]) {
      box(leaf, 1.77, .12, .3, '#8f7282', -side * .88, height, 0);
    }
  }
  box(door, 4.85, .58, 1.14, '#5e596a', 0, 4.28, 0);
  box(door, 3.6, 4.2, .25, '#1b151e', 0, 2.1, -.53);

  const seal = new THREE.Group();
  seal.position.set(0, 2.15, .26);
  door.add(seal);
  const magic = new THREE.MeshBasicMaterial({ color: ARCANE_COLOR, transparent: true, opacity: .9 });
  for (const radius of [1.28, 1.44]) seal.add(new THREE.Mesh(new THREE.TorusGeometry(radius, .038, 8, 48), magic));
  runeArc(seal, new THREE.LineBasicMaterial({ color: '#e6cdff' }), {
    count: 16, radius: 1.36, size: .117, plane: 'wall', z: .043,
  });
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(.48), magic);
  seal.add(star);
  const glow = new THREE.PointLight('#c172ff', 32, 10);
  glow.position.z = 1;
  seal.add(glow);

  const board = new THREE.Group();
  board.position.z = BOARD_Z;
  scene.add(board);
  box(board, 5.4, .4, 5.4, '#30253b', 0, .23, 0);
  engraveChessPlinth(board, { box });
  box(board, 5.15, .15, 5.15, '#ac8253', 0, .45, 0);
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = 'abcdefgh'[file] + (8 - rank);
      const tile = box(board, .61, .09, .61, (rank + file) % 2 ? '#5d436a' : '#dac09d',
        (file - 3.5) * .62, .55, (rank - 3.5) * .62);
      tile.userData.square = square;
      const marker = new THREE.Mesh(new THREE.PlaneGeometry(.55, .55), targetSquare);
      marker.rotation.x = -Math.PI / 2;
      marker.position.y = .047;
      marker.visible = false;
      tile.add(marker);
      tiles.set(square, { tile, marker });
    }
  }

  const attack = createWizardChessAttack(board, { box });
  let slide;
  let idleTime = 0;
  let focusedSquare = null;
  function updateBoard(position, move) {
    slide = null;
    activePieces.length = 0;
    for (const group of pieces.values()) group.visible = false;
    for (const [rank, row] of position.entries()) {
      for (const [file, piece] of row.entries()) {
        if (!piece) continue;
        const key = rank * 8 + file;
        const kind = piece.color + piece.type;
        const cacheKey = key + kind;
        let group = pieces.get(cacheKey);
        if (!group) {
          group = createWizardPiece(piece, { mesh, box, cylinder, sphere });
          group.rotation.y = piece.color === 'w' ? Math.PI : 0;
          group.userData.phase = (key * .73) % (Math.PI * 2);
          group.position.set((file - 3.5) * .62, .6, (rank - 3.5) * .62);
          group.userData.square = 'abcdefgh'[file] + (8 - rank);
          board.add(group);
          pieces.set(cacheKey, group);
        }
        group.position.set((file - 3.5) * .62, .6, (rank - 3.5) * .62);
        if (move?.to === group.userData.square) {
          const from = tiles.get(move.from).tile.position;
          slide = { group, from, to: group.position.clone(), elapsed: 0 };
        }
        group.visible = true;
        activePieces.push(group);
      }
    }
  }

  updateBoard(new Chess().board());
  board.visible = seal.visible = false;
  let rise = 0;
  let opening = 0;
  return {
    updateBoard,
    capture(position, move, onImpact, onComplete) {
      if (slide) slide.group.position.copy(slide.to);
      slide = null;
      const find = square => activePieces.find(piece => piece.userData.square === square);
      const attacker = find(move.from);
      const defender = find(move.flags.includes('e') ? move.to[0] + move.from[1] : move.to);
      const target = tiles.get(move.to).tile.position;
      attack.start(move, attacker, defender, target, onImpact, () => {
        updateBoard(position);
        onComplete();
      });
    },
    dispose() { lightSquare.dispose(); },
    rotate: boardView.rotate,
    zoom: boardView.zoom,
    resetView: boardView.reset,
    highlight(selected, targets) {
      focusedSquare = selected;
      for (const [square, { marker }] of tiles) {
        marker.visible = square === selected || Boolean(targets?.has(square));
        marker.material = square === selected ? lightSquare : targetSquare;
      }
    },
    view: boardView.view,
    pick(point) {
      if (!board.visible) return null;
      ray.setFromCamera(point, boardView.camera);
      const hits = ray.intersectObjects(activePieces, true);
      const tile = ray.intersectObjects([...tiles.values()].map(entry => entry.tile), false)[0];
      if (hits[0] && (!tile || hits[0].distance < tile.distance)) {
        let object = hits[0].object;
        while (!object.userData.square && object.parent) object = object.parent;
        return object.userData.square;
      }
      return tile?.object.userData.square;
    },
    animate(dt, revealed, unlocked, reduced, time) {
      if (slide) {
        slide.elapsed += dt;
        const progress = reduced ? 1 : THREE.MathUtils.smoothstep(slide.elapsed, 0, .24);
        slide.group.position.lerpVectors(slide.from, slide.to, progress);
        slide.group.position.y = .6;
        if (progress === 1) slide = null;
      }
      rise = reduced ? Number(revealed && !unlocked)
        : THREE.MathUtils.clamp(rise + (revealed && !unlocked ? 1 : -1) * dt / 1.2, 0, 1);
      opening = reduced ? Number(unlocked) : THREE.MathUtils.clamp(opening + Number(unlocked) * dt, 0, 1);
      board.visible = rise > 0;
      board.position.y = -1.6 * (1 - THREE.MathUtils.smoothstep(rise, 0, 1));
      if (board.visible) {
        idleTime += dt;
        for (const piece of activePieces) {
          const { pose, phase, square } = piece.userData;
          pose(idleTime + phase, square === focusedSquare, reduced);
        }
      }
      attack.animate(dt, reduced);
      seal.visible = revealed && !unlocked;
      magic.opacity = reduced ? .9 : .83 + .16 * Math.sin(time * 3);
      star.rotation.y = reduced ? 0 : time * 1.5;
      for (const { leaf, side } of leaves) leaf.rotation.y = side * opening * Math.PI * .53;
    },
    blocks(x, z, revealed, unlocked) {
      return revealed && !unlocked && Math.abs(x) < 2.95 && Math.abs(z - BOARD_Z) < 2.95;
    },
  };
}
