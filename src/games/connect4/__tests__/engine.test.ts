import { describe, expect, it } from "vitest";
import {
  checkWin,
  drop,
  emptyBoard,
  landingRow,
  legalCols,
  COLS,
  WINDOWS,
  type Board,
  type Player,
} from "../engine";
import { chooseMove } from "../bot";

function play(moves: Array<[number, Player]>): Board {
  let board = emptyBoard();
  for (const [col, player] of moves) board = drop(board, col, player);
  return board;
}

describe("connect4 engine", () => {
  it("precomputes exactly 69 windows", () => {
    expect(WINDOWS).toHaveLength(69);
  });

  it("stacks pieces from the bottom", () => {
    let board = emptyBoard();
    expect(landingRow(board, 3)).toBe(5);
    board = drop(board, 3, 1);
    expect(landingRow(board, 3)).toBe(4);
  });

  it("rejects a full column", () => {
    let board = emptyBoard();
    for (let i = 0; i < 6; i++) board = drop(board, 0, ((i % 2) + 1) as Player);
    expect(landingRow(board, 0)).toBe(-1);
    expect(legalCols(board)).not.toContain(0);
    expect(() => drop(board, 0, 1)).toThrow();
  });

  it("detects horizontal, vertical, and both diagonal wins", () => {
    expect(
      checkWin(play([[0, 1], [0, 2], [1, 1], [1, 2], [2, 1], [2, 2], [3, 1]]))
    ).toBe(1);
    expect(
      checkWin(play([[0, 2], [1, 1], [0, 2], [1, 1], [0, 2], [1, 1], [0, 2]]))
    ).toBe(2);
    // Rising diagonal for player 1.
    expect(
      checkWin(
        play([
          [0, 1],
          [1, 2], [1, 1],
          [2, 2], [2, 2], [2, 1],
          [3, 2], [3, 2], [3, 2], [3, 1],
        ])
      )
    ).toBe(1);
    // Falling diagonal for player 1.
    expect(
      checkWin(
        play([
          [6, 1],
          [5, 2], [5, 1],
          [4, 2], [4, 2], [4, 1],
          [3, 2], [3, 2], [3, 2], [3, 1],
        ])
      )
    ).toBe(1);
  });

  it("declares a draw on a full board with no winner", () => {
    // Even columns 112211 bottom-up, odd columns complemented — no line of 4.
    let board = emptyBoard();
    for (let col = 0; col < COLS; col++) {
      const base = col % 2 === 1 ? [2, 2, 1, 1, 2, 2] : [1, 1, 2, 2, 1, 1];
      for (const p of base) board = drop(board, col, p as Player);
    }
    expect(checkWin(board)).toBe("draw");
  });
});

describe("connect4 bot", () => {
  it("takes an immediate win", () => {
    const board = play([
      [0, 2], [0, 1],
      [1, 2], [1, 1],
      [2, 2], [2, 1],
    ]);
    expect(chooseMove(board, 2, 5, () => 0.5)).toBe(3);
  });

  it("blocks the opponent's open three", () => {
    const board = play([
      [1, 1], [0, 2],
      [2, 1], [0, 2],
      [3, 1],
    ]);
    // Human threatens 1-2-3-4 (and 0 is occupied); bot must play col 4.
    expect(chooseMove(board, 2, 5, () => 0.5)).toBe(4);
  });
});
