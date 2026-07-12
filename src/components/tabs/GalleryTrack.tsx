"use client";

import Image from "next/image";
import { useRef } from "react";
import type { GalleryItem } from "@/content/gallery";
import styles from "./tabs.module.css";

const PLACEHOLDER_COUNT = 8;
/** Long glide, matching the camillemormal.com reference animation. */
const GLIDE_MS = 1200;
const CLICK_DRAG_THRESHOLD_PX = 6;

interface GalleryTrackProps {
  items: GalleryItem[];
  emptyHint: string;
}

/**
 * Draggable photo strip: dragging slides the track with a long eased glide
 * while each photo pans its object-position in parallax. Progress runs from
 * 0% (start) to -100% (end of the overflow).
 */
export default function GalleryTrack({ items, emptyHint }: GalleryTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ prev: 0, current: 0, moved: false });

  const glideTo = (percentage: number) => {
    const track = trackRef.current;
    if (!track) return;
    const viewport = track.parentElement;
    const overflow = Math.max(
      track.scrollWidth - (viewport?.clientWidth ?? 0),
      0,
    );
    track.animate(
      { transform: `translateX(${(percentage / 100) * overflow}px)` },
      { duration: GLIDE_MS, fill: "forwards" },
    );
    for (const img of track.querySelectorAll("img")) {
      img.animate(
        { objectPosition: `${100 + percentage}% center` },
        { duration: GLIDE_MS, fill: "forwards" },
      );
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const downAt = e.clientX;
    drag.current.moved = false;

    const onMove = (ev: PointerEvent) => {
      const delta = downAt - ev.clientX;
      if (Math.abs(delta) > CLICK_DRAG_THRESHOLD_PX) drag.current.moved = true;
      const maxDelta = window.innerWidth / 2;
      const next = Math.max(
        Math.min(drag.current.prev - (delta / maxDelta) * 100, 0),
        -100,
      );
      drag.current.current = next;
      glideTo(next);
    };
    const onUp = () => {
      drag.current.prev = drag.current.current;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  // A real drag shouldn't open the photo the pointer happened to land on.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) e.preventDefault();
  };

  return (
    <div
      className={styles.trackViewport}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
    >
      <div ref={trackRef} className={styles.track}>
        {items.map((item) => (
          <a
            key={item.src}
            href={item.src}
            target="_blank"
            rel="noreferrer"
            draggable={false}
            className={`${styles.galleryItem} ${styles.trackItem} ${
              item.wide ? styles.trackItemWide : ""
            }`}
          >
            <span className={`card ${styles.trackTile}`}>
              <Image
                src={item.src}
                alt={item.caption}
                fill
                sizes={
                  item.wide
                    ? "(max-width: 640px) 75vw, 392px"
                    : "(max-width: 640px) 40vw, 210px"
                }
                draggable={false}
                className={styles.trackImg}
              />
            </span>
            <span className={`${styles.galleryCaption} mono text-dim`}>
              {item.caption}
            </span>
          </a>
        ))}
        {items.length === 0 &&
          Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
            <div key={i} className={`${styles.galleryItem} ${styles.trackItem}`}>
              <span
                className={`card ${styles.trackTile} ${styles.galleryEmpty}`}
              >
                <span aria-hidden>{emptyHint}</span>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
