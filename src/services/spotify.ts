import type { SpotifyPlaylist } from '../types';

export function parsePlaylistId(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/playlist\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[A-Za-z0-9]{22}$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Fetch a playlist directly from Spotify using the user's OAuth token.
 * Handles pagination for playlists with more than 100 tracks.
 */
export async function fetchPlaylist(playlistId: string, accessToken: string): Promise<SpotifyPlaylist> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?market=from_token&fields=id,name,description,images,owner,tracks(total,items(track(id,name,duration_ms,artists,album,preview_url)))`,
    { headers }
  );

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message ?? `Spotify error (HTTP ${res.status})`);
  }

  const playlist: SpotifyPlaylist = await res.json();

  // Page through remaining tracks beyond the first 100
  let offset = 100;
  while (offset < playlist.tracks.total) {
    const pg = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=100&market=from_token&fields=items(track(id,name,duration_ms,artists,album,preview_url))`,
      { headers }
    );
    if (!pg.ok) break;
    const pgData = await pg.json();
    playlist.tracks.items.push(...(pgData.items ?? []));
    offset += 100;
  }

  return playlist;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min      = Math.floor(totalSec / 60);
  const sec      = String(totalSec % 60).padStart(2, '0');
  return `${min}:${sec}`;
}
