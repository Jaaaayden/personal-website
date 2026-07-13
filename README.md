# Jayden Le — personal website

[jaydenle.com](https://jaydenle.com) - Simple portfolio site with a couple games to play :D

Next.js 16 (App Router) + TypeScript, Zustand for client state,
plain CSS Modules, and Vitest

## Getting started (if you for some reason want to host locally)

```bash
npm install
cp .env.example .env   # optional — fill in what you need (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

All optional — no crashes w/ missing google doc for resume/etc

| Variable | Powers | Without it |
|---|---|---|
| `RESUME_GDOC_ID` | `/resume.pdf` proxies a live Google Doc PDF export | A placeholder PDF is served |
| `SPOTIFY_CLIENT_ID` `SPOTIFY_CLIENT_SECRET` `SPOTIFY_REFRESH_TOKEN` | "listening to now" card in the hobbies tab ([setup walkthrough](docs/spotify-setup.md)) | The live card doesn't render; static songs still show |
| `RESEND_API_KEY` `CONTACT_TO` | Secret-page suggestion box → email via [Resend](https://resend.com) | The form shows a friendly "mailbox isn't set up" error |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Run the Vitest suite once (game engines have a bot-vs-bot fuzz suite) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint |

## Deployment

Self-hosted with Docker Compose (Caddy + Next.js standalone), auto-deployed
to a VPS by GitHub Actions on push to `main`. Locally:
`docker compose up -d --build` → <http://localhost>. Full runbook:
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
