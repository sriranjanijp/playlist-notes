import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parsePlaylistId, fetchPlaylist } from '../services/spotify';
import { createSession } from '../services/firestore';

type Status = 'idle' | 'loading' | 'error';

export default function Home() {
  const [input,    setInput]    = useState('');
  const [status,   setStatus]   = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const playlistId = parsePlaylistId(input);
    if (!playlistId) {
      setErrorMsg('Please enter a valid Spotify playlist URL or ID.');
      return;
    }

    setStatus('loading');

    try {
      const playlist  = await fetchPlaylist(playlistId);
      const sessionId = await createSession(playlist);
      navigate(`/edit/${sessionId}`);
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  }

  const isLoading = status === 'loading';

  return (
    <div className="home-page">
      <div className="home-card">
        <div className="home-logo">
          <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.42a.625.625 0 0 1-.86.2c-2.36-1.44-5.33-1.77-8.83-.97a.624.624 0 1 1-.28-1.22c3.83-.87 7.1-.5 9.77 1.13.3.18.39.56.2.86zm1.24-2.76a.78.78 0 0 1-1.07.26C14.3 12.18 11 11.7 7.82 12.6a.78.78 0 0 1-.97-.52.78.78 0 0 1 .52-.97c3.58-1.03 7.27-.5 10.06 1.48a.78.78 0 0 1 .26 1.07zm.11-2.87C14.63 8.85 9.87 8.7 7.07 9.56a.937.937 0 1 1-.54-1.8c3.19-.96 8.5-.77 11.84 1.35a.94.94 0 0 1-1.37 1.28z" />
          </svg>
          <span>Playlist Notes</span>
        </div>

        <h1 className="home-title">Annotate any Spotify playlist</h1>
        <p className="home-subtitle">
          Add notes to each track and share a read-only link with anyone.
        </p>

        <form className="home-form" onSubmit={handleCreate}>
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
            disabled={isLoading}
            autoFocus
          />
          {errorMsg && <p className="form-error">{errorMsg}</p>}

          <button className="btn-primary" type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <><span className="spinner" />Creating session…</>
            ) : (
              'Create Notes Session →'
            )}
          </button>
        </form>

        <p className="home-hint">
          Only <strong>public</strong> playlists are supported.
          Copy the link from Spotify's share menu.
        </p>
      </div>
    </div>
  );
}
