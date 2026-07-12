"use client";

import { useEffect, useRef, useState } from "react";
import {
  COLS,
  ROWS,
  checkWin,
  drop,
  emptyBoard,
  landingRow,
  winningWindow,
  type Board,
  type Outcome,
} from "@/games/connect4/engine";
import { chooseMove } from "@/games/connect4/bot";
import { useGameStore } from "@/store/gameStore";
import styles from "./games.module.css";

/** Fall time scales with distance, roughly like gravity (t ∝ √h). */
const dropMs = (row: number) => Math.round(120 + 140 * Math.sqrt(row + 1));

export default function ConnectFourBoard() {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [turn, setTurn] = useState<"human" | "bot" | "over">("human");
  const [outcome, setOutcome] = useState<Outcome>(0);
  const [awarded, setAwarded] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [lastDrop, setLastDrop] = useState<{ row: number; col: number } | null>(
    null
  );
  const [winLine, setWinLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const earn = useGameStore((s) => s.earn);
  const awardedRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Strike a line through the winning four, once the last piece has landed.
  // (winLine is cleared in reset(), so the effect only ever draws it.)
  useEffect(() => {
    if (turn !== "over" || (outcome !== 1 && outcome !== 2)) return;
    const compute = () => {
      const el = boardRef.current;
      const win = winningWindow(board);
      if (!el || !win) return;
      const rect = el.getBoundingClientRect();
      const a = el
        .querySelector(`[data-idx="${win[0]}"]`)
        ?.getBoundingClientRect();
      const b = el
        .querySelector(`[data-idx="${win[3]}"]`)
        ?.getBoundingClientRect();
      if (!a || !b) return;
      setWinLine({
        x1: a.left + a.width / 2 - rect.left,
        y1: a.top + a.height / 2 - rect.top,
        x2: b.left + b.width / 2 - rect.left,
        y2: b.top + b.height / 2 - rect.top,
      });
    };
    const timer = setTimeout(compute, 540); // let the winning drop settle
    window.addEventListener("resize", compute);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", compute);
    };
  }, [turn, outcome, board]);

  const finish = (result: Outcome, finalBoard: Board) => {
    setOutcome(result);
    setTurn("over");
    if (!awardedRef.current) {
      awardedRef.current = true;
      const raw = result === 1 ? 90 : result === "draw" ? 10 : 0;
      const turnsToWin =
        result === 1
          ? finalBoard.filter((cell) => cell === 1).length
          : undefined;
      setAwarded(raw > 0 ? earn("connect4", raw, turnsToWin) : 0);
    }
  };

  const humanMove = (col: number) => {
    const row = landingRow(board, col);
    if (turn !== "human" || row < 0) return;
    const next = drop(board, col, 1);
    setBoard(next);
    setLastDrop({ row, col });
    const result = checkWin(next);
    if (result !== 0) finish(result, next);
    else setTurn("bot");
  };

  useEffect(() => {
    if (turn !== "bot") return;
    const timer = setTimeout(() => {
      const col = chooseMove(board);
      const row = landingRow(board, col);
      const next = drop(board, col, 2);
      setBoard(next);
      setLastDrop({ row, col });
      const result = checkWin(next);
      if (result !== 0) finish(result, next);
      else setTurn("human");
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn]);

  const reset = () => {
    setBoard(emptyBoard());
    setTurn("human");
    setOutcome(0);
    setAwarded(null);
    setHoverCol(null);
    setLastDrop(null);
    setWinLine(null);
    awardedRef.current = false;
  };

  return (
    <div className={styles.gameWrap}>
      <div className={styles.statusRow}>
        <span className="text-dim">
          {turn === "human" && "your move — drop a piece"}
          {turn === "bot" && "bot is thinking…"}
          {turn === "over" &&
            (outcome === 1
              ? `you win! +${awarded} ◆`
              : outcome === "draw"
                ? `draw. +${awarded} ◆`
                : "bot wins. no points this time")}
        </span>
        {turn === "over" && (
          <button className="btn btn-accent" onClick={reset}>
            play again
          </button>
        )}
      </div>
      <div
        ref={boardRef}
        className={styles.c4board}
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {Array.from({ length: COLS }, (_, col) => (
          <button
            key={col}
            className={styles.c4col}
            onClick={() => humanMove(col)}
            onMouseEnter={() => setHoverCol(col)}
            onMouseLeave={() => setHoverCol(null)}
            onFocus={() => setHoverCol(col)}
            onBlur={() => setHoverCol(null)}
            disabled={turn !== "human" || landingRow(board, col) < 0}
            aria-label={`Drop in column ${col + 1}`}
          >
            {Array.from({ length: ROWS }, (_, row) => {
              const cell = board[row * COLS + col];
              const dropped =
                lastDrop !== null &&
                lastDrop.row === row &&
                lastDrop.col === col;
              const ghost =
                turn === "human" &&
                hoverCol === col &&
                cell === 0 &&
                row === landingRow(board, col);
              return (
                <span
                  key={row}
                  className={styles.c4cell}
                  data-idx={row * COLS + col}
                >
                  {cell !== 0 && (
                    <span
                      className={`${styles.c4piece} ${
                        cell === 1 ? styles.c4human : styles.c4bot
                      } ${dropped ? styles.c4drop : ""}`}
                      style={
                        dropped
                          ? ({
                              "--c4-rows": row + 1,
                              "--c4-drop-ms": `${dropMs(row)}ms`,
                            } as React.CSSProperties)
                          : undefined
                      }
                    />
                  )}
                  {ghost && (
                    <span className={`${styles.c4piece} ${styles.c4ghost}`} />
                  )}
                </span>
              );
            })}
          </button>
        ))}
        {winLine && (
          <svg className={styles.c4winLine} aria-hidden>
            <line
              className={outcome === 1 ? styles.c4lineWin : styles.c4lineLose}
              x1={winLine.x1}
              y1={winLine.y1}
              x2={winLine.x2}
              y2={winLine.y2}
              pathLength={1}
            />
          </svg>
        )}
      </div>
      <p className={`${styles.gameHint} text-dim`}>
        you are the <span className={styles.accentText}>accent</span> pieces ·
        win 90 ◆ · draw 10 ◆
      </p>
    </div>
  );
}
