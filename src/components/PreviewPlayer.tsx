import { useState } from 'react';

interface PreviewPlayerProps {
  trackId:   string;
  trackName: string;
}

export default function PreviewPlayer({ trackId, trackName }: PreviewPlayerProps) {
  const [open, setOpen] = useState(false);

  const embedUrl =
    `https://open.spotify.com/embed/track/${trackId}` +
    `?utm_source=generator&theme=0`;

  return (
    <div className="preview-wrap">
      <button
        className={`preview-player${open ? ' preview-player--playing' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title={open ? `Close preview — ${trackName}` : `Preview — ${trackName}`}
        aria-label={open ? 'Close preview' : 'Open preview'}
      >
        {open ? (
          /* X / close */
          <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          /* Spotify logo mark */
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.42a.625.625 0 0 1-.86.2c-2.36-1.44-5.33-1.77-8.83-.97a.624.624 0 1 1-.28-1.22c3.83-.87 7.1-.5 9.77 1.13.3.18.39.56.2.86zm1.24-2.76a.78.78 0 0 1-1.07.26C14.3 12.18 11 11.7 7.82 12.6a.78.78 0 0 1-.97-.52.78.78 0 0 1 .52-.97c3.58-1.03 7.27-.5 10.06 1.48a.78.78 0 0 1 .26 1.07zm.11-2.87C14.63 8.85 9.87 8.7 7.07 9.56a.937.937 0 1 1-.54-1.8c3.19-.96 8.5-.77 11.84 1.35a.94.94 0 0 1-1.37 1.28z"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="preview-embed">
          <iframe
            src={embedUrl}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={`Preview: ${trackName}`}
          />
        </div>
      )}
    </div>
  );
}