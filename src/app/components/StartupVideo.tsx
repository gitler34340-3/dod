import { useEffect, useRef, useState } from 'react';
import introVideoUrl from '../../../assets_sound_and_start_video/заставка.mp4';
import { useAuth } from '@/app/contexts/AuthContext';

const INTRO_STORAGE_KEY = 'dodoGuestStartupVideoPlayed';

function hasIntroPlayed() {
  try {
    return sessionStorage.getItem(INTRO_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function markIntroPlayed() {
  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
  } catch {
    // Session storage can be unavailable in strict browser modes.
  }
}

export function StartupVideo() {
  const { session, isReady } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const closeIntro = () => {
    markIntroPlayed();
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 420);
  };

  useEffect(() => {
    if (!isReady || session || hasIntroPlayed()) {
      setVisible(false);
      return;
    }

    setVisible(true);
  }, [isReady, session]);

  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    void video.play().catch(() => {
      closeIntro();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`startup-video ${leaving ? 'startup-video--leaving' : ''}`}>
      <video
        ref={videoRef}
        src={introVideoUrl}
        className="startup-video__media"
        autoPlay
        preload="auto"
        muted
        playsInline
        onEnded={closeIntro}
      />
      <div className="startup-video__shade" />
    </div>
  );
}
