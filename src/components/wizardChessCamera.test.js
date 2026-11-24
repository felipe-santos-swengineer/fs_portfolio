import * as THREE from 'three';
import { createWizardChessCamera } from './wizardChessCamera';

test.each([[.58, .36], [.9, .22], [16 / 9, .24], [2.4, .52]])(
  'the full board stays in frame through a full orbit at aspect %s',
  (aspect, hud) => {
    const orbit = createWizardChessCamera(-13);
    for (const tilt of [-2, 0, 2]) {
      orbit.reset();
      orbit.rotate(0, tilt);
      for (let i = 0; i < 16; i++) {
        orbit.rotate(Math.PI / 8);
        const view = orbit.view(aspect, hud);
        for (const x of [-2.7, 2.7]) for (const y of [0, 1.8]) for (const z of [-15.7, -10.3]) {
          const projected = new THREE.Vector3(x, y, z).project(view);
          expect(Math.abs(projected.x)).toBeLessThan(1);
          expect(projected.y).toBeLessThanOrEqual(.9);
          expect(projected.y).toBeGreaterThanOrEqual(-1 + hud * 2 - 1e-6);
        }
      }
    }
  },
);

test('reset restores the original angle and framing', () => {
  const orbit = createWizardChessCamera(-13);
  const view = orbit.view(.9, .25);
  const original = view.matrixWorld.clone();
  orbit.rotate(1.4, -.4);
  expect(orbit.view(.9, .25).matrixWorld.equals(original)).toBe(false);
  orbit.reset();
  expect(orbit.view(.9, .25).matrixWorld.equals(original)).toBe(true);
});

test('zoom changes the view scale and reset restores it', () => {
  const orbit = createWizardChessCamera(-13);
  const width = () => {
    const camera = orbit.view(1);
    return camera.right - camera.left;
  };
  const initial = width();
  orbit.zoom(2);
  expect(width()).toBeCloseTo(initial / 2);
  orbit.zoom(.25);
  expect(width()).toBeCloseTo(initial * 2);
  orbit.reset();
  expect(width()).toBeCloseTo(initial);
});

test('extreme tilt and zoom keep the camera between the floor and ceiling', () => {
  const orbit = createWizardChessCamera(-13);
  orbit.rotate(0, -50);
  orbit.zoom(20);
  expect(orbit.view(1).position.y).toBeCloseTo(.25);
  orbit.rotate(0, 100);
  orbit.zoom(.00001);
  const camera = orbit.view(1);
  expect(camera.position.y).toBeGreaterThan(6);
  expect(camera.position.y).toBeLessThan(7.675);
});
