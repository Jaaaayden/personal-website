import { describe, expect, it } from "vitest";
import { canBeat, classifyCombo, enumerateCombos, bombLevel } from "../combos";
import { cardFromId } from "../deck";
import type { Card, Combo } from "../types";

/** Build cards from "rank:suit" ids, e.g. c(0,0) = 3♠. Rank 12 = 2. */
function c(rank: number, suit: number): Card {
  return cardFromId(rank * 4 + suit);
}

function combo(...cards: Card[]): Combo {
  const result = classifyCombo(cards);
  if (!result) throw new Error("test combo is invalid");
  return result;
}

describe("classifyCombo", () => {
  it("classifies singles, pairs, triples, quads", () => {
    expect(classifyCombo([c(0, 0)])?.type).toBe("single");
    expect(classifyCombo([c(5, 0), c(5, 3)])?.type).toBe("pair");
    expect(classifyCombo([c(5, 0), c(5, 1), c(5, 2)])?.type).toBe("triple");
    expect(
      classifyCombo([c(5, 0), c(5, 1), c(5, 2), c(5, 3)])?.type
    ).toBe("quad");
  });

  it("rejects mismatched pairs and gap straights", () => {
    expect(classifyCombo([c(5, 0), c(6, 0)])).toBeNull();
    expect(classifyCombo([c(3, 0), c(4, 0), c(6, 0)])).toBeNull();
  });

  it("classifies straights and rejects straights containing 2s", () => {
    const straight = classifyCombo([c(3, 0), c(4, 1), c(5, 2)]);
    expect(straight?.type).toBe("straight");
    expect(straight?.length).toBe(3);
    // Q-K-A ok, K-A-2 not.
    expect(classifyCombo([c(9, 0), c(10, 0), c(11, 0)])?.type).toBe("straight");
    expect(classifyCombo([c(10, 0), c(11, 0), c(12, 0)])).toBeNull();
  });

  it("classifies double runs and rejects ones with 2s", () => {
    const run = classifyCombo([
      c(3, 0), c(3, 1),
      c(4, 0), c(4, 1),
      c(5, 0), c(5, 1),
    ]);
    expect(run?.type).toBe("doubleRun");
    expect(run?.length).toBe(3);
    expect(
      classifyCombo([
        c(10, 0), c(10, 1),
        c(11, 0), c(11, 1),
        c(12, 0), c(12, 1),
      ])
    ).toBeNull();
  });

  it("uses the highest card as top", () => {
    expect(combo(c(4, 0), c(4, 3)).top.suit).toBe(3);
  });
});

describe("canBeat", () => {
  it("compares same-shape combos by top card (suit breaks rank ties)", () => {
    expect(canBeat(combo(c(5, 0)), combo(c(5, 3)))).toBe(true);
    expect(canBeat(combo(c(5, 3)), combo(c(5, 0)))).toBe(false);
    expect(canBeat(combo(c(5, 0), c(5, 1)), combo(c(6, 0), c(6, 1)))).toBe(true);
  });

  it("rejects cross-shape follows", () => {
    expect(canBeat(combo(c(5, 0)), combo(c(6, 0), c(6, 1)))).toBe(false);
    expect(
      canBeat(combo(c(3, 0), c(4, 0), c(5, 0)), combo(c(6, 0), c(6, 1)))
    ).toBe(false);
  });

  it("requires equal length for straights", () => {
    const three = combo(c(3, 0), c(4, 0), c(5, 0));
    const four = combo(c(3, 1), c(4, 1), c(5, 1), c(6, 1));
    expect(canBeat(three, four)).toBe(false);
  });

  const single2 = combo(c(12, 2));
  const pair2s = combo(c(12, 0), c(12, 1));
  const quad = combo(c(5, 0), c(5, 1), c(5, 2), c(5, 3));
  const run3 = combo(c(3, 0), c(3, 1), c(4, 0), c(4, 1), c(5, 0), c(5, 1));
  const run4 = combo(
    c(3, 2), c(3, 3),
    c(4, 2), c(4, 3),
    c(5, 2), c(5, 3),
    c(6, 0), c(6, 1)
  );

  it("grades bombs: 3-pair run < quad < 4-pair run", () => {
    expect(bombLevel(run3)).toBe(1);
    expect(bombLevel(quad)).toBe(2);
    expect(bombLevel(run4)).toBe(3);
  });

  it("chops a single 2 with any bomb", () => {
    expect(canBeat(single2, run3)).toBe(true);
    expect(canBeat(single2, quad)).toBe(true);
    expect(canBeat(single2, run4)).toBe(true);
  });

  it("chops a pair of 2s only with a quad or 4-pair run", () => {
    expect(canBeat(pair2s, run3)).toBe(false);
    expect(canBeat(pair2s, quad)).toBe(true);
    expect(canBeat(pair2s, run4)).toBe(true);
  });

  it("lets stronger bombs beat weaker bombs", () => {
    expect(canBeat(run3, quad)).toBe(true);
    expect(canBeat(quad, run4)).toBe(true);
    expect(canBeat(run4, quad)).toBe(false);
    expect(canBeat(quad, run3)).toBe(false);
  });

  it("does not let bombs beat ordinary non-2 combos", () => {
    expect(canBeat(combo(c(11, 3)), quad)).toBe(false); // A♥ is not a 2
    expect(canBeat(combo(c(5, 0), c(5, 1)), run3)).toBe(false);
  });
});

describe("enumerateCombos", () => {
  it("finds runs, sets, and singles in a mixed hand", () => {
    const hand = [
      c(3, 0), c(4, 0), c(5, 0),
      c(7, 0), c(7, 1),
      c(12, 3),
    ];
    const combos = enumerateCombos(hand);
    const types = new Set(combos.map((x) => x.type));
    expect(types.has("straight")).toBe(true);
    expect(types.has("pair")).toBe(true);
    expect(combos.filter((x) => x.type === "single")).toHaveLength(6);
  });

  it("never emits combos with cards outside the hand", () => {
    const hand = [c(3, 0), c(3, 1), c(4, 0), c(4, 1), c(5, 0), c(5, 1)];
    const ids = new Set(hand.map((x) => x.id));
    for (const cb of enumerateCombos(hand)) {
      for (const card of cb.cards) expect(ids.has(card.id)).toBe(true);
    }
  });
});
