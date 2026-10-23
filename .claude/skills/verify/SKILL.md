---
name: verify
description: Build, run, and drive this Next.js site in a headless browser to verify changes end-to-end.
---

# Verifying personal-website changes

## Build & launch

```
npm run build
npm run start -- -p 3001   # 3000 is often taken by the user's dev server
```

Playwright is a devDependency. Scripts outside the repo can't resolve it by
name — import it by file URL:

```js
import { chromium } from "file:///C:/Users/jayde/Documents/GitHub/personal-website/node_modules/playwright/index.mjs";
```

## Gotchas

- A full-viewport loading overlay (`[role="status"][aria-label="loading"]`)
  covers the page for ~1.1s after load. Wait ~1400ms after `load` before
  interacting; screenshot right after `domcontentloaded` to capture it.
- There are multiple `<canvas>` elements (cosmetics/confetti). The pong board
  is `canvas[class*="pongCanvas"]`.
- Game cards: `div.card:has(h3:text-is("<title>"))`, titles are lowercase
  ("tiến lên", "connect four", "pong"). Click their `play` button; games open
  in a modal (Escape closes).
- Pong: the left paddle follows `pointermove` on the canvas. To sustain a
  rally headlessly, poll `getImageData` for the ball (#f2f2f7 → rgb 242,242,247,
  scan interior x 60–740, y > 70 to skip paddles/score) and dispatch
  `new PointerEvent("pointermove", { clientY, bubbles: true })` at the ball's y.
- Spotify: `/api/spotify/now-playing` returns `{"status":"off"}` when the
  SPOTIFY_* env vars are empty; the hobbies-tab widget renders nothing then.
- Light theme: `addInitScript(() => localStorage.setItem("jl-theme", "light"))`.

## Flows worth driving

- `/` hard load (loading overlay appears, fades, unmounts), footer render.
- `/?tab=hobbies` for the songs section / now-playing widget.
- Games modal: open, play a move, Escape to close.
