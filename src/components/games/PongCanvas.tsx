"use client";

import { useEffect, useRef, useState } from "react";
import {
  BALL_R,
  FIELD_H,
  FIELD_W,
  PADDLE_H,
  PADDLE_MARGIN,
  PADDLE_W,
  WIN_SCORE,
  newGame,
  step,
  type PongState,
} from "@/games/pong/engine";
import { newBrain, updateBot, type BotBrain } from "@/games/pong/bot";
import { useGameStore } from "@/store/gameStore";
import styles from "./games.module.css";

const SIM_DT = 1 / 120;

export default function PongCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PongState>(newGame());
  const brainRef = useRef<BotBrain>(newBrain());
  const humanYRef = useRef(FIELD_H / 2);
  const elapsedRef = useRef(0);
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [result, setResult] = useState<{ won: boolean; awarded: number } | null>(
    null
  );
  const earn = useGameStore((s) => s.earn);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const accent =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#7aa2f7";

    // Track the pointer at window level so the paddle keeps following even
    // when the cursor leaves the canvas (or the whole board) mid-rally.
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      humanYRef.current = ((e.clientY - rect.top) / rect.height) * FIELD_H;
    };
    window.addEventListener("pointermove", onPointerMove);

    let raf = 0;
    let last = performance.now();
    let accumulator = 0;

    const draw = (state: PongState) => {
      ctx.clearRect(0, 0, FIELD_W, FIELD_H);
      ctx.fillStyle = "#141418";
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      // center line
      ctx.strokeStyle = "#2e2e32";
      ctx.setLineDash([10, 12]);
      ctx.beginPath();
      ctx.moveTo(FIELD_W / 2, 0);
      ctx.lineTo(FIELD_W / 2, FIELD_H);
      ctx.stroke();
      ctx.setLineDash([]);
      // score
      ctx.fillStyle = "#98989f";
      ctx.font = "32px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(state.score[0]), FIELD_W / 2 - 60, 48);
      ctx.fillText(String(state.score[1]), FIELD_W / 2 + 60, 48);
      // paddles
      ctx.fillStyle = accent;
      ctx.fillRect(
        PADDLE_MARGIN,
        state.paddles[0] - PADDLE_H / 2,
        PADDLE_W,
        PADDLE_H
      );
      ctx.fillStyle = "#f2f2f7";
      ctx.fillRect(
        FIELD_W - PADDLE_MARGIN - PADDLE_W,
        state.paddles[1] - PADDLE_H / 2,
        PADDLE_W,
        PADDLE_H
      );
      // ball
      if (state.status === "playing") {
        ctx.beginPath();
        ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fillStyle = "#f2f2f7";
        ctx.fill();
      }
    };

    const tick = (now: number) => {
      accumulator += Math.min((now - last) / 1000, 0.1);
      last = now;
      const state = stateRef.current;
      while (accumulator >= SIM_DT) {
        const botY = updateBot(state, brainRef.current, SIM_DT);
        step(state, { humanY: humanYRef.current, botY }, SIM_DT);
        elapsedRef.current += SIM_DT;
        accumulator -= SIM_DT;
      }
      draw(state);
      if (state.status === "gameover") {
        const won = state.winner === 0;
        const margin = Math.abs(state.score[0] - state.score[1]);
        const winSeconds = Math.round(elapsedRef.current * 10) / 10;
        setResult({
          won,
          awarded: won ? earn("pong", 50 + 2 * margin, winSeconds) : 0,
        });
        setPhase("over");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [phase, earn]);

  const start = () => {
    stateRef.current = newGame();
    brainRef.current = newBrain();
    elapsedRef.current = 0;
    setResult(null);
    setPhase("playing");
  };

  return (
    <div className={styles.gameWrap}>
      <div className={styles.pongWrap}>
        <canvas
          ref={canvasRef}
          width={FIELD_W}
          height={FIELD_H}
          className={styles.pongCanvas}
        />
        {phase !== "playing" && (
          <div className={styles.pongOverlay}>
            {phase === "over" && result && (
              <p className={styles.pongResult}>
                {result.won
                  ? `you win! +${result.awarded} ◆`
                  : "bot takes it. no points this time"}
              </p>
            )}
            <button className="btn btn-accent" onClick={start}>
              {phase === "idle" ? "start" : "rematch"}
            </button>
          </div>
        )}
      </div>
      <p className={`${styles.gameHint} text-dim`}>
        move your mouse to control the left paddle · first to {WIN_SCORE} ·
        win 50 ◆ +2 per point of margin
      </p>
    </div>
  );
}
