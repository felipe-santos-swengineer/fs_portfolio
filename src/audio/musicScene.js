export function musicScene({ reading, wizardChessOpen, inCorridor, inCursedCastle, inRoyalArena, kingBattle, inCastleCourtyard, witchEncounter, inDungeon, inThrone, inRapids, inChamber, dragonBattle, dragonVictory, inCave, inTunnel, templeReached, inLake, inRuins }) {
  if (reading) return 'village';
  if (wizardChessOpen) return 'wizardChess';
  if (inCorridor) return 'corridor';
  if (inCastleCourtyard && witchEncounter) return 'witchBattle';
  if (inRoyalArena) return kingBattle ? 'kingBattle' : 'cursedCastle';
  if (inCursedCastle) return 'cursedCastle';
  if (inDungeon) return 'dungeon';
  if (inThrone) return 'castle';
  if (inRapids) return 'rapids';
  if (inChamber && dragonVictory) return 'victory';
  if (inChamber && dragonBattle) return 'boss';
  if (inCave) return 'cave';
  if (inTunnel) return templeReached ? 'templeVillage' : 'temple';
  if (inLake || inRuins) return 'lake';
  return 'village';
}
