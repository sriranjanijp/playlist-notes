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

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${accessToken}`);

  console.log('[spotify] fetchPlaylist headers', { Authorization: `Bearer ${accessToken.slice(0, 4)}...` });

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    { headers, mode: 'cors', cache: 'no-store' }
  );

  if (!res.ok) {
    const responseText = await res.text().catch(() => '');
    let errorBody: any = responseText;
    try { errorBody = JSON.parse(responseText); } catch {}
    console.error('[spotify] fetchPlaylist failed', { status: res.status, body: errorBody });
    const e = errorBody?.error;
    throw new Error(e?.message ?? `Spotify error (HTTP ${res.status})`);
  }
  const playlistJson = await res.json();
  const playlistData = playlistJson as any;

  // Robustly handle different response formats
  if (!playlistData.tracks && playlistData.items) {
    console.log('[spotify] fetchPlaylist: found items instead of tracks at root');
    
    if (Array.isArray(playlistData.items)) {
      playlistData.tracks = {
        items: playlistData.items,
        total: playlistData.total ?? playlistData.items.length,
      };
    } else if (playlistData.items && typeof playlistData.items === 'object') {
      if (Array.isArray(playlistData.items.items)) {
        playlistData.tracks = playlistData.items;
      }
    }
  }

  if (!playlistData.tracks) {
    console.warn('[spotify] fetchPlaylist missing tracks, using /tracks fallback');
    const fallback = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
      { headers, cache: 'no-store' }
    );

    if (!fallback.ok) {
      const errorBody = await fallback.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(errorBody.error?.message ?? `Spotify tracks fallback failed (HTTP ${fallback.status})`);
    }

    const fallbackData = await fallback.json() as { items: SpotifyPlaylist['tracks']['items']; total: number; next?: string };
    playlistData.tracks = {
      items: fallbackData.items ?? [],
      total: fallbackData.total,
    };
  }

  // Fetch remaining pages if needed
  let items = playlistData.tracks.items ?? [];
  let offset = items.length;
  const total = playlistData.tracks.total ?? items.length;

  while (offset < total) {
    console.log(`[spotify] fetchPlaylist fetching page: offset ${offset}/${total}`);
    const pg = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=100`,
      { headers, cache: 'no-store' }
    );
    if (!pg.ok) break;
    const pgData = await pg.json() as { items: SpotifyPlaylist['tracks']['items'] };
    if (!pgData.items || pgData.items.length === 0) break;
    items.push(...pgData.items);
    offset += pgData.items.length;
  }

  playlistData.tracks.items = items;
  return playlistData as SpotifyPlaylist;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min      = Math.floor(totalSec / 60);
  const sec      = String(totalSec % 60).padStart(2, '0');
  return `${min}:${sec}`;
}