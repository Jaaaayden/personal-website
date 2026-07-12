/**
 * Tiến lên (Thirteen) — card model.
 * Ranks: 3=0, 4=1, ... 10=7, J=8, Q=9, K=10, A=11, 2=12.
 * Suits (Tiến lên order, low to high): ♠=0, ♣=1, ♦=2, ♥=3.
 * id = rank * 4 + suit gives a total order over all 52 cards; 3♠ is id 0.
 */
export type Suit = 0 | 1 | 2 | 3;

export interface Card {
  rank: number;
  suit: Suit;
  id: number;
}

export const RANK_LABELS = [
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
  "2",
] as const;

export const SUIT_SYMBOLS = ["♠", "♣", "♦", "♥"] as const;

export const RANK_TWO = 12;

export type ComboType =
  | "single"
  | "pair"
  | "triple"
  | "quad"
  | "straight"
  | "doubleRun";

export interface Combo {
  type: ComboType;
  /** Sorted ascending by id. */
  cards: Card[];
  /** Highest card; breaks ties between same-shape combos. */
  top: Card;
  /** Number of distinct ranks (equals cards.length except for doubleRun). */
  length: number;
}

export type Move = { kind: "play"; combo: Combo } | { kind: "pass" };

export interface TienLenState {
  /** One hand per seat, sorted ascending by id. Seat 0 is the human. */
  hands: Card[][];
  currentSeat: number;
  /** Combo to beat; null when the current seat is leading a fresh trick. */
  topCombo: Combo | null;
  /** Who played topCombo (owns the trick if everyone passes). */
  lastPlay: { seat: number; combo: Combo } | null;
  /** Seats that have passed on the current trick. */
  passed: boolean[];
  /** Seats that have emptied their hands, in finish order. */
  finished: number[];
  /** True until the opening play of the game has been made. */
  firstMoveOfGame: boolean;
  /**
   * The lowest card dealt; the opening play must include it. With 4 players
   * this is always the 3♠ — heads-up only 26 cards are dealt, so it's
   * whatever the lowest card in play is.
   */
  mustIncludeCardId: number;
  phase: "playing" | "roundOver";
}
