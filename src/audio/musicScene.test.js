import { musicScene } from './musicScene';

test('selects village, cave, and boss music with nested scene priority', () => {
  expect(musicScene({})).toBe('village');
  expect(musicScene({ inCursedCastle: true })).toBe('cursedCastle');
  expect(musicScene({ inCursedCastle: true, reading: true })).toBe('village');
  expect(musicScene({ inTunnel: true, templeReached: true, inRuins: true })).toBe('templeVillage');
  expect(musicScene({ inCave: true, inTunnel: true, inRuins: true })).toBe('cave');
  expect(musicScene({ inChamber: true, inCave: true, dragonBattle: false })).toBe('cave');
  expect(musicScene({ inChamber: true, inCave: true, dragonBattle: true })).toBe('boss');
  expect(musicScene({ inChamber: true, inCave: true, dragonVictory: true })).toBe('victory');
  expect(musicScene({ inCave: true, dragonVictory: true })).toBe('cave');
  expect(musicScene({ inChamber: true, inCave: true, dragonBattle: true, reading: true })).toBe('village');
});
