import Image from "next/image";
import {
  GALLERY,
  GALLERY_SECTIONS,
  type GalleryTag,
} from "@/content/gallery";
import GalleryTrack from "./GalleryTrack";
import styles from "./tabs.module.css";

const EMPTY_HINTS: Record<GalleryTag, string> = {
  food: "🍜",
  places: "🌊",
  achievements: "🏆",
};

/**
 * Photo wall grouped into food / places / achievements sections. Food and
 * places render as draggable parallax tracks; achievements stays a grid.
 */
export default function GalleryGrid() {
  return (
    <div className={styles.galleryStack}>
      {(Object.keys(GALLERY_SECTIONS) as GalleryTag[]).map((tag) => {
        const items = GALLERY.filter((item) => item.tag === tag);
        if (tag !== "achievements") {
          return (
            <div key={tag}>
              <h3 className={styles.subheading}>{GALLERY_SECTIONS[tag]}</h3>
              <GalleryTrack items={items} emptyHint={EMPTY_HINTS[tag]} />
            </div>
          );
        }
        return (
          <div key={tag}>
            <h3 className={styles.subheading}>{GALLERY_SECTIONS[tag]}</h3>
            <div className={styles.galleryGrid}>
              {items.map((item) => {
                const [w, h] = item.aspect?.split("/").map(Number) ?? [];
                const ratio = w && h ? w / h : 1;
                return (
                <a
                  key={item.src}
                  href={item.src}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.galleryItem}
                  style={{ "--tile-ratio": ratio } as React.CSSProperties}
                >
                  <span
                    className={`card ${styles.galleryTile}`}
                    style={
                      item.aspect ? { aspectRatio: item.aspect } : undefined
                    }
                  >
                    <Image
                      src={item.src}
                      alt={item.caption}
                      fill
                      sizes="(max-width: 640px) 95vw, 900px"
                      className={styles.galleryImg}
                      style={
                        item.focus ? { objectPosition: item.focus } : undefined
                      }
                    />
                  </span>
                  <span className={`${styles.galleryCaption} mono text-dim`}>
                    {item.caption}
                  </span>
                </a>
                );
              })}
              {items.length === 0 &&
                Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className={styles.galleryItem}>
                    <span
                      className={`card ${styles.galleryTile} ${styles.galleryEmpty}`}
                    >
                      <span aria-hidden>{EMPTY_HINTS[tag]}</span>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
