import SongGrid from "./SongGrid";
import GalleryGrid from "./GalleryGrid";
import styles from "./tabs.module.css";

export default function HobbiesTab() {
  return (
    <div className={styles.galleryStack}>
      <div>
        <h3 className={styles.subheading}>songs on repeat (sorta loud so turn volume down)</h3>
        <SongGrid />
      </div>
      <GalleryGrid />
    </div>
  );
}
