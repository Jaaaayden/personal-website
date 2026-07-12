import { Suspense } from "react";
import Tabs from "@/components/tabs/Tabs";
import GamesSection from "@/components/games/GamesSection";
import FrontPageOnly from "@/components/home/FrontPageOnly";
import HeroBio from "@/components/home/HeroBio";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.fold}>
        <section className={styles.hero}>
          <h1 className={styles.heroName}>Jayden Le</h1>
          <p className={`${styles.heroTagline} text-dim`}>
            a place for me to yap about software, games, music, and food
          </p>
          <Suspense fallback={null}>
            <HeroBio />
          </Suspense>
        </section>

        <Suspense fallback={null}>
          <Tabs />
          <FrontPageOnly>
            <div className={styles.gamesHint}>
              <a href="#games" className={`${styles.gamesHintLink} text-dim mono`}>
                ↓ there are games down here
              </a>
            </div>
          </FrontPageOnly>
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <FrontPageOnly>
          <GamesSection />
        </FrontPageOnly>
      </Suspense>
    </main>
  );
}
