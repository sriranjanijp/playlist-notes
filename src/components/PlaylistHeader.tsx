import type { Session } from '../types';

interface PlaylistHeaderProps {
  session: Session;
}

export default function PlaylistHeader({ session }: PlaylistHeaderProps) {
  return (
    <div className="playlist-header">
      {session.playlistImage ? (
        <img
          src={session.playlistImage}
          alt={session.playlistName}
          className="playlist-cover"
        />
      ) : (
        <div className="playlist-cover playlist-cover--placeholder">
          <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
          </svg>
        </div>
      )}

      <div className="playlist-header-meta">
        <span className="playlist-label">Playlist</span>
        <h1 className="playlist-title">{session.playlistName}</h1>
        {session.ownerName && (
          <p className="playlist-owner">by {session.ownerName}</p>
        )}
        <p className="playlist-count">
          {session.tracks.length} track{session.tracks.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
