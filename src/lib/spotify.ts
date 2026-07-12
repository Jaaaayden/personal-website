const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL =
  "https://api.spotify.com/v1/me/player/currently-playing";
const RECENTLY_PLAYED_URL =
  "https://api.spotify.com/v1/me/player/recently-played?limit=1";

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  url: string;
}

export type NowPlayingPayload =
  | { status: "playing"; track: SpotifyTrack }
  | { status: "recent"; track: SpotifyTrack }
  | { status: "off" };

/** Access token cached per warm server instance ('use cache' can't live in a
 *  route handler, and a module variable is all this needs anyway). */
let tokenCache: { token: string; expiresAt: number } | null = null;

function isConfigured(): boolean {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID &&
      process.env.SPOTIFY_CLIENT_SECRET &&
      process.env.SPOTIFY_REFRESH_TOKEN
  );
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN!,
    }),
  });
  if (!res.ok) {
    throw new Error(`spotify token request failed: ${res.status}`);
  }

  const data: { access_token: string; expires_in: number } = await res.json();
  tokenCache = {
    token: data.access_token,
    // Refresh a minute early so we never send an expiring token.
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  };
  return tokenCache.token;
}

/* Just the fields we read from Spotify's track object. */
interface TrackJson {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string; width: number }[] };
  external_urls: { spotify: string };
}

function toTrack(item: TrackJson): SpotifyTrack {
  // Smallest image that's still >= 64px, else whatever is last (smallest).
  const images = [...item.album.images].sort((a, b) => a.width - b.width);
  const art = images.find((img) => img.width >= 64) ?? images[images.length - 1];
  return {
    id: item.id,
    title: item.name,
    artist: item.artists.map((a) => a.name).join(", "),
    album: item.album.name,
    albumArt: art?.url ?? null,
    url: item.external_urls.spotify,
  };
}

async function apiGet(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

export async function getNowPlaying(): Promise<NowPlayingPayload> {
  if (!isConfigured()) return { status: "off" };

  try {
    let token = await getAccessToken();

    let res = await apiGet(NOW_PLAYING_URL, token);
    if (res.status === 401) {
      // Stale token (e.g. revoked mid-cache) — refresh once and retry.
      tokenCache = null;
      token = await getAccessToken();
      res = await apiGet(NOW_PLAYING_URL, token);
    }

    if (res.ok && res.status !== 204) {
      const data: {
        is_playing: boolean;
        currently_playing_type: string;
        item: TrackJson | null;
      } = await res.json();
      if (
        data.is_playing &&
        data.currently_playing_type === "track" &&
        data.item
      ) {
        return { status: "playing", track: toTrack(data.item) };
      }
    }

    // Nothing playing (204, paused, or a podcast) — fall back to last played.
    const recent = await apiGet(RECENTLY_PLAYED_URL, token);
    if (recent.ok) {
      const data: { items: { track: TrackJson }[] } = await recent.json();
      if (data.items.length > 0) {
        return { status: "recent", track: toTrack(data.items[0].track) };
      }
    }
  } catch (error) {
    console.error("spotify now-playing lookup failed:", error);
  }

  return { status: "off" };
}
