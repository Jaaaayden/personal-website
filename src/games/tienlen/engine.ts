import { canBeat, classifyCombo } from "./combos";
import { deal } from "./deck";
import type { Move, TienLenState } from "./types";

export function newGame(rng: () => number, numPlayers = 4): TienLenState {
  const hands = deal(rng, numPlayers);
  const lowestId = Math.min(...hands.flat().map((c) => c.id));
  const opener = hands.findIndex((hand) =>
    hand.some((c) => c.id === lowestId)
  );
  return {
    hands,
    currentSeat: opener,
    topCombo: null,
    lastPlay: null,
    passed: new Array(numPlayers).fill(false),
    finished: [],
    firstMoveOfGame: true,
    mustIncludeCardId: lowestId,
    phase: "playing",
  };
}

function cloneState(state: TienLenState): TienLenState {
  return {
    ...state,
    hands: state.hands.map((hand) => [...hand]),
    passed: [...state.passed],
    finished: [...state.finished],
  };
}

/**
 * Next seat still contesting the current trick, or null if the trick is over
 * (play came back around to whoever owns the top combo).
 */
function nextContender(state: TienLenState, from: number): number | null {
  const n = state.hands.length;
  for (let i = 1; i < n; i++) {
    const seat = (from + i) % n;
    if (seat === state.lastPlay!.seat) return null;
    if (state.finished.includes(seat) || state.passed[seat]) continue;
    return seat;
  }
  return null;
}

function nextUnfinished(state: TienLenState, from: number): number {
  const n = state.hands.length;
  for (let i = 1; i < n; i++) {
    const seat = (from + i) % n;
    if (!state.finished.includes(seat)) return seat;
  }
  return from;
}

/** Trick is won by the owner of the top combo; they (or their successor) lead fresh. */
function resolveTrick(state: TienLenState): void {
  const winner = state.lastPlay!.seat;
  state.topCombo = null;
  state.passed = new Array(state.hands.length).fill(false);
  state.currentSeat = state.finished.includes(winner)
    ? nextUnfinished(state, winner)
    : winner;
}

/**
 * Apply a validated move, returning a new state. Throws on illegal moves —
 * callers (UI, bot, tests) are expected to pick from legalMoves().
 */
export function applyMove(state: TienLenState, move: Move): TienLenState {
  if (state.phase !== "playing") throw new Error("round is over");
  const seat = state.currentSeat;
  const next = cloneState(state);

  if (move.kind === "pass") {
    if (next.topCombo === null) throw new Error("cannot pass when leading");
    next.passed[seat] = true;
    const contender = nextContender(next, seat);
    if (contender === null) resolveTrick(next);
    else next.currentSeat = contender;
    return next;
  }

  // Validate the play.
  const combo = classifyCombo(move.combo.cards);
  if (!combo) throw new Error("selected cards are not a valid combo");
  const hand = next.hands[seat];
  for (const card of combo.cards) {
    if (!hand.some((c) => c.id === card.id)) {
      throw new Error("card not in hand");
    }
  }
  if (next.topCombo !== null && !canBeat(next.topCombo, combo)) {
    throw new Error("combo does not beat the table");
  }
  if (
    next.firstMoveOfGame &&
    !combo.cards.some((card) => card.id === next.mustIncludeCardId)
  ) {
    throw new Error("opening play must include the lowest card in play");
  }

  const playedIds = new Set(combo.cards.map((c) => c.id));
  next.hands[seat] = hand.filter((c) => !playedIds.has(c.id));
  next.topCombo = combo;
  next.lastPlay = { seat, combo };
  next.firstMoveOfGame = false;

  if (next.hands[seat].length === 0) {
    next.finished.push(seat);
    if (next.finished.length >= next.hands.length - 1) {
      next.phase = "roundOver";
      return next;
    }
  }

  const contender = nextContender(next, seat);
  if (contender === null) resolveTrick(next);
  else next.currentSeat = contender;
  return next;
}

export function isRoundOver(state: TienLenState): boolean {
  return state.phase === "roundOver";
}
