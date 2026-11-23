import { insideCursedCastleBounds, insideCursedCastleBackdrop } from './cursedCastleBounds';

test('the playable area stops movement at each outer edge', () => {
  expect(insideCursedCastleBounds(0,24)).toBe(true);
  expect(insideCursedCastleBounds(0,31)).toBe(true);
  expect(insideCursedCastleBounds(-37,0)).toBe(false);
  expect(insideCursedCastleBounds(37,0)).toBe(false);
  expect(insideCursedCastleBounds(0,-15)).toBe(false);
  expect(insideCursedCastleBounds(0,35)).toBe(false);
});


test('the backdrop excludes scenery extending past its black edges', () => {
  expect(insideCursedCastleBackdrop(0, 31, 2)).toBe(true);
  expect(insideCursedCastleBackdrop(38, 0, .2)).toBe(false);
  expect(insideCursedCastleBackdrop(0, -31)).toBe(false);
  expect(insideCursedCastleBackdrop(0, 41)).toBe(false);
});
