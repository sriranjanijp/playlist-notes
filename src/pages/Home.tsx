import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  initiateSpotifyAuth,
  handleAuthCallback,
  getStoredToken,
  clearToken,
} from '../services/spotifyAuth';
import { parsePlaylistId, fetchPlaylist } from '../services/spotify';
import { createSession } from '../services/firestore';

type Status = 'checking' | 'unauthenticated' | 'authenticated' | 'loading' | 'error';

export default function Home() {
  const [status,   setStatus]   = useState<Status>('checking');
  const [input,    setInput]    = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      try {
        // Always try to handle callback first — this stores the token
        const wasCallback = await handleAuthCallback();

        if (wasCallback) {
          // Token was just saved from OAuth — verify it's readable
          const token = getStoredToken();
          if (token) {
            setStatus('authenticated');
          } else {
            // handleAuthCallback succeeded but token didn't persist
            // This can happen if sessionStorage is blocked (private browsing, etc.)
            setErrorMsg(
              'Token could not be saved. If you\'re in private/incognito mode, ' +
              'try a regular browser window.'
            );
            setStatus('unauthenticated');
          }
          return;
        }

        const token = getStoredToken();
        setStatus(token ? 'authenticated' : 'unauthenticated');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Auth error');
        setStatus('unauthenticated');
      }
    }
    init();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const token = getStoredToken();

    if (!token) {
      // Token expired or missing — prompt re-auth instead of silently failing
      setStatus('unauthenticated');
      setErrorMsg('Your Spotify session expired. Please reconnect.');
      return;
    }

    const playlistId = parsePlaylistId(input);
    if (!playlistId) {
      setErrorMsg('Please enter a valid Spotify playlist URL or ID.');
      return;
    }

    setStatus('loading');
    try {
      const playlist  = await fetchPlaylist(playlistId, token.accessToken);
      const sessionId = await createSession(playlist);
      navigate(`/edit/${sessionId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      // If Spotify says 401, the token is bad — force re-auth
      if (msg.includes('401') || msg.toLowerCase().includes('token')) {
        clearToken();
        setStatus('unauthenticated');
        setErrorMsg('Spotify session expired. Please reconnect.');
      } else {
        setStatus('error');
        setErrorMsg(msg);
      }
    }
  }

  function disconnect() {
    clearToken();
    setStatus('unauthenticated');
    setInput('');
    setErrorMsg('');
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (status === 'checking') {
    return (
      <div className="home-page">
        <div className="home-card">
          <div className="home-logo"><SpotifyIcon /><span>Playlist Notes</span></div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
            <span className="spinner spinner--lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-card">
        <div className="home-logo"><SpotifyIcon /><span>Playlist Notes</span></div>

        <h1 className="home-title">Annotate any Spotify playlist</h1>
        <p className="home-subtitle">
          Add notes to each track and share a read-only link with anyone.
        </p>

        {status === 'unauthenticated' ? (
          <div className="connect-section">
            {errorMsg && (
              <p className="form-error" style={{ marginBottom: '1rem', textAlign: 'center' }}>
                {errorMsg}
              </p>
            )}
            <button className="btn-spotify" onClick={initiateSpotifyAuth}>
              <SpotifyIcon size={20} />
              Connect with Spotify
            </button>
            <p className="home-hint" style={{ marginTop: '1rem' }}>
              We only request read access to your playlists.
            </p>
          </div>
        ) : (
          <form className="home-form" onSubmit={handleCreate}>
            <div className="connected-badge">
              <SpotifyIcon size={14} color="var(--accent)" />
              <span>Connected to Spotify</span>
              <button type="button" className="disconnect-btn" onClick={disconnect}>
                Disconnect
              </button>
            </div>

            <label className="form-label" htmlFor="playlist-input">
              Spotify playlist URL or ID
            </label>
            <input
              id="playlist-input"
              className={`form-input${errorMsg ? ' form-input--error' : ''}`}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setErrorMsg(''); }}
              placeholder="https://open.spotify.com/playlist/…"
              disabled={status === 'loading'}
              autoFocus
            />
            {errorMsg && <p className="form-error">{errorMsg}</p>}

            <button
              className="btn-primary"
              type="submit"
              disabled={status === 'loading' || !input.trim()}
            >
              {status === 'loading'
                ? <><span className="spinner" />Loading playlist…</>
                : 'Create Notes Session →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function SpotifyIcon({ size = 32, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={color} width={size} height={size}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.42a.625.625 0 0 1-.86.2c-2.36-1.44-5.33-1.77-8.83-.97a.624.624 0 1 1-.28-1.22c3.83-.87 7.1-.5 9.77 1.13.3.18.39.56.2.86zm1.24-2.76a.78.78 0 0 1-1.07.26C14.3 12.18 11 11.7 7.82 12.6a.78.78 0 0 1-.97-.52.78.78 0 0 1 .52-.97c3.58-1.03 7.27-.5 10.06 1.48a.78.78 0 0 1 .26 1.07zm.11-2.87C14.63 8.85 9.87 8.7 7.07 9.56a.937.937 0 1 1-.54-1.8c3.19-.96 8.5-.77 11.84 1.35a.94.94 0 0 1-1.37 1.28z"/>
    </svg>
  );
}