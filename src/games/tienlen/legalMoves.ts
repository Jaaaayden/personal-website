import { canBeat, enumerateCombos } from "./combos";
import type { Move, TienLenState } from "./types";

/**
 * All legal moves for `seat`. Leading: any combo (the game's opening play
 * must include the lowest card in play — the 3♠ with a full table).
 * Following: any combo that beats the table, plus pass.
 */
export function legalMoves(state: TienLenState, seat: number): Move[] {
  if (
    state.phase !== "playing" ||
    seat !== state.currentSeat ||
    state.finished.includes(seat)
  ) {
    return [];
  }

  const combos = enumerateCombos(state.hands[seat]);

  if (state.topCombo === null) {
    const playable = state.firstMoveOfGame
      ? combos.filter((c) =>
          c.cards.some((card) => card.id === state.mustIncludeCardId)
        )
      : combos;
    return playable.map((combo) => ({ kind: "play", combo }));
  }

  const top = state.topCombo;
  const moves: Move[] = combos
    .filter((c) => canBeat(top, c))
    .map((combo): Move => ({ kind: "play", combo }));
  moves.push({ kind: "pass" });
  return moves;
}
