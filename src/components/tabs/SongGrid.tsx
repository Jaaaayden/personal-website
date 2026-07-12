"use client";

import { useEffect, useState } from "react";
import { SONGS, spotifyTrackId } from "@/content/songs";
import NowPlaying from "./NowPlaying";
import SpotifyEmbed from "./SpotifyEmbed";
import styles from "./tabs.module.css";

/** Give up on stragglers so a blocked iframe can't hide the whole grid. */
const REVEAL_TIMEOUT_MS = 5_000;

const TRACKS = SONGS.flatMap((song) => {
  const id = spotifyTrackId(song.url);
  return id ? [{ id, title: song.title }] : [];
});

/**
 * The static embeds load out of sync, so keep the grid hidden behind a
 * "loading" note and reveal every card at once when they've all loaded.
 */
export default function SongGrid() {
  const [loadedCount, setLoadedCount] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const ready = timedOut || loadedCount >= TRACKS.length;

  useEffect(() => {
    const t = window.setTimeout(() => setTimedOut(true), REVEAL_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={styles.songGridWrap}>
      {!ready && (
        <div className={`${styles.songLoading} mono text-dim`} role="status">
          … loading songs
        </div>
      )}
      <div
        className={`${styles.songGrid} ${ready ? styles.songGridReady : ""}`}
      >
        {TRACKS.map((track) => (
          <SpotifyEmbed
            key={track.id}
            trackId={track.id}
            title={track.title}
            onLoad={() => setLoadedCount((n) => n + 1)}
          />
        ))}
        {/* Fifth cell: whatever Spotify says I'm playing / last played. */}
        <NowPlaying />
      </div>
    </div>
  );
}
