"use client";

import { type GameId } from "@/lib/awards";
import { useGameStore } from "@/store/gameStore";
import { useMounted } from "@/lib/useMounted";
import styles from "./games.module.css";

const BEST_LABEL: Record<GameId, (stat: number) => string> = {
  tienlen: (stat) => `best: bot stuck with ${stat} card${stat === 1 ? "" : "s"}`,
  connect4: (stat) => `best: won in ${stat} turns`,
  pong: (stat) => `best: won in ${stat}s`,
};

interface GameCardProps {
  id: GameId;
  title: string;
  blurb: string;
  reward: string;
  onPlay: () => void;
}

export default function GameCard({
  id,
  title,
  blurb,
  reward,
  onPlay,
}: GameCardProps) {
  const mounted = useMounted();
  const best = useGameStore((s) => s.bestResults[id]);

  return (
    <div className={`card ${styles.gameCard}`}>
      <div className={styles.gameCardHeader}>
        <h3 className={styles.gameCardTitle}>{title}</h3>
      </div>
      <p className={`${styles.gameCardBlurb} text-dim`}>{blurb}</p>
      <div className={styles.gameCardFooter}>
        <span className={`${styles.gameCardMeta} text-dim mono`}>
          {reward}
          {mounted && best !== undefined ? ` · ${BEST_LABEL[id](best)}` : ""}
        </span>
        <button className="btn btn-accent" onClick={onPlay}>
          play
        </button>
      </div>
    </div>
  );
}
