"use client";

import { ACCENT_BY_ITEM, type ShopItem } from "@/store/catalog";
import { useGameStore } from "@/store/gameStore";
import styles from "./shop.module.css";

export default function ShopItemCard({ item }: { item: ShopItem }) {
  const points = useGameStore((s) => s.points);
  const owned = useGameStore((s) => s.owned.includes(item.id));
  const equipped = useGameStore((s) => s.equipped);
  const buy = useGameStore((s) => s.buy);
  const equipAccent = useGameStore((s) => s.equipAccent);
  const toggleEffect = useGameStore((s) => s.toggleEffect);
  const equipDuckHat = useGameStore((s) => s.equipDuckHat);

  const isEquipped =
    (item.kind === "accent" && equipped.accent === ACCENT_BY_ITEM[item.id]) ||
    (item.id === "cursor-trail" && equipped.cursorTrail) ||
    (item.id === "confetti" && equipped.confetti) ||
    (item.kind === "duckHat" &&
      (equipped.duckHats.left === item.id ||
        equipped.duckHats.right === item.id));

  const handleAction = () => {
    if (!owned) {
      buy(item.id);
      return;
    }
    switch (item.kind) {
      case "accent":
        equipAccent(isEquipped ? null : ACCENT_BY_ITEM[item.id]);
        break;
      case "effect":
        toggleEffect(item.id as "cursor-trail" | "confetti");
        break;
      case "duckHat":
        if (isEquipped) {
          if (equipped.duckHats.left === item.id) equipDuckHat("left", null);
          else equipDuckHat("right", null);
        } else if (equipped.duckHats.left === null) {
          equipDuckHat("left", item.id);
        } else {
          equipDuckHat("right", item.id);
        }
        break;
      case "unlock":
        break;
    }
  };

  const actionLabel = !owned
    ? `buy · ◆${item.price}`
    : item.kind === "unlock"
      ? "owned"
      : isEquipped
        ? "unequip"
        : "equip";

  return (
    <div className={`card ${styles.item}`}>
      <div className={styles.preview}>
        {item.kind === "accent" ? (
          <span
            className={styles.swatch}
            style={{ background: item.preview }}
          />
        ) : (
          <span className={styles.emoji}>{item.preview}</span>
        )}
      </div>
      <div className={styles.itemBody}>
        <span className={styles.itemName}>
          {item.name}
          {isEquipped && <span className={styles.equippedTag}>on</span>}
        </span>
        <span className={`${styles.itemDesc} text-dim`}>
          {item.description}
        </span>
      </div>
      {item.kind === "unlock" && owned ? (
        <a href="/secret" className="btn">
          visit
        </a>
      ) : (
        <button
          className={`btn ${!owned ? "btn-accent" : ""}`}
          onClick={handleAction}
          disabled={!owned && points < item.price}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
