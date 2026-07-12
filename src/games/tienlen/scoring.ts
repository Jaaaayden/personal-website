import type { TienLenState } from "./types";

/**
 * Points for the human (seat 0), computed the moment they finish (or the
 * round ends without them finishing).
 * 1st: 60 + 3 per card still held by opponents — a dominant win pays more.
 * 2nd at a 4-player table: 20. Otherwise (including a heads-up loss): 0.
 */
export function pointsForResult(state: TienLenState): number {
  const place = state.finished.indexOf(0);
  if (place === 0) {
    let cardsLeft = 0;
    for (let seat = 1; seat < state.hands.length; seat++) {
      cardsLeft += state.hands[seat].length;
    }
    return 60 + 3 * cardsLeft;
  }
  if (place === 1 && state.hands.length > 2) return 20;
  return 0;
}

/** 0-based finishing place for a seat (last place if they never finished). */
export function placementOf(state: TienLenState, seat: number): number {
  const place = state.finished.indexOf(seat);
  return place === -1 ? state.hands.length - 1 : place;
}
