// api/playlist/[id].js
// Vercel serverless function — runs server-side, keeps Spotify secret off the client.
// Replaces server/index.js for production. The Express server is still useful for
// local dev if you prefer, but this file takes over on Vercel.

let tokenCache = { value: null, expiresAt: 0 };

async function getAccessToken() {
  if (tokenCache.value && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value;
  }

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error_description || 'Failed to get Spotify token');
  }

  const data = await res.json();
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return tokenCache.value;
}

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing playlist id' });
  }

  try {
    const token = await getAccessToken();

    const fields = [
      'id', 'name', 'description', 'images',
      'owner.display_name',
      'tracks.total',
      'tracks.items(track(id,name,duration_ms,artists(name),album(name,images)))',
    ].join(',');

    const playlistRes = await fetch(
      `https://api.spotify.com/v1/playlists/${id}?fields=${encodeURIComponent(fields)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!playlistRes.ok) {
      const err = await playlistRes.json();
      return res
        .status(playlistRes.status)
        .json({ error: err.error?.message || 'Playlist not found' });
    }

    const playlist = await playlistRes.json();

    // Page through tracks if playlist has more than 100
    const total = playlist.tracks.total;
    if (total > 100) {
      let offset = 100;
      while (offset < total) {
        const pageRes = await fetch(
          `https://api.spotify.com/v1/playlists/${id}/tracks?offset=${offset}&limit=100` +
          `&fields=items(track(id,name,duration_ms,artists(name),album(name,images)))`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const page = await pageRes.json();
        playlist.tracks.items.push(...page.items);
        offset += 100;
      }
    }

    // Cache the response at the CDN edge for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(playlist);
  } catch (err) {
    console.error('[Spotify]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
