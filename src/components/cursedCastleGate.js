export const CASTLE_GATE_POSITION = Object.freeze({ x:0, z:-19 });
export const GATE_OPEN_SECONDS = 2.4;
export const SOLDIERS_FLEE_SECONDS = 3.4;

export function nearCastleGate(position, radius=14) {
  return Math.hypot(position.x-CASTLE_GATE_POSITION.x, position.z-CASTLE_GATE_POSITION.z)<radius;
}
export function castleGateProgress(elapsed, reduceMotion=false) {
  return reduceMotion ? 1 : Math.max(0, Math.min(1, elapsed/GATE_OPEN_SECONDS));
}
export function soldiersHaveFled(elapsed, reduceMotion=false) {
  return reduceMotion || elapsed>=SOLDIERS_FLEE_SECONDS;
}
