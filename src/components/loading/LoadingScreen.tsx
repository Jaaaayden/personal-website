"use client";

import { useEffect, useState } from "react";
import styles from "./LoadingScreen.module.css";

const MIN_VISIBLE_MS = 700; // never blink — hold at least this long
const FADE_MS = 400; // must match the transition in the CSS
const MAX_WAIT_MS = 4000; // failsafe: hide even if 'load' never fires

/**
 * Full-viewport three-dot loader shown from the first server-rendered paint
 * until the window finishes loading. Rendered in the server HTML so it covers
 * the hydration window; all hiding happens client-side. Without JS it would
 * persist, which is acceptable — the whole site is client-driven anyway.
 */
export default function LoadingScreen() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const timers: number[] = [];
    let hidden = false;

    const hide = () => {
      if (hidden) return;
      hidden = true;
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - start));
      timers.push(
        window.setTimeout(() => {
          setLeaving(true);
          timers.push(window.setTimeout(() => setGone(true), FADE_MS));
        }, wait)
      );
    };

    if (document.readyState === "complete") hide();
    else window.addEventListener("load", hide, { once: true });
    timers.push(window.setTimeout(hide, MAX_WAIT_MS));

    return () => {
      window.removeEventListener("load", hide);
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={`${styles.overlay} ${leaving ? styles.leaving : ""}`}
      role="status"
      aria-label="loading"
    >
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  );
}
