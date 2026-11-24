import { Chess } from 'chess.js';
import { findChessMove } from './wizardChessEngine';

test.each(['easy', 'medium', 'hard'])('the %s opponent plays a legal forced mate', level => {
  const history = ['f3', 'e5', 'g4'];
  const game = new Chess();
  history.forEach(move => game.move(move));
  expect(game.move(findChessMove(history, level)).san).toBe('Qh4#');
  expect(game.isCheckmate()).toBe(true);
});

test('the opponent does not move after a threefold repetition', () => {
  const cycle = ['Nf3', 'Nf6', 'Ng1', 'Ng8'];
  expect(findChessMove([...cycle, ...cycle], 'hard')).toBeNull();
});
