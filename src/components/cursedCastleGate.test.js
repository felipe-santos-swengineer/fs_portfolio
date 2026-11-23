import { nearCastleGate, castleGateProgress, soldiersHaveFled } from './cursedCastleGate';

test('the gate is triggered near the entrance, not at the portal', () => {
  expect(nearCastleGate({x:0,z:24})).toBe(false);
  expect(nearCastleGate({x:0,z:-10})).toBe(true);
  expect(nearCastleGate({x:20,z:-10})).toBe(false);
});

test('opening and fleeing finish progressively, or immediately with reduced motion', () => {
  expect(castleGateProgress(0)).toBe(0);
  expect(castleGateProgress(1.2)).toBeCloseTo(.5);
  expect(castleGateProgress(10)).toBe(1);
  expect(soldiersHaveFled(2)).toBe(false);
  expect(soldiersHaveFled(3.4)).toBe(true);
  expect(castleGateProgress(0,true)).toBe(1);
  expect(soldiersHaveFled(0,true)).toBe(true);
});
