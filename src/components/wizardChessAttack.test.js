import * as THREE from 'three';
import { Chess } from 'chess.js';
import { createThroneEntrance } from './throneEntrance';
import { createWizardChessAttack } from './wizardChessAttack';

const box = parent => parent.add(new THREE.Group());
const makePiece = x => {
  const piece = new THREE.Group();
  piece.position.set(x, .6, 0);
  piece.userData.figure = new THREE.Group();
  piece.userData.sword = new THREE.Group();
  return piece;
};

test.each(['p', 'n', 'r', 'b', 'q', 'k'])('capture with %s plays one impact before completing', piece => {
  const attack = createWizardChessAttack(new THREE.Group(), { box });
  const attacker = makePiece(0), defender = makePiece(1);
  const originalDefender = defender.position.clone();
  const effects = jest.fn();
  attack.start({ piece }, attacker, defender, defender.position, effects, () => effects('complete'));
  attack.animate(0, false);
  expect(effects).not.toHaveBeenCalled();
  for (let frame = 0; frame < 32; frame++) attack.animate(.05, false);
  expect(effects.mock.calls).toEqual([[piece], ['complete']]);
  expect(defender.position.equals(originalDefender)).toBe(true);
});

test('reduced motion completes the capture on the next unpaused frame', () => {
  const board = new THREE.Group();
  const attack = createWizardChessAttack(board, { box });
  const impact = jest.fn(), complete = jest.fn();
  const defender = makePiece(1);
  attack.start({ piece: 'n' }, makePiece(0), defender, defender.position, impact, complete);
  attack.animate(0, true);
  expect(complete).not.toHaveBeenCalled();
  attack.animate(.02, true);
  expect(impact).toHaveBeenCalledTimes(1);
  expect(complete).toHaveBeenCalledTimes(1);
  expect(board.children[0].visible).toBe(false);
});

test('the 3D board retains a pawn capture until its presentation completes', () => {
  const world = new THREE.Scene();
  const mesh = (parent, geometry, color, x, y, z) => {
    const model = new THREE.Mesh(geometry);
    model.position.set(x, y, z);
    parent.add(model);
    return model;
  };
  const box = (parent, w, h, d, ...args) => mesh(parent, new THREE.BoxGeometry(w, h, d), ...args);
  const cylinder = (parent, r, h, ...args) => mesh(parent, new THREE.CylinderGeometry(r, r, h), ...args);
  const sphere = (parent, r, ...args) => mesh(parent, new THREE.IcosahedronGeometry(r), ...args);
  const throne = createThroneEntrance(world, { mesh, box, cylinder, sphere });
  const game = new Chess();
  for (const move of ['e4', 'e5', 'd4']) game.move(move);
  throne.updateBoard(game.board());
  const capture = game.move('exd4');
  const complete = jest.fn();
  throne.capture(game.board(), capture, jest.fn(), complete);
  for (let frame = 0; frame < 16; frame++) throne.animate(.05, true, false, false, 0);
  expect(complete).toHaveBeenCalledTimes(1);
});
