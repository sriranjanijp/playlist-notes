import type { Timestamp } from 'firebase/firestore';

// ── Domain models ──────────────────────────────────────────────────────────────

export interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt: string;
  duration: number; // milliseconds
}

/** A session document as stored in Firestore (+ the doc id injected client-side) */
export interface Session {
  id: string;
  playlistId: string;
  playlistName: string;
  playlistImage: string;
  ownerName: string;
  tracks: Track[];
  notes: Record<string, string>; // trackId → note text
  createdAt?: Timestamp;
}

// ── Spotify API response shapes ────────────────────────────────────────────────

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyArtist {
  name: string;
}

export interface SpotifyAlbum {
  name: string;
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

export interface SpotifyPlaylistItem {
  track: SpotifyTrack | null; // null for local files / unavailable tracks
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  owner: { display_name: string };
  tracks: {
    total: number;
    items: SpotifyPlaylistItem[];
  };
}

// ── Context ────────────────────────────────────────────────────────────────────

export interface PlaylistContextValue {
  session: Session | null;
  loading: boolean;
  error: string | null;
  loadSession: (sessionId: string) => void;
  updateNote: (sessionId: string, trackId: string, text: string) => void;
}