export const ROWS = 6;
export const COLS = 7;

/** 0 = empty, 1 = human, 2 = bot. Index = row * COLS + col, row 0 = top. */
export type Board = Int8Array;
export type Player = 1 | 2;
export type Outcome = 0 | Player | "draw";

export function emptyBoard(): Board {
  return new Int8Array(ROWS * COLS);
}

/** Row the next piece in `col` lands in, or -1 if the column is full. */
export function landingRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row * COLS + col] === 0) return row;
  }
  return -1;
}

export function legalCols(board: Board): number[] {
  const cols: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (board[col] === 0) cols.push(col);
  }
  return cols;
}

/** Returns a new board with the piece dropped. Throws on a full column. */
export function drop(board: Board, col: number, player: Player): Board {
  const row = landingRow(board, col);
  if (row < 0) throw new Error(`column ${col} is full`);
  const next = new Int8Array(board);
  next[row * COLS + col] = player;
  return next;
}

/** All 69 four-in-a-row index windows, precomputed. */
export const WINDOWS: number[][] = (() => {
  const windows: number[][] = [];
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const [dr, dc] of dirs) {
        const endRow = row + dr * 3;
        const endCol = col + dc * 3;
        if (endRow < 0 || endRow >= ROWS || endCol < 0 || endCol >= COLS) {
          continue;
        }
        const window: number[] = [];
        for (let i = 0; i < 4; i++) {
          window.push((row + dr * i) * COLS + (col + dc * i));
        }
        windows.push(window);
      }
    }
  }
  return windows;
})();

/** The four cell indices of the winning line, or null if nobody has won. */
export function winningWindow(board: Board): number[] | null {
  for (const window of WINDOWS) {
    const first = board[window[0]];
    if (
      first !== 0 &&
      board[window[1]] === first &&
      board[window[2]] === first &&
      board[window[3]] === first
    ) {
      return window;
    }
  }
  return null;
}

export function checkWin(board: Board): Outcome {
  const win = winningWindow(board);
  if (win) return board[win[0]] as Player;
  for (let col = 0; col < COLS; col++) {
    if (board[col] === 0) return 0;
  }
  return "draw";
}
