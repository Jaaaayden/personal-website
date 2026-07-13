"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
}

const CONFETTI_COLORS = ["#7aa2f7", "#f7768e", "#73daca", "#e0af68", "#f2c94c"];

function accentColor(): string {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim() || "#7aa2f7"
  );
}

/**
 * Applies the purchased accent theme to <html data-accent> and runs a single
 * overlay canvas for the cursor trail + win confetti cosmetics.
 */
export default function CosmeticsEffects() {
  const accent = useGameStore((s) => s.equipped.accent);
  const cursorTrail = useGameStore((s) => s.equipped.cursorTrail);
  const celebration = useGameStore((s) => s.celebration);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const trailEnabledRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.accent = accent ?? "";
  }, [accent]);

  useEffect(() => {
    trailEnabledRef.current = cursorTrail;
  }, [cursorTrail]);

  // One rAF loop drives both trail and confetti particles.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      if (!trailEnabledRef.current) return;
      particlesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 0.5,
        maxLife: 0.5,
        color: accentColor(),
        size: 2.5,
        gravity: 0,
      });
    };
    window.addEventListener("pointermove", onMove);

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = Math.max(p.life / p.maxLife, 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  // Fire a confetti burst whenever the celebration counter ticks.
  const prevCelebration = useRef<number | null>(null);
  useEffect(() => {
    if (prevCelebration.current === null) {
      prevCelebration.current = celebration;
      return;
    }
    if (celebration === prevCelebration.current) return;
    prevCelebration.current = celebration;
    const cx = window.innerWidth / 2;
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 450;
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 200,
        y: window.innerHeight * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 200,
        life: 1.2 + Math.random() * 0.8,
        maxLife: 2,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 4 + Math.random() * 4,
        gravity: 500,
      });
    }
  }, [celebration]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        // Display at viewport size; the backing store is scaled by
        // devicePixelRatio in resize(), so without this the canvas element
        // itself would render DPR× larger than the screen.
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 200,
      }}
    />
  );
}
