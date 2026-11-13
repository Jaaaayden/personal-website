import { Suspense } from "react";
import Tabs from "@/components/tabs/Tabs";
import GamesSection from "@/components/games/GamesSection";
import FrontPageOnly from "@/components/home/FrontPageOnly";
import HeroBio from "@/components/home/HeroBio";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={styles.heroName}>Jayden Le</h1>
        <p className={`${styles.heroTagline} text-dim`}>
          a place for me to yap about software, games, music, and food
        </p>
        <Suspense fallback={null}>
          <HeroBio />
          <FrontPageOnly>
            <a href="#games" className={`${styles.gamesHint} text-dim mono`}>
              ↓ there are games down here
            </a>
          </FrontPageOnly>
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <Tabs />
      </Suspense>

      <Suspense fallback={null}>
        <FrontPageOnly>
          <GamesSection />
        </FrontPageOnly>
      </Suspense>
    </main>
  );
}
