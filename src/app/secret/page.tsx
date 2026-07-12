"use client";

import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";
import { useGameStore } from "@/store/gameStore";
import { useMounted } from "@/lib/useMounted";
import styles from "./secret.module.css";

export default function SecretPage() {
  const mounted = useMounted();
  const unlocked = useGameStore((s) => s.owned.includes("secret-page"));

  if (!mounted) return null;

  if (!unlocked) {
    return (
      <main className={styles.main}>
        <div className={`card ${styles.panel}`}>
          <h1 className={styles.title}>🔒 locked</h1>
          <p className="text-dim">
            This page costs 1000 ◆ in the shop. The bots are waiting for their match!
          </p>
          <Link href="/" className="btn">
            back to the arcade
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={`card ${styles.panel}`}>
        <h1 className={styles.title}>🎉 you found it :D</h1>
        <p>
          If you&apos;re reading this, you either realized your points live in localStorage and edited them yourself or 
          are really good at tiến lên/connect four/pong! Regardless, congrats!
        </p>
        <h2 className={styles.subtitle}>hmm...</h2>
        <p className="text-dim">
          not exactly sure what I could put on this page that would make reaching it
          worth it... what were you expecting? please give me ideas below ._.
        </p>
        <h2 className={styles.subtitle}>suggestion box</h2>
        <p className="text-dim">
          this goes straight to my inbox!
        </p>
        <ContactForm />
        <Link href="/" className="btn">
          back home
        </Link>
      </div>
    </main>
  );
}
