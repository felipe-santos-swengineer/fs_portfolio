import { Chess } from 'chess.js';

const value = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };
export const chessLevels = {
  easy: { depth: 2, nodes: 2500 },
  medium: { depth: 3, nodes: 12500 },
  hard: { depth: 6, nodes: 75000 },
};

function evaluate(game) {
  let score = 0;
  for (const [rank, row] of game.board().entries()) {
    for (const [file, piece] of row.entries()) {
      if (!piece) continue;
      const advance = piece.color === 'w' ? 6 - rank : rank - 1;
      const center = 7 - Math.abs(rank - 3.5) - Math.abs(file - 3.5);
      const position = piece.type === 'p' ? advance * 8 + center * 3
        : piece.type === 'k' ? -center * 8
          : center * (piece.type === 'n' || piece.type === 'b' ? 10 : 3);
      score += (piece.color === game.turn() ? 1 : -1) * (value[piece.type] + position);
    }
  }
  return score;
}

const priority = move => (move.captured ? 10 * value[move.captured] - value[move.piece] : 0)
  + (move.promotion ? value[move.promotion] : 0);
const budgetExceeded = Symbol('search budget');

export function findChessMove(history, level) {
  const game = new Chess();
  for (const move of history) game.move(move);
  if (game.isGameOver()) return null;
  const { depth, nodes } = chessLevels[level];
  // chess.js 1.4.0 exposes its raw legal moves internally. Search uses those
  // to avoid generating SAN and FEN for every branch. The UI uses its public API.
  const ordered = () => game._moves().sort((a, b) => priority(b) - priority(a));
  const push = move => { game._makeMove(move); game._incPositionCount(); };
  const pop = () => {
    const hash = game._hash;
    game._undoMove();
    game._decPositionCount(hash);
  };
  let visited = 0;

  function search(remaining, alpha, beta, ply) {
    if (++visited > nodes) throw budgetExceeded;
    const moves = ordered();
    const checked = game.inCheck();
    if (!moves.length) return checked ? -100000 + ply : 0;
    if (game.isDrawByFiftyMoves() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) return 0;
    if (remaining <= 0) {
      const score = evaluate(game);
      if (level === 'easy' || remaining <= -3) return score;
      if (!checked) {
        if (score >= beta) return score;
        alpha = Math.max(alpha, score);
      }
    }
    for (const move of moves) {
      if (remaining <= 0 && !checked && !move.captured && !move.promotion) continue;
      push(move);
      const score = -search(remaining - 1, -beta, -alpha, ply + 1);
      pop();
      if (score >= beta) return score;
      alpha = Math.max(alpha, score);
    }
    return alpha;
  }

  const moves = ordered();
  let best = moves[0];
  try {
    for (let iteration = 1; iteration <= depth; iteration++) {
      const principal = best;
      const candidates = [principal, ...moves.filter(move => move !== principal)];
      let score = -Infinity;
      let next = best;
      for (const move of candidates) {
        push(move);
        const result = -search(iteration - 1, -Infinity, -score, 1);
        pop();
        if (result > score) {
          score = result;
          next = move;
        }
      }
      best = next;
      if (score >= 100000 - iteration) break;
    }
  } catch (error) {
    if (error !== budgetExceeded) throw error;
  }
  const square = index => 'abcdefgh'[index & 7] + (8 - (index >> 4));
  return { from: square(best.from), to: square(best.to), promotion: best.promotion };
}
