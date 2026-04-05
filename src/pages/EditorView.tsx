import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlaylist } from '../context/PlaylistContext';
import PlaylistView from '../components/PlaylistView';
import type { Session } from '../types';

function buildExportText(session: Session): string {
  const header = `📋 ${session.playlistName}\n${'─'.repeat(40)}\n\n`;

  const body = session.tracks
    .map((track, i) => {
      const note = session.notes[track.id]?.trim();
      const line = `${i + 1}. ${track.name} — ${track.artists}`;
      return note ? `${line}\n   💬 ${note}` : line;
    })
    .join('\n\n');

  const annotated = session.tracks.filter((t) => session.notes[t.id]?.trim()).length;
  const footer    = `\n\n${'─'.repeat(40)}\n${annotated} of ${session.tracks.length} tracks annotated`;

  return header + body + footer;
}

function FullPageState({
  message,
  spinner,
  isError,
}: {
  message: string;
  spinner?: boolean;
  isError?: boolean;
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
  const { sessionId }                                    = useParams<{ sessionId: string }>();
  const { session, loading, error, loadSession }         = usePlaylist();
  const [copied,   setCopied]                            = useState(false);
  const [exported, setExported]                          = useState(false);

  useEffect(() => {
    if (sessionId) loadSession(sessionId);
  }, [sessionId, loadSession]);

  const shareUrl = `${window.location.origin}/view/${sessionId}`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function exportNotes() {
    if (!session) return;
    await navigator.clipboard.writeText(buildExportText(session));
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  if (loading)   return <FullPageState message="Loading your playlist…" spinner />;
  if (error)     return <FullPageState message={error} isError />;
  if (!session)  return null;

  return (
    <div className="app-layout">
      <header className="top-bar">
        <Link to="/" className="top-bar-logo">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.42a.625.625 0 0 1-.86.2c-2.36-1.44-5.33-1.77-8.83-.97a.624.624 0 1 1-.28-1.22c3.83-.87 7.1-.5 9.77 1.13.3.18.39.56.2.86zm1.24-2.76a.78.78 0 0 1-1.07.26C14.3 12.18 11 11.7 7.82 12.6a.78.78 0 0 1-.97-.52.78.78 0 0 1 .52-.97c3.58-1.03 7.27-.5 10.06 1.48a.78.78 0 0 1 .26 1.07zm.11-2.87C14.63 8.85 9.87 8.7 7.07 9.56a.937.937 0 1 1-.54-1.8c3.19-.96 8.5-.77 11.84 1.35a.94.94 0 0 1-1.37 1.28z" />
          </svg>
          Playlist Notes
        </Link>

        <div className="top-bar-actions">
          <span className="autosave-badge">● Auto-saving</span>

          <button className="btn-icon" onClick={exportNotes} title="Export notes to clipboard">
            {exported ? (
              <>✓ Exported!</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" width="15" height="15">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Export
              </>
            )}
          </button>

          <button className="btn-share" onClick={copyLink}>
            {copied ? (
              <>✓ Copied!</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" width="16" height="16">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share
              </>
            )}
          </button>
        </div>
      </header>

      <div className="share-banner">
        <span className="share-banner-label">Shareable link</span>
        <span className="share-banner-url">{shareUrl}</span>
        <button className="share-banner-copy" onClick={copyLink}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <main className="main-content">
        <PlaylistView readOnly={false} />
      </main>
    </div>
  );
}
