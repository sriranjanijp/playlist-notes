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
          Playlist Notes
        </Link>

        <span className="autosave-badge">● Auto-saving</span>
      </header>

      <div className="share-strip">
        <span className="share-strip-label">Share link → </span>
        <code className="share-strip-url">{shareUrl}</code>
      </div>

      <main className="main-content">
        <PlaylistView readOnly={false} />
      </main>
    </div>
  );
}