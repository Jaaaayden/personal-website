"use client";

import { useEffect, useState } from "react";
import type { NowPlayingPayload } from "@/lib/spotify";
import SpotifyEmbed from "./SpotifyEmbed";

const POLL_MS = 45_000;

/**
 * Live "now playing" embed fed by /api/spotify/now-playing. Renders nothing
 * until the first fetch lands, and nothing at all when Spotify isn't
 * configured — the static songs grid carries the section either way.
 */
export default function NowPlaying() {
  const [payload, setPayload] = useState<NowPlayingPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: number | undefined;

    const poll = async () => {
      try {
        const res = await fetch("/api/spotify/now-playing");
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: NowPlayingPayload = await res.json();
        if (!cancelled) {
          // Keep the previous object when nothing changed so the embed
          // iframe never reloads mid-listen on a routine poll.
          setPayload((prev) => {
            if (
              prev?.status === data.status &&
              prev.status !== "off" &&
              data.status !== "off" &&
              prev.track.id === data.track.id
            ) {
              return prev;
            }
            return data;
          });
        }
      } catch {
        if (!cancelled) setPayload({ status: "off" });
      }
    };

    const start = () => {
      poll();
      interval = window.setInterval(poll, POLL_MS);
    };
    const stop = () => window.clearInterval(interval);

    // No point polling a hidden tab; refresh immediately on return.
    const onVisibility = () => {
      stop();
      if (document.visibilityState === "visible") start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (!payload || payload.status === "off") return null;

  const { track } = payload;
  const playing = payload.status === "playing";

  return (
    <SpotifyEmbed
      trackId={track.id}
      title={`${track.title} — ${track.artist}`}
      label={playing ? "listening to now" : "last played"}
    />
  );
}
