# Architecture & Stack

A tour of how this site is built — the technologies, the Next.js mental model, and
the patterns used to wire the frontend to the backend. Written to be a reference for
future work.

> Heads up: this repo pins **Next.js 16.2**, which has breaking changes from older
> Next.js. When in doubt, the authoritative docs ship inside the package at
> `node_modules/next/dist/docs/` (see [AGENTS.md](../AGENTS.md)).

## 1. Stack at a glance

| Layer | Choice | Why it's here |
|---|---|---|
| Framework | **Next.js 16.2** (App Router) | React framework that runs code on *both* server and browser, and gives you routing + a backend for free |
| UI library | **React 19.2** | The component model — `.tsx` files that return HTML-like markup |
| Language | **TypeScript 5** | JavaScript with types; catches mistakes before runtime |
| Client state | **Zustand 5** | Tiny store for points/inventory that survives page reloads |
| Styling | **CSS Modules** (`*.module.css`) + `globals.css` | Scoped, plain CSS — no styling framework |
| Tests | **Vitest** (Playwright also installed) | Unit tests for game logic under `src/games/**/__tests__` |
| Lint | **ESLint** (`eslint-config-next`) | Style and correctness rules |

[`next.config.ts`](../next.config.ts) is intentionally empty — the app runs on pure
convention with no custom build configuration.

## 2. The Next.js mental model (the one big idea)

**Your code runs in two different places**, and Next.js decides which by a few rules.

- **Server Components (the default)** — every `.tsx` under [`src/app/`](../src/app) is a
  Server Component unless it opts out. It runs on the server (or at build time), can read
  secrets and touch the filesystem, and ships **zero JavaScript** to the browser.
  [`layout.tsx`](../src/app/layout.tsx) and [`page.tsx`](../src/app/page.tsx) are these.
- **Client Components** — a file with `"use client"` on line 1 (see
  [`gameStore.ts`](../src/store/gameStore.ts), [`NowPlaying.tsx`](../src/components/tabs/NowPlaying.tsx))
  runs in the browser. Only these can use `useState`, `useEffect`, `onClick`,
  `localStorage` — anything interactive or browser-only.

**Rule of thumb this codebase follows:** stay on the server until you need interactivity,
then push `"use client"` as far *down* the tree as possible. `page.tsx` is a Server
Component that renders `<Tabs/>` and `<GamesSection/>`; the interactive pieces inside them
are the Client Components.

### File = route

The folder structure under `src/app/` **is** the URL map:

| File | URL | Kind |
|---|---|---|
| [`src/app/page.tsx`](../src/app/page.tsx) | `/` | A visible page |
| [`src/app/secret/page.tsx`](../src/app/secret/page.tsx) | `/secret` | A visible page |
| [`src/app/resume.pdf/route.ts`](../src/app/resume.pdf/route.ts) | `/resume.pdf` | A backend endpoint |
| [`src/app/api/spotify/now-playing/route.ts`](../src/app/api/spotify/now-playing/route.ts) | `/api/spotify/now-playing` | A backend endpoint |
| [`src/app/api/contact/route.ts`](../src/app/api/contact/route.ts) | `/api/contact` | A backend endpoint |

- `page.tsx` → a rendered page.
- `route.ts` → a backend HTTP endpoint (exports `GET`/`POST` functions).
- `layout.tsx` → the shell wrapped around pages (the `<html>`, nav, footer, and fonts
  live here).

## 3. npm & packaging

- **[`package.json`](../package.json)** is the manifest: `name`, `scripts` (what
  `npm run dev` etc. map to), and two dependency lists.
  - **`dependencies`** ship to production (`next`, `react`, `zustand`).
  - **`devDependencies`** are only for building/testing (`typescript`, `eslint`,
    `vitest`, `@types/*`). The `@types/*` packages are type definitions that teach
    TypeScript about libraries written in plain JavaScript.
- **Version syntax:** `"^5.0.14"` means "5.0.14 or any newer 5.x" (the caret allows
  compatible updates). Versions pinned without a caret — like `"next": "16.2.10"` and
  `"eslint-config-next": "16.2.10"` — mean *exactly* this version; those two are pinned
  together on purpose so Next and its lint config never drift apart.
- **`package-lock.json`** records the exact resolved version of every package (and its
  sub-packages) so installs are reproducible. Commit it; never edit it by hand.
- **`node_modules/`** is the installed code — gitignored, rebuilt from the lockfile by
  `npm install`.
