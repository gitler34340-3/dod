import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export type FeedStory = {
  id: string;
  title: string | null;
  caption: string | null;
  mediaUrl: string;
  createdAt: string;
  employee?: { id: string; firstName: string; lastName: string } | null;
};

export function StoriesViewerModal({
  open,
  stories,
  initialIndex = 0,
  onClose,
}: {
  open: boolean;
  stories: FeedStory[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const current = stories[index];

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
    setProgress(0);
  }, [open, initialIndex]);

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
    if (!open) return;
    setProgress(0);
    const t = window.setInterval(() => {
      setProgress((p) => {
        const next = p + 2;
        if (next >= 100) {
          window.clearInterval(t);
          setIndex((v) => Math.min(stories.length - 1, v + 1));
          return 0;
        }
        return next;
      });
    }, 120);
    return () => window.clearInterval(t);
  }, [open, index, stories.length]);

  const bars = useMemo(() => stories.map((s, i) => {
    const w = i < index ? 100 : i === index ? progress : 0;
    return { id: s.id, w };
  }), [index, progress, stories]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl"
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

        <div className="relative aspect-[9/16] bg-black">
          {current?.mediaUrl ? (
            <img src={current.mediaUrl} alt="story" className="absolute inset-0 w-full h-full object-contain" />
          ) : null}

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
            onClick={() => setIndex((v) => Math.min(stories.length - 1, v + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            disabled={index >= stories.length - 1}
          >
            <ChevronRight className="w-5 h-5" color="white" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

