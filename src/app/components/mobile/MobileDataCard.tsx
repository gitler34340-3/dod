import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/app/components/ui/utils';

interface MobileDataCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  index?: number;
}

export function MobileDataCard({
  title,
  subtitle,
  badge,
  onClick,
  children,
  actions,
  className,
  index = 0,
}: MobileDataCardProps) {
  const interactive = Boolean(onClick);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'mobile-data-card rounded-2xl border p-4 space-y-3',
        interactive && 'cursor-pointer active:scale-[0.99] transition-transform',
        className,
      )}
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-muted)' }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {title}
          </div>
          {subtitle && (
            <div className="text-sm mt-0.5 leading-snug break-words" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {interactive && <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />}
        </div>
      </div>
      {children && <div className="space-y-2 text-sm">{children}</div>}
      {actions && <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: 'var(--border-muted)' }}>{actions}</div>}
    </motion.div>
  );
}

export function MobileCardField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 items-start">
      <span className="shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      <span className="text-right font-medium min-w-0 break-words" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

export function MobileCardList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('md:hidden space-y-3', className)}>{children}</div>;
}

export function DesktopTableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('hidden md:block', className)}>{children}</div>;
}
