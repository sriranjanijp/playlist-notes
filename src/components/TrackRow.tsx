import { useCallback } from 'react';
import { formatDuration } from '../services/spotify';
import PreviewPlayer from './PreviewPlayer';
import type { Track } from '../types';

const MAX_NOTE_LENGTH = 2000;

interface TrackRowProps {
  track:         Track;
  note:          string;
  readOnly:      boolean;
  index:         number;
  onNoteChange?: (trackId: string, text: string) => void;
}

export default function TrackRow({ track, note = '', readOnly, onNoteChange, index }: TrackRowProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onNoteChange?.(track.id, e.target.value),
    [track.id, onNoteChange]
  );

  const charsLeft = MAX_NOTE_LENGTH - note.length;
  const nearLimit = charsLeft <= 100 && note.length > 0;
  const atLimit   = charsLeft <= 0;

  return (
    <div className="track-row">
      {/* ── Track info ── */}
      <div className="track-info">
        <span className="track-index">{index + 1}</span>

        <PreviewPlayer previewUrl={track.previewUrl} trackName={track.name} />

        {track.albumArt ? (
          <img src={track.albumArt} alt={track.album} className="track-art" />
        ) : (
          <div className="track-art track-art--placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
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
          <p className={`note-display${!note ? ' note-display--empty' : ''}`}>
            {note || 'No note added'}
          </p>
        ) : (
          <div className="note-field-inner">
            <textarea
              className={`note-textarea${atLimit ? ' note-textarea--limit' : ''}`}
              value={note}
              onChange={handleChange}
              placeholder="Add a note for this track…"
              rows={3}
              maxLength={MAX_NOTE_LENGTH}
            />
            {nearLimit && (
              <span className={`char-count${atLimit ? ' char-count--limit' : ' char-count--warn'}`}>
                {charsLeft}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}