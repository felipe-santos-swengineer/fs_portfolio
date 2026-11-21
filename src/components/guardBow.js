// Guards incline smoothly as the visitor comes within greeting distance.
export function guardBowAtDistance(distance) {
  const proximity = Math.max(0, Math.min(1, (5.5 - distance) / 2.5));
  return .4 * proximity * proximity * (3 - 2 * proximity);
}
