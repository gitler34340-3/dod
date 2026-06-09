import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { apiFetch } from '@/app/api/api';
import { useAuth } from '@/app/contexts/AuthContext';
import { playSound } from '@/app/audio/sounds';

const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;
const isVideoSource = (url: string) => url.startsWith('data:video/') || /\.(mp4|webm|ogg|mov)$/i.test(url);

export function CreateStoryModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token, user } = useAuth();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setCaption('');
    setMediaUrl(null);
    setMediaType(null);
    setSubmitting(false);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const canSubmit = Boolean(token && mediaUrl);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-2xl p-6"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Новая сторис
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Сотрудник — 1 в день, админ/HR — без лимита.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            Закрыть
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg p-3" style={{ background: 'rgba(244,67,54,0.12)', color: '#f44336' }}>
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Медиа (картинка или видео)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > MAX_UPLOAD_SIZE_BYTES) {
                  setError('Файл слишком большой (макс 200MB)');
                  return;
                }
                setError(null);
                const base64 = await toBase64(file);
                setMediaUrl(base64);
                setMediaType(isVideoSource(base64) ? 'video' : 'image');
              }}
            />

            <label className="block text-sm mt-4 mb-2" style={{ color: 'var(--text-secondary)' }}>
              Заголовок (опционально)
            </label>
            <input
              className="w-full px-3 py-2 rounded-lg"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-muted)' }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Например: Обучение"
            />

            <label className="block text-sm mt-4 mb-2" style={{ color: 'var(--text-secondary)' }}>
              Подпись (опционально)
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-lg min-h-[120px]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-muted)' }}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              placeholder="Текст сторис…"
            />
          </div>

          <div>
            <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Предпросмотр
            </div>
            <div className="rounded-xl overflow-hidden bg-black aspect-[9/16]" style={{ border: '1px solid var(--border-muted)' }}>
              {mediaUrl ? (
                mediaType === 'video' ? (
                  <video src={mediaUrl} className="w-full h-full object-contain" controls muted playsInline />
                ) : (
                  <img src={mediaUrl} alt="preview" className="w-full h-full object-contain" />
                )
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="flex-1 py-2 rounded-lg"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-muted)' }}
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            className="flex-1 py-2 rounded-lg font-bold disabled:opacity-50"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
            onClick={async () => {
              if (!token || !mediaUrl) return;
              if (user?.role === 'Employee') {
                playSound('respect');
              }
              setSubmitting(true);
              setError(null);
              try {
                await apiFetch(
                  '/stories',
                  {
                    method: 'POST',
                    body: JSON.stringify({
                      mediaUrl,
                      title: title.trim() || undefined,
                      caption: caption.trim() || undefined,
                    }),
                  },
                  token,
                );
                onCreated();
                onClose();
              } catch (e: any) {
                setError(e?.message || 'Не удалось опубликовать сторис');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? 'Публикую…' : 'Опубликовать'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

