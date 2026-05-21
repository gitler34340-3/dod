import { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { motion } from 'motion/react';

type Props = {
  open: boolean;
  image: string | null;
  initialZoom?: number;
  onClose: () => void;
  onPickFile: (file: File) => void;
  onSave: (payload: { croppedDataUrl: string }) => Promise<void> | void;
};

function createImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

async function getCroppedDataUrl(imageSrc: string, pixelCrop: Area) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function AvatarCropperModal({
  open,
  image,
  initialZoom = 1,
  onClose,
  onPickFile,
  onSave,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setZoom(initialZoom);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  }, [open, initialZoom]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const canSave = useMemo(() => Boolean(image && croppedAreaPixels), [image, croppedAreaPixels]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = useCallback(async () => {
    if (!image || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const croppedDataUrl = await getCroppedDataUrl(image, croppedAreaPixels);
      await onSave({ croppedDataUrl });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [croppedAreaPixels, image, onClose, onSave]);

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
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-2xl p-6"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Редактор аватарки
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Перетащите фото, увеличьте/уменьшите и сохраните.
            </p>
          </div>
          <button
            type="button"
            className="px-3 py-1 rounded"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickFile(file);
          }}
          className="mb-4"
        />

        <div className="relative mx-auto mb-4 w-72 h-72 rounded-full overflow-hidden" style={{ background: '#111' }}>
          {image ? (
            <>
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.12)' }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Выберите фото
            </div>
          )}
        </div>

        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
          Масштаб
        </label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full mb-4"
        />

        <div className="flex gap-3">
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
            disabled={!canSave || saving}
            className="flex-1 py-2 rounded-lg font-bold disabled:opacity-50"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
            onClick={handleSave}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

