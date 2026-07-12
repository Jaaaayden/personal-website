import {
  COLS,
  WINDOWS,
  checkWin,
  drop,
  legalCols,
  type Board,
  type Player,
} from "./engine";

const CENTER_ORDER = [3, 2, 4, 1, 5, 0, 6];
const WIN_SCORE = 100000;

/** Static evaluation from `player`'s perspective. */
export function evaluate(board: Board, player: Player): number {
  const opponent: Player = player === 1 ? 2 : 1;
  let score = 0;
  for (const window of WINDOWS) {
    let mine = 0;
    let theirs = 0;
    for (const idx of window) {
      if (board[idx] === player) mine++;
      else if (board[idx] === opponent) theirs++;
    }
    if (mine > 0 && theirs > 0) continue;
    if (mine === 4) score += WIN_SCORE;
    else if (mine === 3) score += 120;
    else if (mine === 2) score += 15;
    else if (theirs === 4) score -= WIN_SCORE;
    else if (theirs === 3) score -= 120;
    else if (theirs === 2) score -= 15;
  }
  // Center column control.
  for (let row = 0; row < 6; row++) {
    if (board[row * COLS + 3] === player) score += 5;
    else if (board[row * COLS + 3] === opponent) score -= 5;
  }
  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  current: Player,
  bot: Player
): number {
  const outcome = checkWin(board);
  if (outcome === bot) return WIN_SCORE + depth; // prefer faster wins
  if (outcome === "draw") return 0;
  if (outcome !== 0) return -WIN_SCORE - depth;
  if (depth === 0) return evaluate(board, bot);

  const maximizing = current === bot;
  let best = maximizing ? -Infinity : Infinity;
  for (const col of CENTER_ORDER) {
    if (board[col] !== 0) continue;
    const next = drop(board, col, current);
    const value = minimax(
      next,
      depth - 1,
      alpha,
      beta,
      current === 1 ? 2 : 1,
      bot
    );
    if (maximizing) {
      best = Math.max(best, value);
      alpha = Math.max(alpha, value);
    } else {
      best = Math.min(best, value);
      beta = Math.min(beta, value);
    }
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * Minimax with alpha-beta at moderate depth, plus a little root noise so the
 * bot is beatable via double threats but still punishes blunders instantly.
 */
export function chooseMove(
  board: Board,
  bot: Player = 2,
  depth = 5,
  rng: () => number = Math.random
): number {
  let bestCol = legalCols(board)[0];
  let bestScore = -Infinity;
  for (const col of CENTER_ORDER) {
    if (board[col] !== 0) continue;
    const next = drop(board, col, bot);
    let score = minimax(
      next,
      depth - 1,
      -Infinity,
      Infinity,
      bot === 1 ? 2 : 1,
      bot
    );
    // Noise only where it can't flip a forced win/loss decision.
    if (Math.abs(score) < WIN_SCORE / 2) score += (rng() - 0.5) * 16;
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}
