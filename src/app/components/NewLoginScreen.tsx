import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { API_URL } from '@/app/api/config';
import './NewLoginScreen.css';

export function NewLoginScreen() {
  const navigate = useNavigate();
  const { session, setSession } = useAuth();

  useEffect(() => {
    if (session?.user) navigate('/home', { replace: true });
  }, [session, navigate]);

  const [currentTab, setCurrentTab] = useState<'login' | 'apply'>('login');
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [appFirstName, setAppFirstName] = useState('');
  const [appLastName, setAppLastName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appPosition, setAppPosition] = useState('');

  const images = [
    '/images/login/1.png',
    '/images/login/2.png',
    '/images/login/3.png',
    '/images/login/4.png',
    '/images/login/5.png',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showModal) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'Enter') submitForm();
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'q') setCurrentTab('login');
      if (key === 'e') setCurrentTab('apply');
      if (key === 't') toggleTheme();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, showModal]);

  const saveSessionAndGo = (data: { user: unknown; accessToken: string; refreshToken?: string }) => {
    const nextSession = { ...data, token: data.accessToken };
    setSession(nextSession);
    navigate('/home');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = 'Неверный логин или пароль';
        try {
          const json = JSON.parse(text);
          if (json.message) msg = Array.isArray(json.message) ? json.message[0] : json.message;
        } catch {
          if (text) msg = text;
        }
        toast.error(msg);
        return;
      }

      const data = await res.json();
      saveSessionAndGo(data);
    } catch (error) {
      console.error(error);
      const isNetwork =
        error instanceof TypeError &&
        (error.message === 'Failed to fetch' || error.message.includes('NetworkError'));
      if (isNetwork) {
        toast.error('Сервер недоступен. Запустите бэкенд: в папке backend выполните npm run dev.');
      } else {
        toast.error('Неверный логин или пароль');
      }
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  const handleJobApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appFirstName || !appLastName || !appEmail || !appPhone || !appPosition) {
      toast.error('Заполните все требуемые поля');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/job-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: appFirstName,
          lastName: appLastName,
          email: appEmail,
          phone: appPhone,
          position: appPosition,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData?.message || `Ошибка при отправке заявки (${res.status})`);
        return;
      }

      toast.success('Заявка успешно отправлена!');
      setAppFirstName('');
      setAppLastName('');
      setAppEmail('');
      setAppPhone('');
      setAppPosition('');
      closeModal();
    } catch (error) {
      console.error('Job application exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast.error(`Ошибка при отправке заявки: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const submitForm = () => {
    const formId = currentTab === 'login' ? 'login-form' : 'apply-form';
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (form) form.requestSubmit();
  };

  const toggleTheme = () => {
    setIsLightTheme((prev) => !prev);
    document.body.classList.toggle('light-theme');
  };

  const loginForm = (formId: string, className = '') => (
    <form id={formId} className={className} onSubmit={handleLogin}>
      <div className="form-group">
        <label htmlFor={`${formId}-email`}>Email</label>
        <input
          id={`${formId}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${formId}-password`}>Пароль</label>
        <input
          id={`${formId}-password`}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
          required
        />
      </div>
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );

  const applyForm = (formId: string, className = '') => (
    <form id={formId} className={className} onSubmit={handleJobApplication}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${formId}-first`}>Имя</label>
          <input
            id={`${formId}-first`}
            type="text"
            autoComplete="given-name"
            value={appFirstName}
            onChange={(e) => setAppFirstName(e.target.value)}
            placeholder="Имя"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${formId}-last`}>Фамилия</label>
          <input
            id={`${formId}-last`}
            type="text"
            autoComplete="family-name"
            value={appLastName}
            onChange={(e) => setAppLastName(e.target.value)}
            placeholder="Фамилия"
            required
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor={`${formId}-email`}>Email</label>
        <input
          id={`${formId}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={appEmail}
          onChange={(e) => setAppEmail(e.target.value)}
          placeholder="email@example.com"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${formId}-phone`}>Телефон</label>
        <input
          id={`${formId}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={appPhone}
          onChange={(e) => setAppPhone(e.target.value)}
          placeholder="+7 999 000-00-00"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${formId}-position`}>Должность</label>
        <input
          id={`${formId}-position`}
          type="text"
          value={appPosition}
          onChange={(e) => setAppPosition(e.target.value)}
          placeholder="Курьер, повар..."
          required
        />
      </div>
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Отправка...' : 'Отправить заявку'}
      </button>
    </form>
  );

  const slideshow = (className = 'slideshow-container') => (
    <div className={className}>
      {images.map((img, index) => (
        <div
          key={img}
          className={`slide ${index === currentSlideIndex ? 'active' : ''}`}
          style={{ backgroundImage: `url('${img}')` }}
        />
      ))}
    </div>
  );

  return (
    <div className={`login-container ${isLightTheme ? 'light-theme' : ''}`}>
      {/* ——— MOBILE ——— */}
      <div className="login-mobile">
        <div className="login-mobile-bg">{slideshow('login-mobile-slideshow')}</div>
        <div className="login-mobile-gradient" />

        <div className="login-mobile-content">
          <header className="login-mobile-header">
            <div className="logo logo--mobile">
              <span className="logo-text">DODO </span>
              <span className="logo-red">PIZZA</span>
            </div>
            <button type="button" className="theme-toggle-btn" onClick={toggleTheme} aria-label="Сменить тему">
              {isLightTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </header>

          <div className="login-mobile-hero">
            <p className="login-mobile-tagline">HR-портал команды</p>
          </div>

          <div className="login-mobile-card">
            <div className="login-mobile-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={currentTab === 'login'}
                className={`login-mobile-tab ${currentTab === 'login' ? 'active' : ''}`}
                onClick={() => setCurrentTab('login')}
              >
                Вход
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={currentTab === 'apply'}
                className={`login-mobile-tab ${currentTab === 'apply' ? 'active' : ''}`}
                onClick={() => setCurrentTab('apply')}
              >
                Устроиться
              </button>
            </div>

            <div className="login-mobile-form-wrap">
              {currentTab === 'login' ? (
                <>
                  <h2 className="form-title">Вход в систему</h2>
                  {loginForm('login-form-mobile', 'login-form')}
                </>
              ) : (
                <>
                  <h2 className="form-title">Заявка на работу</h2>
                  {applyForm('apply-form-mobile', 'login-form')}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ——— DESKTOP ——— */}
      <div className="login-desktop">
        <header className="top-bar">
          <div className="top-nav">
            <span className="bumper-btn" onClick={() => setCurrentTab('login')}>
              L1
            </span>
            <span
              className={`nav-item ${currentTab === 'login' ? 'active' : ''}`}
              onClick={() => setCurrentTab('login')}
            >
              ВХОД
            </span>
            <span
              className={`nav-item ${currentTab === 'apply' ? 'active' : ''}`}
              onClick={() => setCurrentTab('apply')}
            >
              ЗАЯВКА НА УСТРОЙСТВО
            </span>
            <span className="bumper-btn" onClick={() => setCurrentTab('apply')}>
              R1
            </span>
          </div>

          <div className="logo">
            <span className="logo-text">DODO </span>
            <span className="logo-red">PIZZA</span>
          </div>
        </header>

        <main className="middle-section">
          {slideshow()}
          <div className="shadow-overlay" />
        </main>

        <footer className="bottom-bar">
          <div className="action-group">
            <div className="action-btn" onClick={toggleTheme}>
              СМЕНИТЬ ТЕМУ <span className="ps-icon">O</span>
            </div>
            <div className="action-btn main-action" onClick={openModal}>
              <span>{currentTab === 'login' ? 'ВОЙТИ' : 'ОТПРАВИТЬ ЗАЯВКУ'}</span>
              <span className="ps-icon">✕</span>
            </div>
          </div>
        </footer>
      </div>

      {showModal && (
        <div className="modal-overlay login-desktop-modal" onClick={closeModal}>
          <div className="modal-form" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal} aria-label="Закрыть">
              ✕
            </button>

            {currentTab === 'login' ? (
              <>
                <h2>ВХОД В СИСТЕМУ</h2>
                {loginForm('login-form')}
              </>
            ) : (
              <>
                <h2>ЗАЯВКА НА УСТРОЙСТВО</h2>
                {applyForm('apply-form')}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
