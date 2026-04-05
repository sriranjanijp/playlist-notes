import type { SpotifyPlaylist } from '../types';

/**
 * Extract a Spotify playlist ID from either:
 *  - a full URL:  https://open.spotify.com/playlist/37i9dQZF1DX...
 *  - a raw ID:    37i9dQZF1DX...
 */
export function parsePlaylistId(input: string): string | null {
  const trimmed = input.trim();

  const urlMatch = trimmed.match(/playlist\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  if (/^[A-Za-z0-9]{22}$/.test(trimmed)) return trimmed;

  return null;
}

/**
 * Fetch a playlist from our Express proxy (Client Credentials, secret stays
 * on the server).
 */
export async function fetchPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
  const res = await fetch(`/api/playlist/${playlistId}`);
  const data = await res.json() as SpotifyPlaylist & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? `Failed to fetch playlist (${res.status})`);
  }

  return data;
}

/** Format milliseconds → m:ss */
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min      = Math.floor(totalSec / 60);
  const sec      = String(totalSec % 60).padStart(2, '0');
  return `${min}:${sec}`;
}