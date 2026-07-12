import { getNowPlaying } from "@/lib/spotify";

export async function GET() {
  const payload = await getNowPlaying();
  return Response.json(payload, {
    // Playback is mine so a short
    // shared cache shields the Spotify API from traffic spikes
    headers: { "Cache-Control": "public, s-maxage=25, stale-while-revalidate=30" },
  });
}
