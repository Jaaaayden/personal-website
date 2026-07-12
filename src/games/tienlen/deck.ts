import type { Card, Suit } from "./types";

export function cardFromId(id: number): Card {
  return { rank: Math.floor(id / 4), suit: (id % 4) as Suit, id };
}

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (let id = 0; id < 52; id++) deck.push(cardFromId(id));
  return deck;
}

/** Small deterministic PRNG for seeded tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deal 13 cards to each seat, hands sorted ascending by id. Heads-up (2
 * players) uses 26 of the 52 cards; 4 players uses the whole deck.
 */
export function deal(rng: () => number, numPlayers = 4): Card[][] {
  const deck = shuffle(makeDeck(), rng);
  const hands: Card[][] = [];
  for (let p = 0; p < numPlayers; p++) {
    hands.push(deck.slice(p * 13, p * 13 + 13).sort((a, b) => a.id - b.id));
  }
  return hands;
}
