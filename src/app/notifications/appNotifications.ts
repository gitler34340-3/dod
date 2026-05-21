export type AppNotificationType = 'info' | 'warning' | 'success' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: AppNotificationType;
  time: string;
  createdAt: number;
}

const STORAGE_KEY = 'dodoAppNotifications';
const EVENT_NAME = 'dodo-app-notification';
const MAX_NOTIFICATIONS = 30;

function readStored(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStored(notifications: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  } catch {
    // Local storage can be disabled by browser settings.
  }
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function stringifyToastMessage(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object' && 'props' in value) return 'Новое уведомление';
  return 'Новое уведомление';
}

export function getAppNotifications() {
  return readStored();
}

export function pushAppNotification(input: {
  title?: string;
  message: unknown;
  type: AppNotificationType;
}) {
  const now = new Date();
  const notification: AppNotification = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    title:
      input.title ??
      (input.type === 'success'
        ? 'Успешно'
        : input.type === 'error'
          ? 'Ошибка'
          : input.type === 'warning'
            ? 'Внимание'
            : 'Уведомление'),
    message: stringifyToastMessage(input.message),
    type: input.type,
    time: formatTime(now),
    createdAt: now.getTime(),
  };

  const next = [notification, ...readStored()].slice(0, MAX_NOTIFICATIONS);
  writeStored(next);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: notification }));
  return notification;
}

export function subscribeToAppNotifications(callback: (notification: AppNotification) => void) {
  const handler = (event: Event) => {
    callback((event as CustomEvent<AppNotification>).detail);
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
