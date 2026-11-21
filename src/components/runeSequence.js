// Each rune advances once; re-entering the same rune is handled by collision tracking.
export function advanceRuneSequence(sequence, progress, rune) {
  if (rune !== sequence[progress]) return { progress: 0, outcome: 'wrong' };
  const next = progress + 1;
  return { progress: next, outcome: next === sequence.length ? 'complete' : 'correct' };
}
