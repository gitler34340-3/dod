import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export type FeedStory = {
  id: string;
  title: string | null;
  caption: string | null;
  mediaUrl: string;
  createdAt: string;
  employee?: { id: string; firstName: string; lastName: string } | null;
  viewsCount?: number;
  reactionsCount?: number;
  viewers?: Array<{ employeeId: string; firstName: string; lastName: string; viewedAt: string }>;
  reactionDetails?: Array<{ employeeId: string; firstName: string; lastName: string; emoji: string; createdAt: string }>;
  viewedByMe?: boolean;
  myReaction?: string | null;
};

const isVideoSource = (url: string) =>
  url.startsWith('data:video/') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

export function StoriesViewerModal({
  open,
  stories,
  initialIndex = 0,
  token,
  isAdmin = false,
  onClose,
}: {
  open: boolean;
  stories: FeedStory[];
  initialIndex?: number;
  token?: string | null;
  isAdmin?: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const holdPauseRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const current = stories[index];
  const currentIsVideo = Boolean(current?.mediaUrl && isVideoSource(current.mediaUrl));
  const reactionOptions = ['🔥', '❤️', '👏', '😎', '🤝'];

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
    setProgress(0);
    setIsPaused(false);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open || !token || !current?.id || current.viewedByMe) return;
    void fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/stories/${current.id}/view`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }, [open, token, current?.id, current?.viewedByMe]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((v) => Math.min(stories.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setIndex((v) => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, stories.length]);

  useEffect(() => {
    if (!open || !current || isPaused || currentIsVideo) return;
    setProgress(0);
    const t = window.setInterval(() => {
      setProgress((p) => {
        const next = p + 2;
        if (next >= 100) {
          window.clearInterval(t);
          setIndex((v) => {
            if (v >= stories.length - 1) {
              onClose();
              return v;
            }
            return v + 1;
          });
          return 0;
        }
        return next;
      });
    }, 120);
    return () => window.clearInterval(t);
  }, [open, index, stories.length, current, isPaused, currentIsVideo, onClose]);

  useEffect(() => {
    if (!open || !current || !currentIsVideo) return;
    setProgress(0);
    const video = videoRef.current;
    if (!video) return;

    if (isPaused) {
      video.pause();
      return;
    }

    void video.play().catch(() => undefined);
  }, [open, current, currentIsVideo, isPaused, index]);

  const bars = useMemo(() => stories.map((s, i) => {
    const w = i < index ? 100 : i === index ? progress : 0;
    return { id: s.id, w };
  }), [index, progress, stories]);

  const pauseByHold = () => {
    holdPauseRef.current = true;
    setIsPaused(true);
  };

  const resumeByHold = () => {
    if (!holdPauseRef.current) return;
    holdPauseRef.current = false;
    setIsPaused(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md h-[100dvh] sm:h-auto overflow-hidden rounded-none sm:rounded-2xl"
        style={{ background: '#0b0b0b', border: '1px solid rgba(255,255,255,0.12)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-3 flex gap-2">
          {bars.map((b) => (
            <div key={b.id} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <div className="h-full" style={{ width: `${b.w}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-hover))' }} />
            </div>
          ))}
        </div>

        <div className="px-4 pb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {current?.title || (current?.employee ? `${current.employee.firstName} ${current.employee.lastName}` : 'История')}
            </div>
            <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {current?.caption || ''}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X className="w-4 h-4" color="white" />
          </button>
        </div>

        {!current ? (
          <div className="flex h-[70dvh] items-center justify-center px-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Сторис не найдены
          </div>
        ) : (
        <div
          className="relative aspect-[9/16] max-h-[calc(100dvh-96px)] sm:max-h-[80vh] bg-black"
          onPointerDown={pauseByHold}
          onPointerUp={resumeByHold}
          onPointerCancel={resumeByHold}
          onPointerLeave={resumeByHold}
        >
          {current?.mediaUrl ? (
            currentIsVideo ? (
              <video
                ref={videoRef}
                src={current.mediaUrl}
                className="absolute inset-0 w-full h-full object-contain"
                playsInline
                controls={false}
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
                  setProgress(Math.min(100, (video.currentTime / video.duration) * 100));
                }}
                onEnded={() => {
                  setIndex((v) => {
                    if (v >= stories.length - 1) {
                      onClose();
                      return v;
                    }
                    return v + 1;
                  });
                }}
              />
            ) : (
              <img src={current.mediaUrl} alt="story" className="absolute inset-0 w-full h-full object-contain" />
            )
          ) : null}

          <button
            type="button"
            className="absolute left-0 top-0 h-full w-1/2 bg-transparent"
            onClick={() => {
              setIndex((v) => Math.max(0, v - 1));
              setProgress(0);
            }}
            aria-label="Предыдущая сторис"
          />
          <button
            type="button"
            className="absolute right-0 top-0 h-full w-1/2 bg-transparent"
            onClick={() => {
              setIndex((v) => {
                if (v >= stories.length - 1) {
                  onClose();
                  return v;
                }
                return v + 1;
              });
              setProgress(0);
            }}
            aria-label="Следующая сторис"
          />

          <button
            type="button"
            onClick={() => setIndex((v) => Math.max(0, v - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            disabled={index === 0}
          >
            <ChevronLeft className="w-5 h-5" color="white" />
          </button>
          <button
            type="button"
            onClick={() =>
              setIndex((v) => {
                if (v >= stories.length - 1) {
                  onClose();
                  return v;
                }
                return v + 1;
              })
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            disabled={index >= stories.length - 1}
          >
            <ChevronRight className="w-5 h-5" color="white" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((v) => !v)}
              className="rounded-full p-2"
              style={{ background: 'rgba(0,0,0,0.42)' }}
              aria-label={isPaused ? 'Продолжить' : 'Пауза'}
            >
              {isPaused ? <Play className="w-4 h-4" color="white" /> : <Pause className="w-4 h-4" color="white" />}
            </button>
            <div className="rounded-full px-3 py-1 text-xs" style={{ background: 'rgba(0,0,0,0.42)', color: 'rgba(255,255,255,0.82)' }}>
              {index + 1}/{stories.length}
            </div>
          </div>

          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-3 py-1"
            style={{ background: 'rgba(0,0,0,0.42)', color: 'rgba(255,255,255,0.9)' }}
          >
            {reactionOptions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="text-base"
                onClick={async () => {
                  if (!token || !current?.id) return;
                  await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/stories/${current.id}/reaction`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ emoji }),
                  }).catch(() => undefined);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        )}

        {isAdmin && current && (
          <div className="p-3 border-t text-xs space-y-2" style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
            <div>
              Просмотры: {current.viewsCount ?? 0} · Реакции: {current.reactionsCount ?? 0}
            </div>
            {current.viewers && current.viewers.length > 0 ? (
              <div className="max-h-16 overflow-auto">
                Смотрели: {current.viewers.map((viewer) => `${viewer.firstName} ${viewer.lastName}`).join(', ')}
              </div>
            ) : null}
            {current.reactionDetails && current.reactionDetails.length > 0 ? (
              <div className="max-h-16 overflow-auto">
                Реакции: {current.reactionDetails.map((reaction) => `${reaction.emoji} ${reaction.firstName} ${reaction.lastName}`).join(', ')}
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </div>
  );
}

