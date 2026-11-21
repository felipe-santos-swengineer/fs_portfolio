import { advanceRuneSequence } from './runeSequence';

test('cada runa correta avanca na primeira passagem e completa a sequencia', () => {
  const sequence = [2, 0, 3, 1];
  let progress = 0;
  sequence.forEach((rune, index) => {
    const result = advanceRuneSequence(sequence, progress, rune);
    expect(result.progress).toBe(index + 1);
    expect(result.outcome).toBe(index === 3 ? 'complete' : 'correct');
    progress = result.progress;
  });
});

test('uma runa incorreta reinicia a sequencia', () => {
  expect(advanceRuneSequence([2, 0, 3, 1], 1, 1)).toEqual({ progress: 0, outcome: 'wrong' });
});
