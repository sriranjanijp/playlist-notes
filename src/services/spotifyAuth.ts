const CLIENT_ID    = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const SCOPES       = 'playlist-read-private playlist-read-collaborative';
const TOKEN_KEY    = 'sn_token';
const VERIFIER_KEY = 'sn_pkce_verifier';

// ── PKCE helpers ───────────────────────────────────────────────────────────────

function generateVerifier(length = 128): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr   = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

async function generateChallenge(verifier: string): Promise<string> {
  const data   = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── Token storage ──────────────────────────────────────────────────────────────

export interface StoredToken {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    number;
}

function saveToken(data: Record<string, unknown>): void {
  // Validate before saving — catches undefined/missing fields early
  if (!data.access_token || typeof data.access_token !== 'string') {
    console.error('[spotifyAuth] saveToken: unexpected response from Spotify:', data);
    throw new Error(
      `Spotify token response missing access_token. Got keys: ${Object.keys(data).join(', ')}`
    );
  }

  const stored: StoredToken = {
    accessToken:  data.access_token,
    refreshToken: (data.refresh_token as string) ?? '',
    expiresAt:    Date.now() + ((data.expires_in as number ?? 3600) - 60) * 1000,
  };

  console.log('[spotifyAuth] Token saved, expires in', Math.round((stored.expiresAt - Date.now()) / 1000), 's');
  localStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
}

export function getStoredToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredToken;

    // Guard: reject tokens where accessToken is missing or not a real string
    if (!stored.accessToken || stored.accessToken === 'undefined') {
      console.warn('[spotifyAuth] Stored token has invalid accessToken — clearing');
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    if (Date.now() > stored.expiresAt) {
      console.warn('[spotifyAuth] Token expired — clearing');
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}

// ── Auth flow ──────────────────────────────────────────────────────────────────

export async function initiateSpotifyAuth(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error('VITE_SPOTIFY_CLIENT_ID is not set. Add it to your Vercel environment variables.');
  }

  const verifier    = generateVerifier();
  const challenge   = await generateChallenge(verifier);
  const redirectUri = `${window.location.origin}/`;

  localStorage.setItem(VERIFIER_KEY, verifier);
  console.log('[spotifyAuth] Starting PKCE flow, redirect:', redirectUri);

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          redirectUri,
    scope:                 SCOPES,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function handleAuthCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code   = params.get('code');
  const error  = params.get('error');

  if (code || error) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (error) throw new Error(`Spotify auth denied: ${error}`);
  if (!code)  return false;

  console.log('[spotifyAuth] Handling callback, code length:', code.length);

  const verifier    = localStorage.getItem(VERIFIER_KEY);
  const redirectUri = `${window.location.origin}/`;

  if (!verifier) throw new Error('PKCE verifier missing — please try connecting again.');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      code_verifier: verifier,
    }),
  });

  // Read body once
  const responseData = await res.json().catch(() => ({})) as Record<string, unknown>;
  console.log('[spotifyAuth] Token exchange status:', res.status, 'keys:', Object.keys(responseData));

  if (!res.ok) {
    throw new Error(
      (responseData.error_description as string) ??
      (responseData.error as string) ??
      `Token exchange failed (HTTP ${res.status})`
    );
  }

  saveToken(responseData);
  localStorage.removeItem(VERIFIER_KEY);
  return true;
}