import { guardBowAtDistance } from './guardBow';

test('a reverencia aumenta suavemente com a proximidade e respeita os limites', () => {
  expect(guardBowAtDistance(8)).toBe(0);
  expect(guardBowAtDistance(5.5)).toBe(0);
  expect(guardBowAtDistance(4)).toBeGreaterThan(0);
  expect(guardBowAtDistance(3)).toBeCloseTo(.4);
  expect(guardBowAtDistance(0)).toBeCloseTo(.4);
});
