"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useMounted } from "@/lib/useMounted";
import DuckModal from "./DuckModal";
import styles from "./desk.module.css";

function DuckHat({ hatId }: { hatId: string | null }) {
  if (hatId === "hat-top") {
    return (
      <g>
        <rect x="-11" y="-27" width="22" height="3.5" rx="1.5" fill="#1a1a1d" stroke="#000" strokeWidth="0.5" />
        <rect x="-7" y="-40" width="14" height="14" rx="1.5" fill="#1a1a1d" stroke="#000" strokeWidth="0.5" />
        <rect x="-7" y="-30" width="14" height="3" fill="var(--accent)" />
      </g>
    );
  }
  if (hatId === "hat-shades") {
    return (
      <g>
        <rect x="-9" y="-18" width="8" height="5" rx="2" fill="#111" />
        <rect x="1" y="-18" width="8" height="5" rx="2" fill="#111" />
        <rect x="-2" y="-16.5" width="4" height="1.6" fill="#111" />
      </g>
    );
  }
  if (hatId === "hat-wizard") {
    return (
      <g>
        <path d="M -10 -25 L 0 -48 L 10 -25 Z" fill="#7c5cbf" stroke="#5d43a0" strokeWidth="0.6" />
        <ellipse cx="0" cy="-25" rx="12" ry="2.6" fill="#5d43a0" />
        <circle cx="-2" cy="-34" r="1.2" fill="#f2c94c" />
        <circle cx="3" cy="-40" r="1" fill="#f2c94c" />
        <circle cx="1" cy="-29" r="1" fill="#f2c94c" />
      </g>
    );
  }
  return null;
}

function Duck({
  flip,
  hatId,
  onOpen,
  label,
}: {
  flip?: boolean;
  hatId: string | null;
  onOpen: () => void;
  label: string;
}) {
  return (
    <g
      className={styles.duck}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <g transform={flip ? "scale(-1,1)" : undefined}>
        {/* body */}
        <ellipse cx="0" cy="0" rx="15" ry="10" fill="var(--duck)" />
        {/* tail */}
        <path d="M -13 -4 Q -20 -9 -16 -1 Z" fill="var(--duck)" />
        {/* wing */}
        <ellipse cx="-3" cy="1" rx="7" ry="4.5" fill="var(--duck-wing)" />
        {/* head */}
        <circle cx="8" cy="-13" r="8.5" fill="var(--duck)" />
        {/* beak */}
        <path d="M 15 -14 L 22 -12.5 L 15 -10.5 Z" fill="var(--duck-beak)" />
        {/* eye */}
        <circle cx="10.5" cy="-15" r="1.4" fill="#1a1a1d" />
        {/* hat sits on the head */}
        <g transform="translate(8, 4)">
          <DuckHat hatId={hatId} />
        </g>
      </g>
    </g>
  );
}

export default function DeskScene() {
  const [modalOpen, setModalOpen] = useState(false);
  const mounted = useMounted();
  const duckHats = useGameStore((s) => s.equipped.duckHats);
  const hats = mounted ? duckHats : { left: null, right: null };

  return (
    <>
      <div className={styles.scene} aria-hidden={modalOpen}>
        <svg
          viewBox="0 0 280 190"
          width="230"
          height="156"
          className={styles.svg}
        >
          {/* monitor */}
          <rect x="132" y="105" width="16" height="18" fill="var(--desk-monitor)" />
          <rect x="118" y="121" width="44" height="5" rx="2" fill="var(--desk-monitor-stand)" />
          <rect x="92" y="52" width="96" height="56" rx="5" fill="var(--desk-monitor)" />
          <rect x="97" y="57" width="86" height="46" rx="3" fill="var(--desk-screen)" />
          {/* fake code on screen */}
          <rect x="103" y="64" width="30" height="3" rx="1.5" fill="var(--accent)" opacity="0.9" />
          <rect x="103" y="72" width="52" height="3" rx="1.5" fill="var(--desk-screen-dim)" />
          <rect x="110" y="80" width="40" height="3" rx="1.5" fill="var(--desk-screen-dim)" />
          <rect x="110" y="88" width="24" height="3" rx="1.5" fill="var(--accent)" opacity="0.55" />
          <rect x="103" y="96" width="44" height="3" rx="1.5" fill="var(--desk-screen-dim)" />
          {/* keyboard */}
          <rect x="104" y="132" width="66" height="8" rx="3" fill="var(--desk-keyboard)" />
          {/* desk */}
          <rect x="8" y="142" width="264" height="9" rx="3" fill="var(--desk-wood)" />
          <rect x="20" y="151" width="8" height="39" fill="var(--desk-wood-dark)" />
          <rect x="252" y="151" width="8" height="39" fill="var(--desk-wood-dark)" />
          {/* mug, lifted by the right duck — its beak (drawn after) grips
              the handle, so the mug hangs just off the desk */}
          <g>
            <rect x="194" y="116" width="14" height="13" rx="2.5" fill="var(--desk-mug)" />
            <path d="M 208 116 q 8 4 0 8" fill="none" stroke="var(--desk-mug)" strokeWidth="2.5" />
            <path d="M 198 111 q 2 -4 0 -7 M 203 111 q 2 -4 0 -7" fill="none" stroke="var(--desk-steam)" strokeWidth="1.2" opacity="0.75" />
          </g>
          {/* the trusty companions */}
          <g transform="translate(48, 132)">
            <Duck
              hatId={hats.left}
              onOpen={() => setModalOpen(true)}
              label="Rubber duck (click for a surprise)"
            />
          </g>
          <g transform="translate(232, 132)">
            <Duck
              flip
              hatId={hats.right}
              onOpen={() => setModalOpen(true)}
              label="Other rubber duck (click for a surprise)"
            />
          </g>
        </svg>
      </div>
      <DuckModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
