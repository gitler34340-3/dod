import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Lock, UserPlus, Phone, Briefcase } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { DodoLogo } from '@/app/components/DodoLogo';
import { DustEffect } from '@/app/components/DustEffect';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { API_URL } from '@/app/api/config';

export function LoginScreen() {
  const navigate = useNavigate();
  const { session, setSession } = useAuth();

  useEffect(() => {
    if (session?.user) navigate('/home', { replace: true });
  }, [session, navigate]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isJobApplication, setIsJobApplication] = useState(false);

  // Поля для заявки на работу
  const [appFirstName, setAppFirstName] = useState('');
  const [appLastName, setAppLastName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appPosition, setAppPosition] = useState('');
  const [appExperience, setAppExperience] = useState('');

  const saveSessionAndGo = (data: { user: unknown; accessToken: string; refreshToken?: string }) => {
    const session = { ...data, token: data.accessToken };
    setSession(session);
    const role = (data.user as { role?: string })?.role ?? '';
    if (role === 'Admin' || role === 'HR' || role === 'Manager') {
      toast.success('Добро пожаловать!');
    } else {
      toast.success('Добро пожаловать в команду!');
    }
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
        toast.error(
          'Сервер недоступен. Запустите бэкенд: в папке backend выполните npm run dev.',
        );
      } else {
        toast.error('Неверный логин или пароль');
      }
    } finally {
      setLoading(false);
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
          firstName: appFirstName.trim(),
          lastName: appLastName.trim(),
          email: appEmail.trim(),
          phone: appPhone.trim(),
          position: appPosition,
          experience: appExperience,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = 'Ошибка при отправке заявки';
        try {
          const json = JSON.parse(text);
          if (json.message) msg = Array.isArray(json.message) ? json.message[0] : json.message;
        } catch {
          if (text) msg = text;
        }
        toast.error(msg);
        return;
      }

      toast.success('Заявка отправлена! Ожидайте рассмотрения администратором.');
      // Очистить форму
      setAppFirstName('');
      setAppLastName('');
      setAppEmail('');
      setAppPhone('');
      setAppPosition('');
      setAppExperience('');
      setIsJobApplication(false);
    } catch (error) {
      console.error(error);
      toast.error('Не удалось отправить заявку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full dust-effect relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1721655799267-2f958d9cd1cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZXN0ZXJuJTIwZGVzZXJ0JTIwZHVzdCUyMHN1bnNldHxlbnwxfHx8fDE3Njk5NjE5MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')` 
        }}
      />
      
      {/* Dust Effect */}
      <DustEffect />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{ background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo */}
        <DodoLogo size="lg" animated={true} />
        
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold mb-2 text-center"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <span className="bg-gradient-to-r from-[#d32f2f] to-[#ff6f00] bg-clip-text text-transparent">
            Dodo Staff
          </span>
        </motion.h1>

        {false && <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-[#d7ccc8] mb-12 text-center text-lg"
        >
          Wild West of Pizza Management
        </motion.p>}

        {/* Hint: test account */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-sm text-[#d7ccc8]/80 mb-4 text-center"
        >
          Тестовый вход: <span className="text-[#ff6f00] font-mono">admin@hr.local</span> / <span className="font-mono">Admin123!</span>
        </motion.p>

        {/* Login / Job Application Form */}
        <motion.form
          onSubmit={isJobApplication ? handleJobApplication : handleLogin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="w-full max-w-md space-y-4"
        >
          {!isJobApplication ? (
            <>
              {/* EMAIL Field for Login */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="relative"
              >
                <div className="glass rounded-xl p-4 card-shadow">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#ff6f00]" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white placeholder:text-[#d7ccc8]/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              {/* PASSWORD Field for Login */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="relative"
              >
                <div className="glass rounded-xl p-4 card-shadow">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-[#ff6f00]" />
                    <Input
                      type="password"
                      placeholder="Пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white placeholder:text-[#d7ccc8]/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              {/* Job Application Fields */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="relative"
              >
                <div className="glass rounded-xl p-4 card-shadow">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#ff6f00]" />
                    <Input
                      type="text"
                      placeholder="Имя"
                      value={appFirstName}
                      onChange={(e) => setAppFirstName(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white placeholder:text-[#d7ccc8]/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="relative"
              >
                <div className="glass rounded-xl p-4 card-shadow">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#ff6f00]" />
                    <Input
                      type="text"
                      placeholder="Фамилия"
                      value={appLastName}
                      onChange={(e) => setAppLastName(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white placeholder:text-[#d7ccc8]/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="relative"
              >
                <div className="glass rounded-xl p-4 card-shadow">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#ff6f00]" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={appEmail}
                      onChange={(e) => setAppEmail(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white placeholder:text-[#d7ccc8]/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="relative"
              >
                <div className="glass rounded-xl p-4 card-shadow">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#ff6f00]" />
                    <Input
                      type="tel"
                      placeholder="Телефон"
                      value={appPhone}
                      onChange={(e) => setAppPhone(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white placeholder:text-[#d7ccc8]/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="relative"
              >
                <div className="glass rounded-xl p-4 card-shadow">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-[#ff6f00]" />
                    <Input
                      type="text"
                      placeholder="Должность"
                      value={appPosition}
                      onChange={(e) => setAppPosition(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white placeholder:text-[#d7ccc8]/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="relative"
              >
                <div className="glass rounded-xl p-4 card-shadow">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#ff6f00]" />
                    <textarea
                      placeholder="Опыт работы (опционально)"
                      value={appExperience}
                      onChange={(e) => setAppExperience(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white placeholder:text-[#d7ccc8]/50 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none h-24"
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #d32f2f 0%, #ff6f00 100%)',
                border: 'none',
              }}
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isJobApplication ? 'Отправить заявку' : 'Войти'}
              </motion.span>
            </Button>
          </motion.div>

          {/* Toggle Job Application / Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="text-center flex items-center justify-center gap-2 flex-wrap"
          >
            <button
              type="button"
              onClick={() => {
                setIsJobApplication(!isJobApplication);
              }}
              className="text-[#ff6f00] hover:text-[#ffa000] transition-colors inline-flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" />
              {isJobApplication ? 'Войти в аккаунт' : 'Устроиться на работу'}
            </button>
          </motion.div>
        </motion.form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7, duration: 0.5 }}
          className="mt-12 text-center text-sm text-[#d7ccc8]/60"
        >
          <p>Dodo Pizza © 2026 | Inspired by Red Dead Redemption 2</p>
        </motion.div>
      </div>
    </div>
  );
}
