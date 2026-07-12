import { describe, expect, it } from "vitest";
import { chooseBotMove } from "../bot";
import { classifyCombo } from "../combos";
import { mulberry32 } from "../deck";
import { applyMove, newGame } from "../engine";
import { legalMoves } from "../legalMoves";
import { pointsForResult } from "../scoring";
import type { Move, TienLenState } from "../types";

describe("tienlen engine", () => {
  it("deals 13 cards to 4 seats and hands the lead to the 3♠ holder", () => {
    const state = newGame(mulberry32(1));
    expect(state.hands.every((h) => h.length === 13)).toBe(true);
    expect(
      state.hands[state.currentSeat].some((c) => c.id === 0)
    ).toBe(true);
    expect(state.firstMoveOfGame).toBe(true);
  });

  it("forces the opening play to include the 3♠", () => {
    const state = newGame(mulberry32(2));
    const moves = legalMoves(state, state.currentSeat);
    expect(moves.length).toBeGreaterThan(0);
    for (const move of moves) {
      expect(move.kind).toBe("play");
      if (move.kind === "play") {
        expect(move.combo.cards.some((c) => c.id === 0)).toBe(true);
      }
    }
    // Playing without the 3♠ throws.
    const hand = state.hands[state.currentSeat];
    const other = hand.find((c) => c.id !== 0)!;
    expect(() =>
      applyMove(state, { kind: "play", combo: classifyCombo([other])! })
    ).toThrow();
  });

  it("does not allow passing when leading", () => {
    const state = newGame(mulberry32(3));
    expect(() => applyMove(state, { kind: "pass" })).toThrow();
  });

  it("gives the trick to the last player standing and lets them lead", () => {
    let state = newGame(mulberry32(4));
    const leader = state.currentSeat;
    const [opening] = legalMoves(state, leader);
    state = applyMove(state, opening);
    // Everyone else passes.
    for (let i = 0; i < 3; i++) {
      state = applyMove(state, { kind: "pass" });
    }
    expect(state.currentSeat).toBe(leader);
    expect(state.topCombo).toBeNull();
    expect(state.passed).toEqual([false, false, false, false]);
  });

  it("rejects playing cards that are not in hand", () => {
    const state = newGame(mulberry32(5));
    const notMine = state.hands[(state.currentSeat + 1) % 4][0];
    expect(() =>
      applyMove(state, { kind: "play", combo: classifyCombo([notMine])! })
    ).toThrow();
  });
});

describe("tienlen scoring", () => {
  it("pays 60 + 3 per bot card for a first-place finish", () => {
    const state = {
      hands: [[], Array(5).fill(0), Array(3).fill(0), Array(2).fill(0)],
      finished: [0],
    } as unknown as TienLenState;
    expect(pointsForResult(state)).toBe(60 + 3 * 10);
  });

  it("pays 20 for second and nothing after that", () => {
    const base = { hands: [[], [], [], []] };
    expect(
      pointsForResult({ ...base, finished: [2, 0] } as unknown as TienLenState)
    ).toBe(20);
    expect(
      pointsForResult({ ...base, finished: [2, 1, 0] } as unknown as TienLenState)
    ).toBe(0);
    expect(
      pointsForResult({ ...base, finished: [2, 1, 3] } as unknown as TienLenState)
    ).toBe(0);
  });
});

describe("tienlen heads-up (2 players)", () => {
  it("deals 13 cards each from a 26-card pool and opener holds the lowest", () => {
    const state = newGame(mulberry32(7), 2);
    expect(state.hands).toHaveLength(2);
    expect(state.hands.every((h) => h.length === 13)).toBe(true);
    const lowest = Math.min(...state.hands.flat().map((c) => c.id));
    expect(state.mustIncludeCardId).toBe(lowest);
    expect(
      state.hands[state.currentSeat].some((c) => c.id === lowest)
    ).toBe(true);
  });

  it("forces the opening play to include the lowest card in play", () => {
    const state = newGame(mulberry32(8), 2);
    for (const move of legalMoves(state, state.currentSeat)) {
      if (move.kind === "play") {
        expect(
          move.combo.cards.some((c) => c.id === state.mustIncludeCardId)
        ).toBe(true);
      }
    }
  });

  it("ends the round as soon as one player finishes", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = mulberry32(seed + 9000);
      let state = newGame(rng, 2);
      while (state.phase === "playing") {
        state = applyMove(state, chooseBotMove(state, state.currentSeat, rng));
      }
      expect(state.finished).toHaveLength(1);
      const loser = state.finished[0] === 0 ? 1 : 0;
      expect(state.hands[state.finished[0]]).toHaveLength(0);
      expect(state.hands[loser].length).toBeGreaterThan(0);
    }
  });
});

describe("tienlen bot fuzz", () => {
  it("4-player bot-vs-bot rounds always terminate with legal moves only (500 seeds)", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = mulberry32(seed);
      let state = newGame(rng);
      let turns = 0;
      while (state.phase === "playing") {
        turns++;
        if (turns > 1000) {
          throw new Error(`seed ${seed}: round did not terminate`);
        }
        const move: Move = chooseBotMove(state, state.currentSeat, rng);
        // applyMove validates legality and throws on violations.
        state = applyMove(state, move);
      }
      expect(state.finished.length).toBe(3);
      const unfinished = [0, 1, 2, 3].filter(
        (s) => !state.finished.includes(s)
      );
      expect(unfinished).toHaveLength(1);
      // 52 cards dealt; the loser still holds at least one.
      expect(state.hands[unfinished[0]].length).toBeGreaterThan(0);
    }
  });

  it("heads-up bot-vs-bot rounds always terminate (300 seeds)", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = mulberry32(seed + 5000);
      let state = newGame(rng, 2);
      let turns = 0;
      while (state.phase === "playing") {
        turns++;
        if (turns > 1000) {
          throw new Error(`seed ${seed}: heads-up round did not terminate`);
        }
        state = applyMove(state, chooseBotMove(state, state.currentSeat, rng));
      }
      expect(state.finished).toHaveLength(1);
    }
  });
});
