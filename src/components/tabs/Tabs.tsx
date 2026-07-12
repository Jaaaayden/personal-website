"use client";

import { useSearchParams } from "next/navigation";
import WorkTab from "./WorkTab";
import HobbiesTab from "./HobbiesTab";
import styles from "./tabs.module.css";

export default function Tabs() {
  const tab = useSearchParams().get("tab") ?? "work";

  return (
    <section className={styles.section}>
      {tab === "hobbies" ? <HobbiesTab /> : <WorkTab />}
    </section>
  );
}
