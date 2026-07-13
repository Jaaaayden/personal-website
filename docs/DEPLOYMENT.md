# Deployment

Self-hosted with Docker Compose: a Caddy reverse proxy in front of the
Next.js app, deployed to a VPS by GitHub Actions on every push to `main`.

```
browser ──► Caddy (ports 80/443, TLS, compression) ──► app (Next.js standalone, :3000)
            └─ caddy container                          └─ app container
               (only public entrypoint)                    (compose-internal only)
```

## Local (Docker Desktop)

```bash
docker compose up -d --build   # build image from source + start both containers
docker compose ps              # app should show "healthy", caddy "running"
docker compose logs -f         # tail logs
docker compose down            # stop everything
```

Visit <http://localhost>. Without a `.env` everything still works in degraded
mode (placeholder resume PDF, no live Spotify card, contact form disabled) —
copy `.env.example` to `.env` to light features up, same as dev.

If port 80 or 443 is already taken on your machine, change the mapping in
`docker-compose.yml` to e.g. `"8080:80"` and browse `http://localhost:8080`
(the Caddyfile needs no change).

## How the image works

- `next.config.ts` sets `output: "standalone"`, so `next build` emits
  `.next/standalone/` — a self-contained `server.js` plus only the
  `node_modules` files it actually imports (~150 MB image instead of 1 GB+).
- Standalone deliberately omits `public/` and `.next/static/` (platforms
  usually serve those from a CDN); the Dockerfile copies them in manually.
  If CSS/JS or gallery images ever 404 in the container, suspect those two
  `COPY` lines first.
- The container runs as the unprivileged `node` user, and `node server.js`
  is PID 1 so `docker stop` (SIGTERM) shuts the server down gracefully.
- The ISR/data cache (`/app/.next/cache`, e.g. the 1-hour resume-PDF cache)
  is ephemeral by design: losing it on redeploy costs one Google Docs fetch,
  and a persistent volume could serve stale content across deploys.
- Run exactly **one** app replica: `/api/contact` rate-limiting is an
  in-memory `Map`, and the cache above is per-instance local disk.

## Caddy and `SITE_ADDRESS`

One Caddyfile serves both environments, driven by the `SITE_ADDRESS` env var
(set in `.env`, read by docker-compose):

| Environment | `SITE_ADDRESS` | Behavior |
|---|---|---|
| local (default) | unset → `http://localhost` | plain HTTP on port 80, no certificates |
| VPS | `yourdomain.com` | Caddy provisions + renews Let's Encrypt certs automatically; HTTP redirects to HTTPS |

The explicit `http://` in the local default is what tells Caddy not to
provision certificates; a bare hostname triggers TLS.

## VPS first-time setup (runbook)

Provider-agnostic; assumes Ubuntu 24.04 on any small VPS (Hetzner CX22,
DigitalOcean basic droplet, etc. — 1–2 GB RAM is plenty since the VPS never
builds, it only pulls images).

1. **Create the server + user.** As root:

   ```bash
   adduser deploy
   usermod -aG sudo deploy
   rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # copy your key
   ```

   Then disable password auth (`/etc/ssh/sshd_config`:
   `PasswordAuthentication no`, `systemctl restart ssh`) and continue as
   `deploy`.

2. **Install Docker** (Engine + compose plugin):

   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker deploy   # log out/in to take effect
   ```

3. **Firewall:**

   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 443/udp   # HTTP/3
   sudo ufw enable
   ```

4. **DNS:** add an A record for `yourdomain.com` → the VPS IP (and
   optionally `www`). Do this **before** the first `compose up` — Caddy
   requests a certificate on startup, and issuance fails until DNS resolves
   (Caddy retries automatically, but the logs get noisy).

5. **GHCR access:** the CI-built image is private by default. Either make
   the package public (GitHub → your profile → Packages →
   `personal-website` → Package settings → Change visibility), or do a
   one-time login on the VPS with a classic PAT scoped to `read:packages`:

   ```bash
   docker login ghcr.io -u jaaaayden   # paste PAT as password; persists
   ```

6. **Clone + configure:**

   ```bash
   sudo git clone https://github.com/Jaaaayden/personal-website.git /opt/personal-website
   sudo chown -R deploy:deploy /opt/personal-website
   cd /opt/personal-website
   cp .env.example .env && chmod 600 .env
   nano .env   # real secrets + SITE_ADDRESS=yourdomain.com
   ```

   The `.env` lives only on the VPS — never in git, never in the image.

7. **First deploy:**

   ```bash
   docker compose pull app
   docker compose up -d --no-build
   ```

   Verify `https://yourdomain.com` loads with a valid certificate and that
   plain `http://` redirects to `https://`.

## CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` runs on every push to `main`:

1. **test** — lint + vitest suite; a red suite blocks the deploy.
2. **build-and-push** — builds the Docker image and pushes it to GHCR
   tagged `:latest` and `:<commit-sha>`.
3. **deploy** — SSHes into the VPS, `git pull`s the repo (picks up
   compose/Caddyfile changes), pulls the new image, restarts, and prunes
   old images.

The deploy job needs three repository secrets (repo → Settings → Secrets
and variables → Actions):

| Secret | Value |
|---|---|
| `VPS_HOST` | server IP or hostname |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | private half of a dedicated keypair (`ssh-keygen -t ed25519 -f deploy_key`); put `deploy_key.pub` in the VPS user's `~/.ssh/authorized_keys` |

Until the VPS exists and the secrets are set, the deploy job fails red on
every push — that's expected, and the test + image-build jobs still run.

**Rollback:** every deploy is also tagged with its commit sha. On the VPS,
edit `docker-compose.yml` and change the app's `image:` tag from `latest`
to the last known-good sha (find it in the Actions history), then:

```bash
docker compose up -d --no-build
```

Revert the tag back to `latest` once `main` is fixed.

## Day-2 operations

```bash
docker compose ps                # health status
docker compose logs -f app      # app logs (or `caddy`)
docker compose up -d             # apply compose/Caddyfile edits after git pull
docker system df                 # disk usage; CI already prunes old images
```
