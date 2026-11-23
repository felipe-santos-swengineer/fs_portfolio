export function musicScene({ reading, inCursedCastle, inDungeon, inThrone, inRapids, inChamber, dragonBattle, dragonVictory, inCave, inTunnel, templeReached, inLake, inRuins }) {
  if (reading) return 'village';
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
