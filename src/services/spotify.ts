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

  const headers = new Headers({
    'Authorization': `Bearer ${accessToken}`,
  });

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    { headers }
  );

  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(e.error?.message ?? `Spotify error (HTTP ${res.status})`);
  }

  const playlist = await res.json() as SpotifyPlaylist;

  if (!playlist.tracks) {
    throw new Error('Spotify returned no track data for this playlist.');
  }

  // Page through tracks beyond the first 100
  let offset = 100;
  while (offset < playlist.tracks.total) {
    const pg = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=100`,
      { headers }
    );
    if (!pg.ok) break;
    const pgData = await pg.json() as { items: SpotifyPlaylist['tracks']['items'] };
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