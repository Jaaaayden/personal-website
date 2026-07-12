"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ShopPanel from "@/components/shop/ShopPanel";
import PointsHud from "@/components/hud/PointsHud";
import GameCard from "./GameCard";
import ConnectFourBoard from "./ConnectFourBoard";
import PongCanvas from "./PongCanvas";
import TienLenBoard from "./TienLenBoard";
import type { GameId } from "@/lib/awards";
import styles from "./games.module.css";

const GAMES: Array<{
  id: GameId;
  title: string;
  blurb: string;
  reward: string;
}> = [
  {
    id: "tienlen",
    title: "tiến lên",
    blurb:
      "the 13-card game my family plays, heads-up against a robot version of me. it hoards its 2s, so play smart.",
    reward: "60+ ◆ per win",
  },
  {
    id: "connect4",
    title: "connect four",
    blurb:
      "a minimax bot that never misses your open threes. double threats are the only way in.",
    reward: "90 ◆ per win",
  },
  {
    id: "pong",
    title: "pong",
    blurb:
      "the robot paddle tracks with a lag and an aim error. sharp angles beat it.",
    reward: "50+ ◆ per win",
  },
];

const TITLES: Record<GameId, string> = {
  tienlen: "tiến lên vs robo-jayden",
  connect4: "connect four vs the bot",
  pong: "pong vs the bot",
};

export default function GamesSection() {
  const [openGame, setOpenGame] = useState<GameId | null>(null);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <section id="games" className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>the arcade</h2>
          <p className={`${styles.sectionSub} text-dim`}>
            beat my bots to earn points, then spend them in the shop.
          </p>
        </div>
        <PointsHud onToggleShop={() => setShopOpen((v) => !v)} shopOpen={shopOpen} />
      </div>

      {shopOpen && (
        <div className={styles.shopWrap}>
          <ShopPanel />
        </div>
      )}

      <div className={styles.gameGrid}>
        {GAMES.map((game) => (
          <GameCard
            key={game.id}
            id={game.id}
            title={game.title}
            blurb={game.blurb}
            reward={game.reward}
            onPlay={() => setOpenGame(game.id)}
          />
        ))}
      </div>

      <Modal
        open={openGame !== null}
        onClose={() => setOpenGame(null)}
        label={openGame ? TITLES[openGame] : "game"}
        size="wide"
        closeOnBackdrop={false}
      >
        {openGame && (
          <>
            <h3 className={styles.modalTitle}>{TITLES[openGame]}</h3>
            {openGame === "tienlen" && <TienLenBoard />}
            {openGame === "connect4" && <ConnectFourBoard />}
            {openGame === "pong" && <PongCanvas />}
          </>
        )}
      </Modal>
    </section>
  );
}
