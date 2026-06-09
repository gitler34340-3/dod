import { Outlet, useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { apiFetch } from '@/app/api/api';
import { playSound } from '@/app/audio/sounds';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BarChart3,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  FileCheck,
} from 'lucide-react';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isHr, logout } = useAuth();
  const [isAsideOpen, setIsAsideOpen] = useState(() => localStorage.getItem('appAsideOpen') !== 'false');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('appAsideOpen', String(isAsideOpen));
  }, [isAsideOpen]);

  useEffect(() => {
    if (!token || !user?.employeeId) return;
    apiFetch<{ fileUrl?: string | null }>(`/employees/${user.employeeId}/avatar`, undefined, token)
      .then((avatar) => setAvatarUrl(avatar?.fileUrl || null))
      .catch(() => setAvatarUrl(null));
  }, [token, user?.employeeId]);

  const nav = isHr
    ? [
        { path: '/home', label: 'Главная', icon: LayoutDashboard },
        { path: '/workers', label: 'Рабочие', icon: Users },
        // "Добавить рабочего" теперь внутри вкладки Рабочие
        { path: '/schedule', label: 'График смен', icon: Calendar },
        { path: '/documents', label: 'Документы', icon: FileText },
        { path: '/job-applications', label: 'Заявки', icon: FileCheck },
        { path: '/stats', label: 'Статистика', icon: BarChart3 },
      ]
    : [
        { path: '/home', label: 'Главная', icon: LayoutDashboard },
        { path: '/schedule', label: 'Мои смены', icon: Calendar },
        { path: '/documents', label: 'Мои документы', icon: FileText },
        { path: '/profile', label: 'Профиль', icon: User },
      ];

  const handleLogout = () => {
    playSound('reject');
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <aside
        className={`hidden md:flex border-r flex-col shrink-0 transition-all duration-300 ${isAsideOpen ? 'w-56' : 'w-20'}`}
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center justify-between gap-2">
            {isAsideOpen && (
              <div className="min-w-0">
                {avatarUrl && (
                  <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover mb-2 border" style={{ borderColor: 'var(--glass-border)' }} />
                )}
                <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.email}
                </p>
                <p className="text-sm truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {isHr ? 'HR / Менеджер' : 'Сотрудник'}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsAsideOpen((value) => !value)}
              className="p-2 rounded-lg hover:opacity-90 shrink-0"
              style={{ color: 'var(--text-secondary)', background: 'var(--glass-bg)' }}
              aria-label={isAsideOpen ? 'Свернуть меню' : 'Развернуть меню'}
              title={isAsideOpen ? 'Свернуть меню' : 'Развернуть меню'}
            >
              {isAsideOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${isAsideOpen ? 'gap-3 justify-start' : 'justify-center'}`}
                style={{
                  background: active ? 'var(--accent-primary)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                }}
                title={label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {isAsideOpen && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <div className={`flex items-center px-2 ${isAsideOpen ? 'justify-between' : 'justify-center'}`}>
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className={`flex items-center px-3 py-2 rounded-lg hover:opacity-90 ${isAsideOpen ? 'gap-2' : 'justify-center'}`}
              style={{ color: 'var(--text-secondary)' }}
              title="Выход"
            >
              <LogOut className="w-4 h-4" />
              {isAsideOpen && 'Выход'}
            </button>
          </div>
        </div>
      </aside>
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 px-3 pt-3">
        <div
          className="glass rounded-2xl px-3 py-2 flex items-center justify-between"
          style={{ border: '1px solid var(--glass-border)' }}
        >
          <div className="min-w-0">
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
              {isHr ? 'HR / Менеджер' : 'Сотрудник'}
            </p>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.email}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <main className="flex-1 overflow-auto p-3 md:p-6 pb-24 md:pb-6 pt-20 md:pt-6" style={{ color: 'var(--text-primary)' }}>
        <Outlet />
      </main>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 pb-2 app-bottom-safe"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 100%)' }}
      >
        <div
          className="glass rounded-2xl border py-2"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-2">
            {nav.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={`mobile-${path}`}
                  type="button"
                  onClick={() => navigate(path)}
                  className="shrink-0 min-w-[4.25rem] rounded-xl py-2 px-2 flex flex-col items-center justify-center gap-1"
                  style={{
                    background: active ? 'var(--accent-primary)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] leading-tight text-center max-w-[4.5rem] truncate">{label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 min-w-[4.25rem] rounded-xl py-2 px-2 flex flex-col items-center justify-center gap-1"
              style={{ color: 'var(--text-secondary)' }}
              title="Выход"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight">Выход</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
