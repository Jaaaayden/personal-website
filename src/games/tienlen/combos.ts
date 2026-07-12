import { RANK_TWO, type Card, type Combo, type ComboType } from "./types";

function sorted(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.id - b.id);
}

function makeCombo(type: ComboType, cards: Card[], length: number): Combo {
  const cs = sorted(cards);
  return { type, cards: cs, top: cs[cs.length - 1], length };
}

/**
 * Classify an arbitrary selection of cards as a legal combo, or null.
 * Straights and double runs exclude 2s.
 */
export function classifyCombo(cards: Card[]): Combo | null {
  if (cards.length === 0) return null;
  const cs = sorted(cards);
  const n = cs.length;

  // Same-rank sets.
  if (cs.every((c) => c.rank === cs[0].rank)) {
    if (n === 1) return makeCombo("single", cs, 1);
    if (n === 2) return makeCombo("pair", cs, 2);
    if (n === 3) return makeCombo("triple", cs, 3);
    if (n === 4) return makeCombo("quad", cs, 4);
    return null;
  }

  // Straight: >=3 consecutive distinct ranks, one card each, no 2s.
  if (n >= 3) {
    let isStraight = true;
    for (let i = 0; i < n; i++) {
      if (cs[i].rank === RANK_TWO || (i > 0 && cs[i].rank !== cs[i - 1].rank + 1)) {
        isStraight = false;
        break;
      }
    }
    if (isStraight) return makeCombo("straight", cs, n);
  }

  // Double run: >=3 consecutive ranks with exactly two cards each, no 2s.
  if (n >= 6 && n % 2 === 0) {
    const ranks = n / 2;
    let isDoubleRun = true;
    for (let i = 0; i < ranks; i++) {
      const a = cs[i * 2];
      const b = cs[i * 2 + 1];
      if (
        a.rank !== b.rank ||
        a.rank === RANK_TWO ||
        (i > 0 && a.rank !== cs[(i - 1) * 2].rank + 1)
      ) {
        isDoubleRun = false;
        break;
      }
    }
    if (isDoubleRun) return makeCombo("doubleRun", cs, ranks);
  }

  return null;
}

/**
 * Bomb ("chop") strength: 3-pair run < quad < 4-pair-or-longer run.
 * 0 means not a bomb.
 */
export function bombLevel(combo: Combo): number {
  if (combo.type === "doubleRun" && combo.length === 3) return 1;
  if (combo.type === "quad") return 2;
  if (combo.type === "doubleRun" && combo.length >= 4) return 3;
  return 0;
}

/** Can `cand` be played on top of `top`? */
export function canBeat(top: Combo, cand: Combo): boolean {
  // Ordinary beat: same shape, higher top card.
  if (top.type === cand.type && top.length === cand.length) {
    return cand.top.id > top.top.id;
  }

  // Chops.
  const candBomb = bombLevel(cand);
  if (candBomb > 0) {
    if (top.type === "single" && top.top.rank === RANK_TWO && candBomb >= 1) {
      return true;
    }
    if (top.type === "pair" && top.top.rank === RANK_TWO && candBomb >= 2) {
      return true;
    }
    const topBomb = bombLevel(top);
    if (topBomb > 0 && candBomb > topBomb) return true;
  }

  return false;
}

function rankGroups(hand: Card[]): Map<number, Card[]> {
  const groups = new Map<number, Card[]>();
  for (const card of sorted(hand)) {
    const group = groups.get(card.rank) ?? [];
    group.push(card);
    groups.set(card.rank, group);
  }
  return groups;
}

function* subsetsOfSize<T>(items: T[], size: number): Generator<T[]> {
  if (size === 0) {
    yield [];
    return;
  }
  for (let i = 0; i <= items.length - size; i++) {
    for (const rest of subsetsOfSize(items.slice(i + 1), size - 1)) {
      yield [items[i], ...rest];
    }
  }
}

/**
 * Enumerate playable combos from a hand. Same-rank sets are exhaustive; runs
 * generate a "cheap" variant (lowest card per rank) plus a "strong" variant
 * (highest card on the top rank) rather than the full cartesian product —
 * plenty for bot play and legality probing.
 */
export function enumerateCombos(hand: Card[]): Combo[] {
  const combos: Combo[] = [];
  const groups = rankGroups(hand);

  for (const card of hand) combos.push(makeCombo("single", [card], 1));

  for (const group of groups.values()) {
    if (group.length >= 2) {
      for (const pair of subsetsOfSize(group, 2)) {
        combos.push(makeCombo("pair", pair, 2));
      }
    }
    if (group.length >= 3) {
      for (const triple of subsetsOfSize(group, 3)) {
        combos.push(makeCombo("triple", triple, 3));
      }
    }
    if (group.length === 4) combos.push(makeCombo("quad", group, 4));
  }

  const seen = new Set<string>();
  const pushRun = (cards: Card[], type: ComboType, length: number) => {
    const key = cards.map((c) => c.id).join(",");
    if (seen.has(key)) return;
    seen.add(key);
    combos.push(makeCombo(type, cards, length));
  };

  // Straights (no 2s).
  for (let start = 0; start < RANK_TWO; start++) {
    if (!groups.has(start)) continue;
    for (let end = start + 1; end < RANK_TWO && groups.has(end); end++) {
      const length = end - start + 1;
      if (length < 3) continue;
      const cheap: Card[] = [];
      for (let r = start; r <= end; r++) cheap.push(groups.get(r)![0]);
      pushRun(cheap, "straight", length);

      const endGroup = groups.get(end)!;
      if (endGroup.length > 1) {
        const strong = [...cheap];
        strong[strong.length - 1] = endGroup[endGroup.length - 1];
        pushRun(strong, "straight", length);
      }
    }
  }

  // Double runs (no 2s).
  const hasPairAt = (r: number) => (groups.get(r)?.length ?? 0) >= 2;
  for (let start = 0; start < RANK_TWO; start++) {
    if (!hasPairAt(start)) continue;
    for (let end = start + 1; end < RANK_TWO && hasPairAt(end); end++) {
      const length = end - start + 1;
      if (length < 3) continue;
      const cheap: Card[] = [];
      for (let r = start; r <= end; r++) cheap.push(...groups.get(r)!.slice(0, 2));
      pushRun(cheap, "doubleRun", length);

      const endGroup = groups.get(end)!;
      if (endGroup.length > 2) {
        const strong = [...cheap];
        strong.splice(strong.length - 2, 2, ...endGroup.slice(-2));
        pushRun(strong, "doubleRun", length);
      }
    }
  }

  return combos;
}
