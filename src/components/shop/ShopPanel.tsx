"use client";

import { SHOP_ITEMS } from "@/store/catalog";
import ShopItemCard from "./ShopItemCard";
import styles from "./shop.module.css";

export default function ShopPanel() {
  return (
    <div className={styles.grid}>
      {SHOP_ITEMS.map((item) => (
        <ShopItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
