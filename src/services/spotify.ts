import type { SpotifyPlaylist } from '../types';

export function parsePlaylistId(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/playlist\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[A-Za-z0-9]{22}$/.test(trimmed)) return trimmed;
  return null;
}

export async function fetchPlaylist(playlistId: string, accessToken: string): Promise<SpotifyPlaylist> {
  if (!accessToken) {
    throw new Error('No access token — please reconnect to Spotify.');
  }

  const res = await fetch(
    `/api/playlist/${playlistId}`,
    { cache: 'no-store' }
  );

  const body = await res.json().catch(() => ({})) as SpotifyPlaylist | { error?: string };

  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? `Playlist fetch failed (HTTP ${res.status})`);
  }

  const playlist = body as SpotifyPlaylist;
  if (!playlist.tracks) {
    throw new Error('Spotify returned no track data for this playlist.');
  }

  return playlist;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min      = Math.floor(totalSec / 60);
  const sec      = String(totalSec % 60).padStart(2, '0');
  return `${min}:${sec}`;
}