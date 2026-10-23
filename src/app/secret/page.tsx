"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ContactForm } from "@/components/contact/ContactForm";
import { useGameStore } from "@/store/gameStore";
import { useMounted } from "@/lib/useMounted";
import styles from "./secret.module.css";

const VISITOR_ID_KEY = "jl-visitor-id";

/** Stable per-browser ID, so reloads don't count twice. */
function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    // Storage blocked: still count this visit, just not as the same person later.
    return crypto.randomUUID();
  }
}

export default function SecretPage() {
  const mounted = useMounted();
  const unlocked = useGameStore((s) => s.owned.includes("secret-page"));
  const [visit, setVisit] = useState<{ number: number; total: number } | null>(
    null
  );

  useEffect(() => {
    if (!mounted || !unlocked) return;
    let cancelled = false;
    fetch("/api/secret-visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: getVisitorId() }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setVisit(data);
      })
      // A broken counter just doesn't show; the page still works.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mounted, unlocked]);

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
        {visit && (
          <p className={`text-dim ${styles.counter}`}>
            you&apos;re visitor #{visit.number} of {visit.total}{" "}
            who&apos;ve made it here
          </p>
        )}
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
