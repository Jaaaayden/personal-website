export type ShopItemKind = "accent" | "effect" | "duckHat" | "unlock";

export interface ShopItem {
  id: string;
  name: string;
  kind: ShopItemKind;
  price: number;
  /** Hex swatch for accents, emoji for everything else. */
  preview: string;
  description: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "accent-ember",
    name: "Ember Theme",
    kind: "accent",
    price: 100,
    preview: "#f7768e",
    description: "Repaint the site's accent color a warm ember pink.",
  },
  {
    id: "accent-mint",
    name: "Mint Theme",
    kind: "accent",
    price: 100,
    preview: "#73daca",
    description: "A cool mint accent for the whole site.",
  },
  {
    id: "accent-gold",
    name: "Gold Theme",
    kind: "accent",
    price: 100,
    preview: "#e0af68",
    description: "Everything is better in gold.",
  },
  {
    id: "cursor-trail",
    name: "Cursor Trail",
    kind: "effect",
    price: 150,
    preview: "✨",
    description: "A little sparkle follows your cursor around.",
  },
  {
    id: "confetti",
    name: "Win Confetti",
    kind: "effect",
    price: 200,
    preview: "🎉",
    description: "Confetti bursts whenever you beat a bot.",
  },
  {
    id: "hat-top",
    name: "Duck Top Hat",
    kind: "duckHat",
    price: 250,
    preview: "🎩",
    description: "A distinguished top hat for one of the desk ducks.",
  },
  {
    id: "hat-shades",
    name: "Duck Sunglasses",
    kind: "duckHat",
    price: 250,
    preview: "🕶️",
    description: "Deal-with-it shades for one of the desk ducks.",
  },
  {
    id: "hat-wizard",
    name: "Duck Wizard Hat",
    kind: "duckHat",
    price: 250,
    preview: "🧙",
    description: "Imbue a desk duck with arcane debugging powers.",
  },
  {
    id: "secret-page",
    name: "Secret Page",
    kind: "unlock",
    price: 1000,
    preview: "🔒",
    description: "Unlocks a hidden page. What's on it? That's the secret.",
  },
];

export const ACCENT_BY_ITEM: Record<string, string> = {
  "accent-ember": "ember",
  "accent-mint": "mint",
  "accent-gold": "gold",
};

export function getItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}
