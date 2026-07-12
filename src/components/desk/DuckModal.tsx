"use client";

import Modal from "@/components/ui/Modal";
import styles from "./desk.module.css";

const DUCK_PHOTO_SRC = "/duck.png";

export default function DuckModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} label="My rubber ducks">
      <figure className={styles.figure}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DUCK_PHOTO_SRC}
          alt="The two rubber ducks that live on my actual desk"
          className={styles.photo}
        />
        <figcaption className={`${styles.caption} mono`}>
          my trusty companions - thank you Mr. Virak
        </figcaption>
      </figure>
    </Modal>
  );
}
