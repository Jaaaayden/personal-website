"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACCENT_BY_ITEM, getItem } from "@/store/catalog";
import { type GameId } from "@/lib/awards";

export interface Equipped {
  accent: string | null; // 'ember' | 'mint' | 'gold'
  cursorTrail: boolean;
  confetti: boolean;
  duckHats: { left: string | null; right: string | null };
}

interface GameStore {
  points: number;
  lifetimePoints: number;
  owned: string[];
  equipped: Equipped;
  /**
   * Per-game best win stat, not points: tienlen = most cards left in the
   * bot's hand, connect4 = fewest turns, pong = fastest win in seconds.
   */
  bestResults: Partial<Record<GameId, number>>;
  /** Increments on every rewarded win; effects listen to fire confetti. */
  celebration: number;
  earn: (game: GameId, rawPoints: number, winStat?: number) => number;
  buy: (id: string) => boolean;
  equipAccent: (accent: string | null) => void;
  toggleEffect: (id: "cursor-trail" | "confetti") => void;
  equipDuckHat: (side: "left" | "right", hatId: string | null) => void;
}

/** Whether a smaller win stat beats the record (turns, seconds) or a bigger one does (cards). */
const LOWER_STAT_IS_BETTER: Record<GameId, boolean> = {
  tienlen: false,
  connect4: true,
  pong: true,
};

function betterStat(game: GameId, prev: number | undefined, next: number): number {
  if (prev === undefined) return next;
  return LOWER_STAT_IS_BETTER[game]
    ? Math.min(prev, next)
    : Math.max(prev, next);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      points: 0,
      lifetimePoints: 0,
      owned: [],
      equipped: {
        accent: null,
        cursorTrail: false,
        confetti: false,
        duckHats: { left: null, right: null },
      },
      bestResults: {},
      celebration: 0,

      earn: (game, rawPoints, winStat) => {
        const state = get();
        const awarded = Math.max(0, rawPoints);
        set({
          points: state.points + awarded,
          lifetimePoints: state.lifetimePoints + awarded,
          bestResults:
            winStat === undefined
              ? state.bestResults
              : {
                  ...state.bestResults,
                  [game]: betterStat(game, state.bestResults[game], winStat),
                },
          celebration:
            awarded > 0 && state.equipped.confetti
              ? state.celebration + 1
              : state.celebration,
        });
        return awarded;
      },

      buy: (id) => {
        const item = getItem(id);
        const state = get();
        if (!item || state.owned.includes(id) || state.points < item.price) {
          return false;
        }
        set({ points: state.points - item.price, owned: [...state.owned, id] });
        return true;
      },

      equipAccent: (accent) => {
        set((s) => ({ equipped: { ...s.equipped, accent } }));
      },

      toggleEffect: (id) => {
        set((s) => ({
          equipped: {
            ...s.equipped,
            ...(id === "cursor-trail"
              ? { cursorTrail: !s.equipped.cursorTrail }
              : { confetti: !s.equipped.confetti }),
          },
        }));
      },

      equipDuckHat: (side, hatId) => {
        set((s) => {
          const duckHats = { ...s.equipped.duckHats };
          // A hat can only sit on one duck at a time.
          if (hatId) {
            if (duckHats.left === hatId) duckHats.left = null;
            if (duckHats.right === hatId) duckHats.right = null;
          }
          duckHats[side] = hatId;
          return { equipped: { ...s.equipped, duckHats } };
        });
      },
    }),
    {
      name: "jl-portfolio-v1",
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as Partial<GameStore> & { daily?: unknown };
        // v1 stored best points-per-win; the field now holds per-game win
        // stats, so old values would read as nonsense.
        if (version < 2) state.bestResults = {};
        // v3 dropped daily caps, so the per-day earnings tally went with them.
        if (version < 3) delete state.daily;
        return state;
      },
    }
  )
);

/** Helper for accent item id -> data-accent value. */
export function accentForItem(itemId: string): string | undefined {
  return ACCENT_BY_ITEM[itemId];
}
