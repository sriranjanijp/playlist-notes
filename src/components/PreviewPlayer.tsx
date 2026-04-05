import { useEffect, useRef, useState } from 'react';

interface PreviewPlayerProps {
  previewUrl: string;
  trackName:  string;
}

type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'unavailable';

export default function PreviewPlayer({ previewUrl, trackName }: PreviewPlayerProps) {
  const audioRef              = useRef<HTMLAudioElement | null>(null);
  const [state, setState]     = useState<PlayerState>(previewUrl ? 'idle' : 'unavailable');
  const [progress, setProgress] = useState(0); // 0–100

  // Re-init when URL changes (different track row)
  useEffect(() => {
    setState(previewUrl ? 'idle' : 'unavailable');
    setProgress(0);

    return () => {
      // Pause on unmount / URL change
      audioRef.current?.pause();
    };
  }, [previewUrl]);

  function toggle() {
    if (state === 'unavailable') return;

    if (!audioRef.current) {
      audioRef.current = new Audio(previewUrl);

      audioRef.current.addEventListener('canplay', () => setState('playing'));
      audioRef.current.addEventListener('waiting',  () => setState('loading'));
      audioRef.current.addEventListener('ended',    () => { setState('idle'); setProgress(0); });
      audioRef.current.addEventListener('error',    () => setState('unavailable'));

      audioRef.current.addEventListener('timeupdate', () => {
        const a = audioRef.current;
        if (a && a.duration) setProgress((a.currentTime / a.duration) * 100);
      });
    }

    if (state === 'playing') {
      audioRef.current.pause();
      setState('paused');
    } else {
      // Pause any other playing audio on the page
      document.querySelectorAll('audio').forEach((a) => {
        if (a !== audioRef.current) a.pause();
      });
      setState('loading');
      audioRef.current.play().catch(() => setState('unavailable'));
    }
  }

  if (state === 'unavailable') {
    return (
      <div className="preview-player preview-player--unavailable" title="No preview available">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          width="13" height="13">
          <line x1="1" y1="1" x2="23" y2="23"/>
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
    );
  }

  return (
    <button
      className={`preview-player ${state === 'playing' ? 'preview-player--playing' : ''}`}
      onClick={toggle}
      title={state === 'playing' ? `Pause preview — ${trackName}` : `Play 30s preview — ${trackName}`}
    >
      {/* Progress ring */}
      <svg className="preview-ring" viewBox="0 0 36 36" width="32" height="32">
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor"
          strokeWidth="2" strokeOpacity="0.15"/>
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke="var(--accent)" strokeWidth="2"
          strokeDasharray={`${2 * Math.PI * 15}`}
          strokeDashoffset={`${2 * Math.PI * 15 * (1 - progress / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
          style={{ transition: 'stroke-dashoffset 0.25s linear' }}
        />
      </svg>

      {/* Icon */}
      <span className="preview-icon">
        {state === 'loading' ? (
          <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
        ) : state === 'playing' ? (
          // Pause bars
          <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
          </svg>
        ) : (
          // Play triangle
          <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        )}
      </span>
    </button>
  );
}
