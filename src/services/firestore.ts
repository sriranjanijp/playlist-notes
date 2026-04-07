import {
  doc, setDoc, updateDoc, onSnapshot, serverTimestamp, FirestoreError,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Session, Track, SpotifyPlaylist } from '../types';

function generateSessionId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

function normaliseTrack(item: any): Track | null {
  if (!item) return null;

  // Some Spotify API versions/proxies use item.track, item.item, or the item itself.
  const track = item.track || item.item || item;

  if (!track?.id || !track.name) return null;

  return {
    id:         track.id,
    name:       track.name,
    artists:    Array.isArray(track.artists) ? track.artists.map((a: any) => a.name).join(', ') : '',
    album:      track.album?.name ?? 'Unknown Album',
    albumArt:   track.album?.images?.[2]?.url ?? track.album?.images?.[0]?.url ?? '',
    duration:   track.duration_ms ?? 0,
    previewUrl: track.preview_url ?? '',
  };
}

export async function createSession(playlist: SpotifyPlaylist): Promise<string> {
  const id = generateSessionId();

  const tracks: Track[] = playlist.tracks.items
    .map(normaliseTrack)
    .filter((t): t is Track => t !== null);

  await setDoc(doc(db, 'sessions', id), {
    playlistId:    playlist.id,
    playlistName:  playlist.name,
    playlistImage: playlist.images[0]?.url ?? '',
    ownerName:     playlist.owner.display_name ?? '',
    tracks,
    notes:         {} as Record<string, string>,
    createdAt:     serverTimestamp(),
  });
  return id;
}

export function subscribeToSession(
  sessionId: string,
  onData:    (session: Session) => void,
  onError:   (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'sessions', sessionId),
    (snap) => {
      if (!snap.exists()) { onError(new Error('Session not found. The link may be invalid.')); return; }
      onData({ id: snap.id, ...(snap.data() as Omit<Session, 'id'>) });
    },
    (err: FirestoreError) => { console.error('[Firestore]', err); onError(err); }
  );
}

export async function saveNote(sessionId: string, trackId: string, text: string): Promise<void> {
  await updateDoc(doc(db, 'sessions', sessionId), { [`notes.${trackId}`]: text });
}