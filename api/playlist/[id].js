let tokenCache = { value: null, expiresAt: 0 };

async function getAccessToken() {
  if (tokenCache.value && Date.now() < tokenCache.expiresAt) return tokenCache.value;

  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set in Vercel environment variables.');
  }

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res   = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'grant_type=client_credentials',
  });

  if (!res.ok) {
    const t = await res.text();
    let m = `Token request failed (HTTP ${res.status})`;
    try { m = JSON.parse(t).error_description || m; } catch {}
    throw new Error(m);
  }

  const data = await res.json();
  tokenCache = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return tokenCache.value;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing playlist id' });

  let token;
  try {
    token = await getAccessToken();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  try {
    // No `fields` filter — avoids Spotify's quirky partial-response behaviour
    const plRes = await fetch(
      `https://api.spotify.com/v1/playlists/${id}?market=US`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!plRes.ok) {
      const e = await plRes.json().catch(() => ({}));
      console.error(`[Spotify] playlist/${id} → ${plRes.status}`, e);
      return res.status(plRes.status).json({ error: e.error?.message || `Spotify error (HTTP ${plRes.status})` });
    }

    const playlist = await plRes.json();

    // Guard — if tracks is missing for any reason, return what we have
    if (!playlist.tracks) {
      console.error('[Spotify] Response missing tracks object:', JSON.stringify(playlist).slice(0, 300));
      return res.status(502).json({ error: 'Spotify returned an unexpected response — missing tracks data.' });
    }

    // Page through tracks beyond the first 100
    let offset = 100;
    while (offset < playlist.tracks.total) {
      const pg = await fetch(
        `https://api.spotify.com/v1/playlists/${id}/tracks?offset=${offset}&limit=100&market=US`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!pg.ok) break;
      const pgData = await pg.json();
      playlist.tracks.items.push(...(pgData.items ?? []));
      offset += 100;
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(playlist);

  } catch (err) {
    console.error('[Spotify] Unexpected error:', err);
    return res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
}