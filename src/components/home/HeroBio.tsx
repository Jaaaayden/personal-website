"use client";

import { useSearchParams } from "next/navigation";
import { BIO } from "@/content/about";
import styles from "@/app/page.module.css";

/**
 * Special phrases get bespoke links/colors; emails and bare domains become
 * accent-colored links automatically.
 */
const TOKEN =
  /(Department of Economics|AI safety|\b[Aa]lways\b|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|(?:[\w-]+\.)+(?:com|org|net|dev|io|app|edu)(?:\/\S*)?)/g;

function renderToken(part: string, key: number) {
  if (/^always$/i.test(part)) {
    return (
      <strong key={key} className={styles.bioAlways}>
        {part}
      </strong>
    );
  }
  if (part === "Department of Economics") {
    return (
      <span key={key} className={styles.bioGold}>
        {part}
      </span>
    );
  }
  if (part === "AI safety") {
    return (
      <a
        key={key}
        href="https://aisafetyatucla.org/"
        target="_blank"
        rel="noreferrer"
      >
        {part}
      </a>
    );
  }
  if (part.includes("@")) {
    return (
      <a key={key} href={`mailto:${part}`}>
        {part}
      </a>
    );
  }
  const isBruinwalk = part.startsWith("bruinwalk.");
  return (
    <a
      key={key}
      href={`https://${part}`}
      target="_blank"
      rel="noreferrer"
      className={isBruinwalk ? styles.bioBruinwalk : undefined}
    >
      {part}
    </a>
  );
}

function renderRich(text: string) {
  return text
    .split(TOKEN)
    .map((part, i) => (i % 2 === 0 ? part : renderToken(part, i)));
}

/**
 * Hero bio that swaps with the active tab. The first paragraph renders as a
 * bold lead line. Must be used inside a <Suspense> boundary (useSearchParams
 * requirement).
 */
export default function HeroBio() {
  const tab = useSearchParams().get("tab");
  const paragraphs = tab === "hobbies" ? BIO.hobbies : BIO.work;

  return (
    <div className={styles.heroAbout}>
      {paragraphs.map((paragraph) => {
        const isNote = typeof paragraph === "object";
        const text = isNote ? paragraph.text : paragraph;
        return (
          <p key={text} className={isNote ? styles.bioNote : undefined}>
            {renderRich(text)}
          </p>
        );
      })}
    </div>
  );
}