- **`@/*` path alias:** [`tsconfig.json`](../tsconfig.json) maps `@/*` → `./src/*`, so
  `import ... from "@/lib/spotify"` resolves to `src/lib/spotify.ts`. It's mirrored in
  [`vitest.config.ts`](../vitest.config.ts) so tests resolve imports the same way. This
  avoids long `../../../` import chains.

## 4. Frontend ↔ backend integration — the three patterns

This is the most transferable part. The codebase demonstrates the three canonical patterns
cleanly.

### Pattern A — Backend endpoint hiding a secret (Spotify)

[`src/lib/spotify.ts`](../src/lib/spotify.ts) runs **only on the server**. It reads
`process.env.SPOTIFY_CLIENT_SECRET` (a secret that must never reach the browser) and talks
to the Spotify API. The route handler
[`api/spotify/now-playing/route.ts`](../src/app/api/spotify/now-playing/route.ts) exposes a
safe, public JSON shape. The Client Component
[`NowPlaying.tsx`](../src/components/tabs/NowPlaying.tsx) simply does
`fetch("/api/spotify/now-playing")` every 45 seconds. The browser never sees the
credentials — only the sanitized result. **This secret/public split is the core reason to
have a backend at all.**

The secret page's suggestion box is the same pattern in the write direction:
[`ContactForm.tsx`](../src/components/contact/ContactForm.tsx) POSTs the visitor's message
to [`api/contact/route.ts`](../src/app/api/contact/route.ts), which validates it, drops
bot submissions (honeypot field), rate-limits by IP, and forwards it to the Resend email
API using the server-only `RESEND_API_KEY`.

### Pattern B — Server-side proxy with caching (resume)

[`resume.pdf/route.ts`](../src/app/resume.pdf/route.ts) fetches a Google Doc as a PDF on the
server and streams it back with a `Cache-Control` header, so it re-fetches at most once an
hour. Result: editing the Google Doc updates the live site with no redeploy. Both endpoints
**degrade gracefully** — if the relevant env var is missing, a placeholder is served rather
than crashing.

### Pattern C — Pure client state, no backend (the arcade)

[`store/gameStore.ts`](../src/store/gameStore.ts) is Zustand plus the `persist` middleware.
Points and owned cosmetics live in the browser's `localStorage` under the key
`jl-portfolio-v1`. There is **no server involved**, which is why anyone can play instantly
and why progress is per-device. The `version` field (currently 3) plus a `migrate`
function upgrade older visitors' saved state as the shape evolves, instead of breaking it.

### The decision rule

> Does it need a secret, or need to be identical for everyone / persisted server-side?
> → **backend** (`route.ts` + a `lib/` module).
> Is it purely this visitor's UI state? → **client store**.

## 5. Design choices worth knowing

- **Theme anti-flash script** ([`layout.tsx`](../src/app/layout.tsx)): a raw `<script>` runs
  *before* React paints, setting `data-theme` from `localStorage` so a light-mode visitor
  never sees a dark flash. That's why `<html>` carries `suppressHydrationWarning` — the
  server render can't predict what that script will do. A classic SSR gotcha, handled
  correctly.
- **`<Suspense fallback={null}>`** around `Nav` / `Tabs`: lets those components use
  browser-only APIs without blocking the server render.
- **CSS Modules over a framework**: each component owns a `*.module.css`; class names are
  hashed so they can't collide across components. Zero styling dependencies.
- **Game logic separated from rendering**: `src/games/*/engine.ts` and `bot.ts` are pure
  TypeScript with unit tests; the React `*Board.tsx` components only render them. That
  separation is what makes the games testable.
- **Caching as a first-class tool**: both route handlers set `s-maxage` /
  `stale-while-revalidate` headers to shield upstream APIs from traffic — a production
  instinct.

## 6. Run & deploy

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at `localhost:3000` with hot reload |
| `npm run build` | Compiles/optimizes; static pages are pre-rendered, dynamic routes stay as server functions |
| `npm start` | Serves the production build |
| `npm test` | Runs the Vitest unit suite once |

Runs anywhere `next build` + `next start` works — Vercel, a container, or a bare Node
host. Env vars (the full list lives in [`.env.example`](../.env.example) and the README
table) go in the host's environment settings, mirroring your local `.env`; every
integration degrades gracefully when its vars are unset. The `s-maxage` headers are
honored by CDN layers such as Vercel's edge cache.

### A compact heuristic for future work

1. Every new page/endpoint is a folder under `src/app/`.
2. Start server-side; add `"use client"` only where you need interactivity.
3. Secrets and shared data go through a `route.ts` backed by a `lib/` module.
4. Per-visitor UI state goes in a client store (Zustand + `persist`).
