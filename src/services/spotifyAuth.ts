/**
 * Spotify PKCE Authorization Code Flow.
 *
 * The client ID is safe to ship in frontend code.
 * The client secret is never used — PKCE replaces it.
 *
 * Flow:
 *   1. initiateSpotifyAuth()  → redirects to Spotify login
 *   2. handleAuthCallback()   → call on page load if ?code= is in URL
 *                               exchanges code for token, clears URL
 *   3. getStoredToken()       → returns token if valid, null if expired/missing
 */

const CLIENT_ID   = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const SCOPES      = 'playlist-read-private playlist-read-collaborative';
const TOKEN_KEY   = 'sn_token';
const VERIFIER_KEY = 'sn_pkce_verifier';

// ── PKCE helpers ───────────────────────────────────────────────────────────────

function generateVerifier(length = 128): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr   = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

async function generateChallenge(verifier: string): Promise<string> {
  const data    = new TextEncoder().encode(verifier);
  const digest  = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── Token storage ──────────────────────────────────────────────────────────────

interface StoredToken {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    number;
}

function saveToken(data: { access_token: string; refresh_token: string; expires_in: number }) {
  const stored: StoredToken = {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    Date.now() + (data.expires_in - 60) * 1000,
  };
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
}

export function getStoredToken(): StoredToken | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const stored: StoredToken = JSON.parse(raw);
    if (Date.now() > stored.expiresAt) return null; // expired
    return stored;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
}

// ── Auth flow ──────────────────────────────────────────────────────────────────

export async function initiateSpotifyAuth(): Promise<void> {
  const verifier   = generateVerifier();
  const challenge  = await generateChallenge(verifier);
  const redirectUri = `${window.location.origin}/`;

  sessionStorage.setItem(VERIFIER_KEY, verifier);

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

/**
 * Call on every page load.
 * If the URL contains ?code=..., exchanges it for a token and cleans the URL.
 * Returns true if a token was obtained.
 */
export async function handleAuthCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code   = params.get('code');
  const error  = params.get('error');

  // Clean the URL regardless
  if (code || error) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (error) throw new Error(`Spotify auth denied: ${error}`);
  if (!code) return false;

  const verifier    = sessionStorage.getItem(VERIFIER_KEY);
  const redirectUri = `${window.location.origin}/`;

  if (!verifier) throw new Error('PKCE verifier missing — please try connecting again.');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error_description ?? `Token exchange failed (HTTP ${res.status})`);
  }

  saveToken(await res.json());
  sessionStorage.removeItem(VERIFIER_KEY);
  return true;
}
