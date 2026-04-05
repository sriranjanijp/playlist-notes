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
 * Fetch a playlist from our Vercel serverless function / local Express proxy.
 * Handles non-JSON responses gracefully so users see a real error message.
 */
export async function fetchPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
  let res: Response;

  try {
    res = await fetch(`/api/playlist/${playlistId}`);
  } catch {
    throw new Error('Network error — could not reach the server. Check your connection.');
  }

  const contentType = res.headers.get('content-type') ?? '';

  // If the server returned HTML (Vercel error page, function crash, wrong route),
  // extract readable text instead of letting JSON.parse blow up.
  if (!contentType.includes('application/json')) {
    const raw = await res.text();
    const preview = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
    throw new Error(
      `Unexpected response from server (HTTP ${res.status}).\n` +
      `Expected JSON but got: ${contentType || 'unknown content type'}.\n\n` +
      `This usually means the serverless function crashed or env vars are missing.\n` +
      `Raw preview: ${preview}`
    );
  }

  const data = await res.json() as SpotifyPlaylist & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? `Spotify API error (HTTP ${res.status})`);
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