import { useCallback } from 'react';
import { formatDuration } from '../services/spotify';
import type { Track } from '../types';

const MAX_NOTE_LENGTH = 280;

interface TrackRowProps {
  track:        Track;
  note:         string;
  readOnly:     boolean;
  index:        number;
  onNoteChange?: (trackId: string, text: string) => void;
}

export default function TrackRow({
  track,
  note = '',
  readOnly,
  onNoteChange,
  index,
}: TrackRowProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onNoteChange?.(track.id, e.target.value),
    [track.id, onNoteChange]
  );

  const charsLeft = MAX_NOTE_LENGTH - note.length;
  const nearLimit = charsLeft <= 40 && note.length > 0;
  const atLimit   = charsLeft <= 0;

  return (
    <div className="track-row">
      {/* ── Track info ── */}
      <div className="track-info">
        <span className="track-index">{index + 1}</span>

        {track.albumArt ? (
          <img src={track.albumArt} alt={track.album} className="track-art" />
        ) : (
          <div className="track-art track-art--placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3zm0 16a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm-1-9v4l3.5 2-1 1.73L9 16V9h2z" />
            </svg>
          </div>
        )}

        <div className="track-meta">
          <span className="track-name">{track.name}</span>
          <span className="track-artist">{track.artists}</span>
        </div>

        <span className="track-duration">{formatDuration(track.duration)}</span>
      </div>

      {/* ── Note field ── */}
      <div className="note-field">
        {readOnly ? (
          <p className={`note-display ${!note ? 'note-display--empty' : ''}`}>
            {note || 'No note added'}
          </p>
        ) : (
          <div className="note-field-inner">
            <textarea
              className={`note-textarea${atLimit ? ' note-textarea--limit' : ''}`}
              value={note}
              onChange={handleChange}
              placeholder="Add a note for this track…"
              rows={2}
              maxLength={MAX_NOTE_LENGTH}
            />
            {note.length > 0 && (
              <span
                className={`char-count${nearLimit ? ' char-count--warn' : ''}${atLimit ? ' char-count--limit' : ''}`}
              >
                {charsLeft}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
