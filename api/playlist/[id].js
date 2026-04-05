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
      'Add them in Vercel → Project Settings → Environment Variables, then redeploy.'
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
    try { const j = JSON.parse(text); msg = j.error_description || j.error || msg; } catch { }
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
    // Fetch without `fields` filter — avoids 403s on certain playlist types
    // and Spotify's field-filtering quirks. We only store what we need in Firestore.
    const playlistRes = await fetch(
      `https://api.spotify.com/v1/playlists/${id}?market=US`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Log the full error body to Vercel function logs for easier debugging
    if (!playlistRes.ok) {
      const errText = await playlistRes.text();
      console.error(`[Spotify] GET /playlists/${id} → ${playlistRes.status}:`, errText);
      let errMsg = `Playlist not found (HTTP ${playlistRes.status})`;
      try { errMsg = JSON.parse(errText).error?.message || errMsg; } catch { }
      return res.status(playlistRes.status).json({ error: errMsg });
    }

    const playlist = await playlistRes.json();

    // Page through tracks beyond the first 100
    const total = playlist.tracks.total;
    let offset = 100;
    while (offset < total) {
      const pageRes = await fetch(
        `https://api.spotify.com/v1/playlists/${id}/tracks?offset=${offset}&limit=100&market=US`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!pageRes.ok) break; // partial playlist is better than nothing
      const page = await pageRes.json();
      playlist.tracks.items.push(...page.items);
      offset += 100;
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(playlist);

  } catch (err) {
    console.error('[Spotify] Unexpected error:', err);
    return res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
}