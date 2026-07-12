import { bombLevel, enumerateCombos } from "./combos";
import { legalMoves } from "./legalMoves";
import { RANK_TWO, type Card, type Combo, type Move, type TienLenState } from "./types";

type PlayMove = Extract<Move, { kind: "play" }>;

function comboKey(cards: Card[]): string {
  return cards
    .map((c) => c.id)
    .sort((a, b) => a - b)
    .join(",");
}

/**
 * Greedy partition of a hand into few strong units: double runs, then
 * straights, then quads/triples/pairs, singles last. This is the bot's plan
 * for the round; it avoids breaking these units when following.
 */
export function partitionHand(hand: Card[]): Card[][] {
  let remaining = [...hand].sort((a, b) => a.id - b.id);
  const units: Card[][] = [];

  const extract = (pick: (combos: Combo[]) => Combo | undefined) => {
    for (;;) {
      const combo = pick(enumerateCombos(remaining));
      if (!combo) break;
      units.push(combo.cards);
      const used = new Set(combo.cards.map((c) => c.id));
      remaining = remaining.filter((c) => !used.has(c.id));
    }
  };

  const longestOf = (type: Combo["type"]) => (combos: Combo[]) => {
    const ofType = combos.filter((c) => c.type === type);
    if (ofType.length === 0) return undefined;
    return ofType.reduce((a, b) => (b.length > a.length ? b : a));
  };

  extract(longestOf("doubleRun"));
  extract(longestOf("straight"));
  for (const type of ["quad", "triple", "pair"] as const) {
    extract((combos) => combos.find((c) => c.type === type));
  }
  for (const card of remaining) units.push([card]);
  return units;
}

function isClean(play: PlayMove, unitKeys: Set<string>, singleIds: Set<number>): boolean {
  if (unitKeys.has(comboKey(play.combo.cards))) return true;
  return play.combo.cards.every((c) => singleIds.has(c.id));
}

function containsTwo(combo: Combo): boolean {
  return combo.cards.some((c) => c.rank === RANK_TWO);
}

/** 2s and bombs are reserve material — spent only when it matters. */
function isReserve(combo: Combo): boolean {
  return containsTwo(combo) || bombLevel(combo) > 0;
}

export function chooseBotMove(
  state: TienLenState,
  seat: number,
  rng: () => number = Math.random
): Move {
  const moves = legalMoves(state, seat);
  const plays = moves.filter((m): m is PlayMove => m.kind === "play");
  const pass: Move = { kind: "pass" };
  if (plays.length === 0) return pass;

  const hand = state.hands[seat];
  const units = partitionHand(hand);
  const unitKeys = new Set(units.map(comboKey));
  const singleIds = new Set(
    units.filter((u) => u.length === 1).map((u) => u[0].id)
  );

  // Cheapest first.
  plays.sort((a, b) => a.combo.top.id - b.combo.top.id);

  const opponents = state.hands
    .map((_, s) => s)
    .filter((s) => s !== seat && !state.finished.includes(s));
  const minOppCards = Math.min(...opponents.map((s) => state.hands[s].length));
  const endgame = hand.length <= 5;

  const pickWithFuzz = (candidates: PlayMove[]): Move => {
    if (candidates.length === 0) return pass;
    if (candidates.length > 1 && rng() < 0.12) return candidates[1];
    return candidates[0];
  };

  // ---- Following ----
  if (state.topCombo !== null) {
    const top = state.topCombo;
    const trickHasTwo = containsTwo(top);
    const takerCards = state.finished.includes(state.lastPlay!.seat)
      ? 0
      : state.hands[state.lastPlay!.seat].length;
    const trickValuable =
      trickHasTwo || top.cards.length >= 4 || takerCards <= 4;

    // Bombs stay pocketed unless the trick is worth chopping.
    const chopOk = trickHasTwo || takerCards <= 4 || bombLevel(top) > 0;
    let candidates = plays.filter(
      (p) => bombLevel(p.combo) === 0 || chopOk
    );
    // 2s stay pocketed until the endgame or a big trick.
    const spendTwosOk = endgame || top.top.rank >= 10 || trickValuable;
    candidates = candidates.filter(
      (p) => !containsTwo(p.combo) || spendTwosOk || bombLevel(top) > 0
    );

    const clean = candidates.filter((p) => isClean(p, unitKeys, singleIds));
    if (clean.length > 0) {
      const nonReserve = clean.filter((p) => !isReserve(p.combo));
      return pickWithFuzz(nonReserve.length > 0 ? nonReserve : clean);
    }
    // Breaking a planned unit is only worth it for a valuable trick.
    if (trickValuable && candidates.length > 0) return pickWithFuzz(candidates);
    return pass;
  }

  // ---- Leading ----
  let candidates = plays.filter((p) => isClean(p, unitKeys, singleIds));
  if (candidates.length === 0) candidates = plays;

  const nonReserve = candidates.filter((p) => !isReserve(p.combo));
  if (nonReserve.length > 0 && !endgame) candidates = nonReserve;

  if (minOppCards === 1) {
    // Someone is one card from winning: never feed them a low single.
    const nonSingles = candidates.filter((p) => p.combo.type !== "single");
    if (nonSingles.length > 0) {
      candidates = nonSingles;
    } else {
      const highestSingle = plays
        .filter((p) => p.combo.type === "single")
        .reduce((a, b) => (b.combo.top.id > a.combo.top.id ? b : a));
      return highestSingle;
    }
  } else if (minOppCards === 2) {
    const nonSingles = candidates.filter((p) => p.combo.type !== "single");
    if (nonSingles.length > 0) candidates = nonSingles;
  }

  return pickWithFuzz(candidates);
}
