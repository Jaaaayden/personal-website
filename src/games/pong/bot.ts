import { FIELD_H, FIELD_W, type PongState } from "./engine";

export interface BotBrain {
  aimError: number;
  /** Ball x last frame, to detect center crossings. */
  lastBallX: number;
}

export function newBrain(): BotBrain {
  return { aimError: 0, lastBallX: FIELD_W / 2 };
}

const MAX_PADDLE_SPEED = 420; // slower than a fast ball's vertical speed

/**
 * Tracks the ball with a capped speed and an aim error resampled whenever the
 * ball crosses the center line heading toward the bot — beatable with
 * well-angled shots, unforgiving of lazy ones.
 */
export function updateBot(
  state: PongState,
  brain: BotBrain,
  dt: number,
  rng: () => number = Math.random
): number {
  const ball = state.ball;
  const crossedTowardBot =
    brain.lastBallX <= FIELD_W / 2 && ball.x > FIELD_W / 2 && ball.vx > 0;
  if (crossedTowardBot) {
    const speedFactor = Math.min(Math.abs(ball.vx) / 600, 1.5);
    const magnitude = 10 + rng() * 35 * (0.6 + speedFactor);
    brain.aimError = (rng() < 0.5 ? -1 : 1) * magnitude;
  }
  brain.lastBallX = ball.x;

  // Drift back to center while the ball is heading away.
  const target =
    ball.vx > 0 ? ball.y + brain.aimError : FIELD_H / 2;

  const current = state.paddles[1];
  const maxStep = MAX_PADDLE_SPEED * dt;
  const delta = Math.min(Math.max(target - current, -maxStep), maxStep);
  return current + delta;
}
