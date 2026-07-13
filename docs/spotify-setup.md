# Spotify "listening to" setup

The hobbies tab shows a live "listening to now" / "last played" embed as the
first card in the songs grid, powered by the Spotify Web API
([src/lib/spotify.ts](../src/lib/spotify.ts)). It needs three env vars:

```
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REFRESH_TOKEN
```

Put them in `.env` for local dev, and in your deploy host's environment
settings for production. Until they're set, everything degrades gracefully —
the API returns `{ status: "off" }` and the live card simply doesn't render
(the static songs from [src/content/songs.ts](../src/content/songs.ts) still
show).

## One-time credential setup

1. **Create a Spotify app.** Go to
   <https://developer.spotify.com/dashboard> → *Create app*. Add the redirect
   URI `http://127.0.0.1:3000/callback` — Spotify requires a loopback IP
   literal, **not** `localhost`. Copy the **Client ID** and **Client Secret**.

2. **Authorize your account.** While logged into Spotify, visit (with your
   client id substituted):

   ```
   https://accounts.spotify.com/authorize?client_id=<ID>&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcallback&scope=user-read-currently-playing%20user-read-recently-played
   ```

   and approve.

3. **Copy the code.** The browser lands on
   `http://127.0.0.1:3000/callback?code=...` — the page won't load, which is
   fine. Copy the `code` query param. It expires within minutes, so move on
   to step 4 right away.

4. **Exchange the code for a refresh token** (Git Bash):

   ```bash
   curl -X POST https://accounts.spotify.com/api/token \
     -H "Authorization: Basic $(printf '%s' '<ID>:<SECRET>' | base64 -w0)" \
     -d grant_type=authorization_code -d code=<CODE> \
     -d redirect_uri=http://127.0.0.1:3000/callback
   ```

   Copy `refresh_token` from the JSON response. It doesn't expire unless you
   revoke the app's access.

5. **Fill `.env`** (create it next to `package.json`, or copy `.env.example`)
   and restart the
   dev server:

   ```
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   SPOTIFY_REFRESH_TOKEN=...
   ```

## Adjusting the static songs

Edit [src/content/songs.ts](../src/content/songs.ts): in Spotify, hit
*Share → Copy Song Link* on any track and paste it as `url`. The `title`
field is only used as the iframe's accessible name — it isn't rendered.
