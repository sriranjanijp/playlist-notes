import { useCallback, useState } from 'react';
import { formatDuration } from '../services/spotify';
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
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onNoteChange?.(track.id, e.target.value),
    [track.id, onNoteChange]
  );

  const charsLeft = MAX_NOTE_LENGTH - note.length;
  const nearLimit = charsLeft <= 100 && note.length > 0;
  const atLimit   = charsLeft <= 0;

  const embedUrl =
    `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`;

  return (
    <div className="track-row-wrap">
      {/* ── Main row ── */}
      <div className="track-row">
        {/* Track info */}
        <div className="track-info">
          <span className="track-index">{index + 1}</span>

          {/* Preview toggle button */}
          <button
            className={`preview-player${previewOpen ? ' preview-player--playing' : ''}`}
            onClick={() => setPreviewOpen((v) => !v)}
            title={previewOpen ? `Close preview` : `Preview on Spotify`}
            aria-label={previewOpen ? 'Close preview' : 'Open preview'}
          >
            {previewOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" width="11" height="11">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.42a.625.625 0 0 1-.86.2c-2.36-1.44-5.33-1.77-8.83-.97a.624.624 0 1 1-.28-1.22c3.83-.87 7.1-.5 9.77 1.13.3.18.39.56.2.86zm1.24-2.76a.78.78 0 0 1-1.07.26C14.3 12.18 11 11.7 7.82 12.6a.78.78 0 0 1-.97-.52.78.78 0 0 1 .52-.97c3.58-1.03 7.27-.5 10.06 1.48a.78.78 0 0 1 .26 1.07zm.11-2.87C14.63 8.85 9.87 8.7 7.07 9.56a.937.937 0 1 1-.54-1.8c3.19-.96 8.5-.77 11.84 1.35a.94.94 0 0 1-1.37 1.28z"/>
              </svg>
            )}
          </button>

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

        {/* Note field */}
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

      {/* ── Spotify embed — expands below the row ── */}
      {previewOpen && (
        <div className="preview-embed">
          <iframe
            src={embedUrl}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={`Preview: ${track.name}`}
          />
        </div>
      )}
    </div>
  );
}