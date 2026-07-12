"use client";

import { useState } from "react";
import { useTheme } from "@/lib/useTheme";
import styles from "./tabs.module.css";

interface SpotifyEmbedProps {
  trackId: string;
  /** Accessible title for the iframe (not rendered). */
  title: string;
  /** Optional small caption above the player, e.g. "listening to now". */
  label?: string;
  /** Notifies the parent so a grid can reveal all embeds together. */
  onLoad?: () => void;
}

/** Spotify's official compact track player. The embed has no white theme, so
 *  light mode gets the default album-art-tinted look and dark mode the
 *  neutral dark one (theme=0). A toggle swaps src, reloading the iframe —
 *  SongGrid's reveal is already latched by then, so no flash of hidden grid. */
export default function SpotifyEmbed({
  trackId,
  title,
  label,
  onLoad,
}: SpotifyEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const theme = useTheme();

  return (
    <div>
      {label && (
        <span className={`${styles.embedLabel} mono text-dim`}>{label}</span>
      )}
      <iframe
        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator${
          theme === "dark" ? "&theme=0" : ""
        }`}
        width="100%"
        height={152}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        title={title}
        className={`${styles.embedFrame} ${loaded ? styles.embedLoaded : ""}`}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
      />
    </div>
  );
}
