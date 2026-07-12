/** Logical field size; the canvas scales this to fit. */
export const FIELD_W = 800;
export const FIELD_H = 500;
export const PADDLE_W = 12;
export const PADDLE_H = 90;
export const PADDLE_MARGIN = 24;
export const BALL_R = 8;
export const WIN_SCORE = 3;

const SERVE_SPEED = 360;
const MAX_SPEED = 900;
const SPEEDUP = 1.04;
/** Steeper per-hit multiplier once a rally passes RALLY_HOT_AFTER hits. */
const SPEEDUP_HOT = 1.09;
const RALLY_HOT_AFTER = 3;

export interface PongState {
  ball: { x: number; y: number; vx: number; vy: number };
  /** paddles[0] = human (left), paddles[1] = bot (right); values are center y. */
  paddles: [number, number];
  score: [number, number];
  status: "serving" | "playing" | "gameover";
  /** Seconds until serve while status === 'serving'. */
  serveTimer: number;
  /** Who the next serve goes toward (last scorer's opponent gets the ball). */
  serveDir: 1 | -1;
  winner: 0 | 1 | null;
  /** Successful paddle hits since the last serve. */
  rally: number;
}

export function newGame(): PongState {
  return {
    ball: { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0 },
    paddles: [FIELD_H / 2, FIELD_H / 2],
    score: [0, 0],
    status: "serving",
    serveTimer: 0.9,
    serveDir: Math.random() < 0.5 ? 1 : -1,
    winner: null,
    rally: 0,
  };
}

function serve(state: PongState, rng: () => number): void {
  const angle = (rng() - 0.5) * (Math.PI / 3); // within ±30°
  state.ball = {
    x: FIELD_W / 2,
    y: FIELD_H / 2,
    vx: Math.cos(angle) * SERVE_SPEED * state.serveDir,
    vy: Math.sin(angle) * SERVE_SPEED,
  };
  state.rally = 0;
  state.status = "playing";
}

function clampPaddle(y: number): number {
  return Math.min(Math.max(y, PADDLE_H / 2), FIELD_H - PADDLE_H / 2);
}

/**
 * Advance the simulation by dt seconds. Mutates and returns `state`
 * (the caller owns the state object; React never renders it directly).
 */
export function step(
  state: PongState,
  input: { humanY: number; botY: number },
  dt: number,
  rng: () => number = Math.random
): PongState {
  if (state.status === "gameover") return state;

  state.paddles[0] = clampPaddle(input.humanY);
  state.paddles[1] = clampPaddle(input.botY);

  if (state.status === "serving") {
    state.serveTimer -= dt;
    if (state.serveTimer <= 0) serve(state, rng);
    return state;
  }

  const ball = state.ball;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Walls.
  if (ball.y < BALL_R) {
    ball.y = BALL_R;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y > FIELD_H - BALL_R) {
    ball.y = FIELD_H - BALL_R;
    ball.vy = -Math.abs(ball.vy);
  }

  // Paddles: reflect angle by hit offset, speed up a notch per hit.
  const paddleHit = (paddleX: number, paddleY: number, dir: 1 | -1) => {
    const withinX =
      dir === 1
        ? ball.x - BALL_R < paddleX + PADDLE_W && ball.x > paddleX
        : ball.x + BALL_R > paddleX && ball.x < paddleX + PADDLE_W;
    if (!withinX) return false;
    const offset = (ball.y - paddleY) / (PADDLE_H / 2);
    if (Math.abs(offset) > 1.15) return false;
    state.rally += 1;
    const mult = state.rally <= RALLY_HOT_AFTER ? SPEEDUP : SPEEDUP_HOT;
    const speed = Math.min(Math.hypot(ball.vx, ball.vy) * mult, MAX_SPEED);
    const bounce = (offset * Math.PI) / 4; // up to 45°
    ball.vx = Math.cos(bounce) * speed * dir;
    ball.vy = Math.sin(bounce) * speed;
    ball.x = dir === 1 ? paddleX + PADDLE_W + BALL_R : paddleX - BALL_R;
    return true;
  };

  if (ball.vx < 0) {
    paddleHit(PADDLE_MARGIN, state.paddles[0], 1);
  } else {
    paddleHit(FIELD_W - PADDLE_MARGIN - PADDLE_W, state.paddles[1], -1);
  }

  // Scoring.
  if (ball.x < -BALL_R * 2 || ball.x > FIELD_W + BALL_R * 2) {
    const scorer = ball.x < 0 ? 1 : 0;
    state.score[scorer]++;
    if (state.score[scorer] >= WIN_SCORE) {
      state.status = "gameover";
      state.winner = scorer;
    } else {
      state.status = "serving";
      state.serveTimer = 0.9;
      state.serveDir = scorer === 0 ? 1 : -1; // loser receives
    }
  }

  return state;
}
