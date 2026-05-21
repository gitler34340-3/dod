import { useEffect } from 'react';
import { toast } from 'sonner';
import { playSound, preloadSounds, unlockSounds } from '@/app/audio/sounds';
import { pushAppNotification } from '@/app/notifications/appNotifications';

type ToastFn = (...args: unknown[]) => unknown;

export function SoundEffects() {
  useEffect(() => {
    preloadSounds();

    const handlePointerDown = (event: PointerEvent) => {
      unlockSounds();

      const target = event.target;
      if (!(target instanceof Element)) return;

      const interactive = target.closest('button, a, [role="button"], [data-sound="menu"]');
      if (!interactive) return;
      if (interactive instanceof HTMLButtonElement && interactive.disabled) return;
      if (interactive.getAttribute('aria-disabled') === 'true') return;

      playSound('menu');
    };

    window.addEventListener('pointerdown', handlePointerDown, true);

    const toastApi = toast as unknown as Record<string, ToastFn>;
    const originalSuccess = toastApi.success;
    const originalError = toastApi.error;
    const originalInfo = toastApi.info;
    const originalMessage = toastApi.message;
    const originalWarning = toastApi.warning;

    if (originalSuccess) {
      toastApi.success = (...args: unknown[]) => {
        playSound('approve');
        pushAppNotification({ type: 'success', message: args[0] });
        return originalSuccess(...args);
      };
    }

    if (originalError) {
      toastApi.error = (...args: unknown[]) => {
        playSound('reject');
        pushAppNotification({ type: 'error', message: args[0] });
        return originalError(...args);
      };
    }

    if (originalInfo) {
      toastApi.info = (...args: unknown[]) => {
        playSound('notification');
        pushAppNotification({ type: 'info', message: args[0] });
        return originalInfo(...args);
      };
    }

    if (originalMessage) {
      toastApi.message = (...args: unknown[]) => {
        playSound('notification');
        pushAppNotification({ type: 'info', message: args[0] });
        return originalMessage(...args);
      };
    }

    if (originalWarning) {
      toastApi.warning = (...args: unknown[]) => {
        playSound('notification');
        pushAppNotification({ type: 'warning', message: args[0] });
        return originalWarning(...args);
      };
    }

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      if (originalSuccess) toastApi.success = originalSuccess;
      if (originalError) toastApi.error = originalError;
      if (originalInfo) toastApi.info = originalInfo;
      if (originalMessage) toastApi.message = originalMessage;
      if (originalWarning) toastApi.warning = originalWarning;
    };
  }, []);

  return null;
}
