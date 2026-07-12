"use client";

import { useGameStore } from "@/store/gameStore";
import { useMounted } from "@/lib/useMounted";
import styles from "./hud.module.css";

export default function PointsHud({
  onToggleShop,
  shopOpen,
}: {
  onToggleShop: () => void;
  shopOpen: boolean;
}) {
  const mounted = useMounted();
  const points = useGameStore((s) => s.points);
  const lifetime = useGameStore((s) => s.lifetimePoints);

  return (
    <div className={styles.hud}>
      <div className={styles.stats}>
        <span className={`${styles.points} mono`}>
          ◆ {mounted ? points : 0}
        </span>
        <span className={`${styles.lifetime} text-dim mono`}>
          {mounted ? lifetime : 0} lifetime
        </span>
      </div>
      <button className="btn" onClick={onToggleShop}>
        {shopOpen ? "close shop" : "🛒 shop"}
      </button>
    </div>
  );
}
