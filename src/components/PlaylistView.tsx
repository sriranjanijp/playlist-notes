import { useState, useMemo } from 'react';
import PlaylistHeader from './PlaylistHeader';
import TrackRow from './TrackRow';
import { usePlaylist } from '../context/PlaylistContext';

interface PlaylistViewProps {
  readOnly?: boolean;
}

export default function PlaylistView({ readOnly = false }: PlaylistViewProps) {
  const { session, updateNote } = usePlaylist();
  const [search, setSearch]     = useState('');

  if (!session) return null;

  const annotatedCount = useMemo(
    () => Object.values(session.notes).filter((n) => n?.trim()).length,
    [session.notes]
  );

  const filteredTracks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return session.tracks;
    return session.tracks.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.artists.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [session.tracks, search]);

  const handleNoteChange = readOnly
    ? undefined
    : (trackId: string, text: string) => updateNote(session.id, trackId, text);

  return (
    <div className="playlist-view">
      <PlaylistHeader session={session} />

      {/* ── Controls bar ── */}
      <div className="controls-bar">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search tracks or artists…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {!readOnly && (
          <span
            className={`progress-pill${
              annotatedCount === session.tracks.length && session.tracks.length > 0
                ? ' progress-pill--complete'
                : ''
            }`}
          >
            {annotatedCount} / {session.tracks.length} annotated
          </span>
        )}
      </div>

      {/* ── Column labels ── */}
      <div className="track-list-header">
        <span className="col-label col-label--track">
          {search
            ? `${filteredTracks.length} result${filteredTracks.length !== 1 ? 's' : ''}`
            : '# Track'}
        </span>
        <span className="col-label col-label--note">
          {readOnly ? 'Notes' : 'Your Notes'}
        </span>
      </div>

      {/* ── Track list ── */}
      <div className="track-list">
        {filteredTracks.length === 0 ? (
          <div className="no-results">
            <p>No tracks match <em>"{search}"</em></p>
            <button className="no-results-clear" onClick={() => setSearch('')}>
              Clear search
            </button>
          </div>
        ) : (
          filteredTracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              note={session.notes[track.id] ?? ''}
              readOnly={readOnly}
              onNoteChange={handleNoteChange}
              index={session.tracks.indexOf(track)}
            />
          ))
        )}
      </div>
    </div>
  );
}
