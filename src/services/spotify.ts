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

  console.log('[spotify] fetchPlaylist start', {
    playlistId,
    tokenPreview: `${accessToken.slice(0, 4)}...${accessToken.slice(-4)}`,
  });

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };
  console.log('[spotify] fetchPlaylist headers', JSON.stringify(headers));

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    { headers, mode: 'cors', cache: 'no-store' }
  );

  if (!res.ok) {
    const responseText = await res.text().catch(() => '');
    let errorBody: unknown = responseText;
    try { errorBody = JSON.parse(responseText); } catch {}
    console.error('[spotify] fetchPlaylist failed', { status: res.status, body: errorBody });
    const e = typeof errorBody === 'object' && errorBody !== null && 'error' in errorBody
      ? (errorBody as { error: { message?: string } }).error
      : null;
    throw new Error(e?.message ?? `Spotify error (HTTP ${res.status})`);
  }

  const playlist = await res.json() as unknown;
  console.log('[spotify] fetchPlaylist response keys', playlist && typeof playlist === 'object' ? Object.keys(playlist) : playlist);
  console.log('[spotify] fetchPlaylist tracks', playlist && typeof playlist === 'object' ? (playlist as any).tracks : undefined);
  const playlistData = playlist as SpotifyPlaylist;
  if (!playlistData.tracks) {
    throw new Error('Spotify returned no track data for this playlist.');
  }

  let offset = 100;
  while (offset < playlist.tracks.total) {
    const pg = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=100`,
      { headers, cache: 'no-store' }
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