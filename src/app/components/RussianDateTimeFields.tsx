import { useEffect, useId, useRef, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarIcon, Clock3 } from 'lucide-react';
import { Calendar } from '@/app/components/ui/calendar';
import { cn } from '@/app/components/ui/utils';
import 'react-day-picker/dist/style.css';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const shellStyle = {
  borderColor: 'var(--glass-border)',
  backgroundColor: 'var(--bg-primary)',
};

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [enabled, onClose, ref]);
}

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  try {
    const d = parseISO(`${iso}T12:00:00`);
    if (!isValid(d)) return '';
    return format(d, 'dd.MM.yyyy');
  } catch {
    return '';
  }
}

function parseDisplayDate(text: string): string | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  const dd = match[1].padStart(2, '0');
  const mm = match[2].padStart(2, '0');
  const yyyy = match[3];
  const iso = `${yyyy}-${mm}-${dd}`;
  const d = parseISO(`${iso}T12:00:00`);
  return isValid(d) ? iso : null;
}

function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function normalizeTimeInput(raw: string): string {
  const cleaned = raw.replace(/[^\d:]/g, '');
  if (/^\d{2}:\d{0,2}$/.test(cleaned) || /^\d{1,2}$/.test(cleaned)) return cleaned;
  const digits = cleaned.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function parseTimeValue(text: string): string | null {
  const match = text.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

type FieldShellProps = {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

function FieldShell({ label, hint, children, className }: FieldShellProps) {
  return (
    <div className={className}>
      {label ? (
        <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      ) : null}
      {children}
      {hint ? (
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type RussianDateFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function RussianDateField({ label, value, onChange, className }: RussianDateFieldProps) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => isoToDisplay(value));
  const selected = value ? parseISO(`${value}T12:00:00`) : undefined;

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  useClickOutside(rootRef, () => setOpen(false), open);

  const commitText = (nextText: string) => {
    const iso = parseDisplayDate(nextText);
    if (iso) {
      onChange(iso);
      setText(isoToDisplay(iso));
      return true;
    }
    if (!nextText.trim()) {
      onChange('');
      setText('');
      return true;
    }
    return false;
  };

  const pickDate = (date?: Date) => {
    if (!date) return;
    const iso = format(date, 'yyyy-MM-dd');
    onChange(iso);
    setText(isoToDisplay(iso));
    setOpen(false);
  };

  return (
    <FieldShell
      label={label}
      hint="ДД.ММ.ГГГГ — введите с клавиатуры или откройте календарь"
      className={className}
    >
      <div ref={rootRef} className="relative">
        <div
          className={cn(
            'flex items-center gap-1 rounded-lg border px-3 py-0 shadow-sm',
            open && 'ring-2 ring-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)]',
          )}
          style={shellStyle}
        >
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            lang="ru"
            autoComplete="off"
            placeholder="ДД.ММ.ГГГГ"
            value={text}
            onChange={(e) => {
              const masked = maskDateInput(e.target.value);
              setText(masked);
              const iso = parseDisplayDate(masked);
              if (iso) onChange(iso);
            }}
            onBlur={() => {
              if (!commitText(text)) setText(isoToDisplay(value));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (commitText(text)) setOpen(false);
              }
              if (e.key === 'Escape') setOpen(false);
            }}
            className="flex-1 min-w-0 border-0 bg-transparent py-2.5 text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
            aria-label={label ?? 'Дата'}
          />
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-white/10"
            style={{ color: 'var(--accent-primary)' }}
            aria-label="Открыть календарь"
            aria-expanded={open}
          >
            <CalendarIcon className="size-4" />
          </button>
        </div>

        {open ? (
          <div
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-[9999] rounded-xl border p-2 shadow-2xl"
            style={{
              borderColor: 'var(--glass-border)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <p className="px-2 pb-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Выберите дату
            </p>
            <Calendar
              mode="single"
              locale={ru}
              selected={selected}
              onSelect={pickDate}
              className="russian-picker rounded-lg"
            />
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
}

type RussianTimeFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function RussianTimeField({ label, value, onChange, className }: RussianTimeFieldProps) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const [draftHour, setDraftHour] = useState(value ? value.split(':')[0] : '09');
  const [draftMinute, setDraftMinute] = useState(value ? value.split(':')[1] : '00');

  useEffect(() => {
    setText(value);
    if (value) {
      const [h, m] = value.split(':');
      if (h) setDraftHour(h);
      if (m) setDraftMinute(m);
    }
  }, [value]);

  useClickOutside(rootRef, () => setOpen(false), open);

  const applyTime = (hour: string, minute: string) => {
    const next = `${hour}:${minute}`;
    onChange(next);
    setText(next);
    setDraftHour(hour);
    setDraftMinute(minute);
    setOpen(false);
  };

  const commitText = (nextText: string) => {
    const parsed = parseTimeValue(nextText);
    if (parsed) {
      onChange(parsed);
      setText(parsed);
      const [h, m] = parsed.split(':');
      setDraftHour(h);
      setDraftMinute(m);
      return true;
    }
    if (!nextText.trim()) {
      onChange('');
      setText('');
      return true;
    }
    return false;
  };

  return (
    <FieldShell
      label={label}
      hint="ЧЧ:ММ — 24-часовой формат, можно ввести или выбрать"
      className={className}
    >
      <div ref={rootRef} className="relative">
        <div
          className={cn(
            'flex items-center gap-1 rounded-lg border px-3 py-0 shadow-sm',
            open && 'ring-2 ring-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)]',
          )}
          style={shellStyle}
        >
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            lang="ru"
            autoComplete="off"
            placeholder="ЧЧ:ММ"
            value={text}
            onChange={(e) => {
              const masked = normalizeTimeInput(e.target.value);
              setText(masked);
              const parsed = parseTimeValue(masked);
              if (parsed) onChange(parsed);
            }}
            onBlur={() => {
              if (!commitText(text)) setText(value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (commitText(text)) setOpen(false);
              }
              if (e.key === 'Escape') setOpen(false);
            }}
            className="flex-1 min-w-0 border-0 bg-transparent py-2.5 text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
            aria-label={label ?? 'Время'}
          />
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-white/10"
            style={{ color: 'var(--accent-primary)' }}
            aria-label="Выбрать время"
            aria-expanded={open}
          >
            <Clock3 className="size-4" />
          </button>
        </div>

        {open ? (
          <div
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-[9999] rounded-xl border p-3 shadow-2xl"
            style={{
              borderColor: 'var(--glass-border)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <p className="mb-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Выберите время
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-center text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Часы
                </p>
                <div className="max-h-44 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--glass-border)' }}>
                  {HOURS.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => setDraftHour(hour)}
                      className={cn(
                        'block w-full px-3 py-1.5 text-sm text-center transition-colors hover:bg-white/10',
                        draftHour === hour && 'font-bold',
                      )}
                      style={{
                        color: draftHour === hour ? 'var(--accent-primary)' : 'var(--text-primary)',
                        backgroundColor:
                          draftHour === hour ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' : undefined,
                      }}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-center text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Минуты
                </p>
                <div className="max-h-44 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--glass-border)' }}>
                  {MINUTES.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => applyTime(draftHour, minute)}
                      className={cn(
                        'block w-full px-3 py-1.5 text-sm text-center transition-colors hover:bg-white/10',
                        draftMinute === minute && 'font-bold',
                      )}
                      style={{
                        color: draftMinute === minute ? 'var(--accent-primary)' : 'var(--text-primary)',
                        backgroundColor:
                          draftMinute === minute ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' : undefined,
                      }}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => applyTime(draftHour, draftMinute)}
              className="mt-3 w-full rounded-lg py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Готово — {draftHour}:{draftMinute}
            </button>
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
}

export function formatRussianDate(isoDate: string): string {
  if (!isoDate) return '';
  try {
    return format(parseISO(`${isoDate}T12:00:00`), 'd MMMM yyyy', { locale: ru });
  } catch {
    return isoDate;
  }
}

export function formatRussianTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  if (!h || !m) return time;
  return `${h} ч ${m} мин`;
}
