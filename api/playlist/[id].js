// api/playlist/[id].js  — Vercel serverless function

let tokenCache = { value: null, expiresAt: 0 };

async function getAccessToken() {
  if (tokenCache.value && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value;
  }

  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is not set. ' +
      'Add them in Vercel → Project Settings → Environment Variables, ' +
      'then redeploy.'
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Spotify token request failed (HTTP ${res.status})`;
    try {
      const json = JSON.parse(text);
      msg = json.error_description || json.error || msg;
    } catch { /* keep default */ }
    throw new Error(msg);
  }

  const data = await res.json();
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return tokenCache.value;
}

export default async function handler(req, res) {
  // Always return JSON — never let an unhandled error return HTML
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing playlist id' });
  }

  let token;
  try {
    token = await getAccessToken();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  try {
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
      const errData = await playlistRes.json().catch(() => ({}));
      return res
        .status(playlistRes.status)
        .json({ error: errData.error?.message || `Playlist not found (HTTP ${playlistRes.status})` });
    }

    const playlist = await playlistRes.json();

    // Page through tracks beyond the first 100
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

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(playlist);

  } catch (err) {
    return res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
}