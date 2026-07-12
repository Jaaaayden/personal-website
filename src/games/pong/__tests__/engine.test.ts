import { describe, expect, it } from "vitest";
import { newGame, step, type PongState } from "../engine";

const DT = 1 / 120;
/** Flat serve: angle = (0.5 - 0.5) * π/3 = 0. */
const flatRng = () => 0.5;

function ballSpeed(state: PongState): number {
  return Math.hypot(state.ball.vx, state.ball.vy);
}

/** Step until the serve fires and the ball is in play. */
function serveBall(state: PongState): void {
  while (state.status === "serving") {
    step(state, { humanY: state.ball.y, botY: state.ball.y }, DT, flatRng);
  }
}

/**
 * Step with both paddles tracking the ball until its horizontal direction
 * flips (= a paddle hit), then return the post-hit speed.
 */
function playUntilHit(state: PongState): number {
  const dir = Math.sign(state.ball.vx);
  while (Math.sign(state.ball.vx) === dir) {
    step(state, { humanY: state.ball.y, botY: state.ball.y }, DT, flatRng);
  }
  return ballSpeed(state);
}

describe("pong engine", () => {
  it("starts a new game with an empty rally", () => {
    expect(newGame().rally).toBe(0);
  });

  it("speeds up 4% per hit for the first 3 hits, then 9% per hit", () => {
    const state = newGame();
    serveBall(state);
    let speed = ballSpeed(state);
    expect(speed).toBeCloseTo(360, 5);

    for (let hit = 1; hit <= 8; hit++) {
      const next = playUntilHit(state);
      const expectedMult = hit <= 3 ? 1.04 : 1.09;
      expect(next / speed).toBeCloseTo(expectedMult, 5);
      expect(state.rally).toBe(hit);
      speed = next;
    }
  });

  it("never exceeds the speed cap", () => {
    const state = newGame();
    serveBall(state);
    for (let hit = 0; hit < 40; hit++) {
      expect(playUntilHit(state)).toBeLessThanOrEqual(900);
    }
  });

  it("resets the rally count on the next serve after a point", () => {
    const state = newGame();
    serveBall(state);
    for (let hit = 0; hit < 5; hit++) playUntilHit(state);
    expect(state.rally).toBe(5);

    // Park both paddles away from the ball so the point ends.
    const missY = state.ball.y > 250 ? 45 : 455;
    while (state.status === "playing") {
      step(state, { humanY: missY, botY: missY }, DT, flatRng);
    }
    expect(state.status).toBe("serving");
    expect(state.score[0] + state.score[1]).toBe(1);

    serveBall(state);
    expect(state.rally).toBe(0);
    expect(ballSpeed(state)).toBeCloseTo(360, 5);
  });
});
