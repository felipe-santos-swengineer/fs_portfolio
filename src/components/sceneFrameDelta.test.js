import { sceneFrameDelta } from './sceneFrameDelta';

test('never runs animation clocks backwards on an early animation frame', () => {
  expect(sceneFrameDelta(999, 1000)).toBe(0);
  expect(sceneFrameDelta(1016, 1000)).toBeCloseTo(.016);
  expect(sceneFrameDelta(1500, 1000)).toBe(.05);
});
