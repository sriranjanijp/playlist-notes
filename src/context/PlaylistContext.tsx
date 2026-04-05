import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { subscribeToSession, saveNote } from '../services/firestore';
import type { Session, PlaylistContextValue } from '../types';

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const unsubRef      = useRef<(() => void) | null>(null);
  const debounceRef   = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadSession = useCallback((sessionId: string) => {
    setLoading(true);
    setError(null);

    unsubRef.current?.();
    unsubRef.current = null;

    const unsub = subscribeToSession(
      sessionId,
      (data) => {
        setSession(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;
  }, []);

  const updateNote = useCallback(
    (sessionId: string, trackId: string, text: string) => {
      // Optimistic local update
      setSession((prev) =>
        prev ? { ...prev, notes: { ...prev.notes, [trackId]: text } } : prev
      );

      // Debounced Firestore write
      clearTimeout(debounceRef.current[trackId]);
      debounceRef.current[trackId] = setTimeout(() => {
        saveNote(sessionId, trackId, text).catch((err: unknown) =>
          console.error('[saveNote]', err)
        );
      }, 500);
    },
    []
  );

  useEffect(() => {
    return () => {
      unsubRef.current?.();
      Object.values(debounceRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <PlaylistContext.Provider value={{ session, loading, error, loadSession, updateNote }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist(): PlaylistContextValue {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error('usePlaylist must be used inside <PlaylistProvider>');
  return ctx;
}
