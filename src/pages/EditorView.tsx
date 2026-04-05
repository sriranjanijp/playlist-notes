import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlaylist } from '../context/PlaylistContext';
import PlaylistView from '../components/PlaylistView';

function FullPageState({ message, spinner, isError }: {
  message: string; spinner?: boolean; isError?: boolean;
}) {
  return (
    <div className="fullpage-state">
      {spinner && <span className="spinner spinner--lg" />}
      <p className={isError ? 'state-error' : 'state-message'}>{message}</p>
      {isError && (
        <Link to="/" className="btn-primary notfound-btn" style={{ marginTop: '1rem' }}>
          ← Back to Home
        </Link>
      )}
    </div>
  );
}

export default function EditorView() {
  const { sessionId }                            = useParams<{ sessionId: string }>();
  const { session, loading, error, loadSession } = usePlaylist();

  useEffect(() => {
    if (sessionId) loadSession(sessionId);
  }, [sessionId, loadSession]);

  if (loading)  return <FullPageState message="Loading your playlist…" spinner />;
  if (error)    return <FullPageState message={error} isError />;
  if (!session) return null;

  const shareUrl = `${window.location.origin}/view/${sessionId}`;

  return (
    <div className="app-layout">
      <header className="top-bar">
        <Link to="/" className="top-bar-logo">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.42a.625.625 0 0 1-.86.2c-2.36-1.44-5.33-1.77-8.83-.97a.624.624 0 1 1-.28-1.22c3.83-.87 7.1-.5 9.77 1.13.3.18.39.56.2.86zm1.24-2.76a.78.78 0 0 1-1.07.26C14.3 12.18 11 11.7 7.82 12.6a.78.78 0 0 1-.97-.52.78.78 0 0 1 .52-.97c3.58-1.03 7.27-.5 10.06 1.48a.78.78 0 0 1 .26 1.07zm.11-2.87C14.63 8.85 9.87 8.7 7.07 9.56a.937.937 0 1 1-.54-1.8c3.19-.96 8.5-.77 11.84 1.35a.94.94 0 0 1-1.37 1.28z"/>
          </svg>
          Playlist Notes
        </Link>

        <span className="autosave-badge">● Auto-saving</span>
      </header>

      {/* Slim share strip — URL only, no button clutter */}
      <div className="share-strip">
        <span className="share-strip-label">Share link →</span>
        <code className="share-strip-url">{shareUrl}</code>
      </div>

      <main className="main-content">
        <PlaylistView readOnly={false} />
      </main>
    </div>
  );
}