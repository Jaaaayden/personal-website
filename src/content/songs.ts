export interface Song {
  url: string;
  title: string;
}

export const SONGS: Song[] = [
  {
    url: "https://open.spotify.com/track/1Jj5r9yLJ4tQEtLrCNOhd8",
    title: "Even tears withered — TUYU",
  },
  {
    url: "https://open.spotify.com/track/2TQmt1Zp0amPr0qpYDPiLy",
    title: "Usseewa — Ado",
  },
  {
    url: "https://open.spotify.com/track/5TEH4r5OBFcKZJBjF4qOxL",
    title: "death bed (coffee for your head) — Powfu, beabadoobee",
  },
];

/** "https://open.spotify.com/track/4uLU6hMC?si=..." -> "4uLU6hMC" */
export function spotifyTrackId(url: string): string | null {
  return /track\/([A-Za-z0-9]+)/.exec(url)?.[1] ?? null;
}
