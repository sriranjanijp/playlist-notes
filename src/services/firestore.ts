import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  FirestoreError,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Session, Track, SpotifyPlaylist, SpotifyPlaylistItem } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateSessionId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

function normaliseTrack(item: SpotifyPlaylistItem): Track | null {
  const track = item?.track;
  if (!track?.id) return null;
  return {
    id:       track.id,
    name:     track.name,
    artists:  track.artists.map((a) => a.name).join(', '),
    album:    track.album.name,
    albumArt: track.album.images[2]?.url ?? track.album.images[0]?.url ?? '',
    duration: track.duration_ms,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function createSession(spotifyPlaylist: SpotifyPlaylist): Promise<string> {
  const id = generateSessionId();

  const tracks: Track[] = spotifyPlaylist.tracks.items
    .map(normaliseTrack)
    .filter((t): t is Track => t !== null);

  await setDoc(doc(db, 'sessions', id), {
    playlistId:    spotifyPlaylist.id,
    playlistName:  spotifyPlaylist.name,
    playlistImage: spotifyPlaylist.images[0]?.url ?? '',
    ownerName:     spotifyPlaylist.owner.display_name ?? '',
    tracks,
    notes:         {} as Record<string, string>,
    createdAt:     serverTimestamp(),
  });

  return id;
}

export function subscribeToSession(
  sessionId: string,
  onData: (session: Session) => void,
  onError: (error: Error) => void
): () => void {
  const ref = doc(db, 'sessions', sessionId);

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onError(new Error('Session not found. The link may be invalid.'));
        return;
      }
      onData({ id: snap.id, ...(snap.data() as Omit<Session, 'id'>) });
    },
    (err: FirestoreError) => {
      console.error('[Firestore]', err);
      onError(err);
    }
  );
}

export async function saveNote(
  sessionId: string,
  trackId: string,
  text: string
): Promise<void> {
  await updateDoc(doc(db, 'sessions', sessionId), {
    [`notes.${trackId}`]: text,
  });
}