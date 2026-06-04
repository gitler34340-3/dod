import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  FileText,
  Settings,
  LogOut,
  Star,
  Trophy,
  CheckCircle2,
  User,
} from 'lucide-react';
import { ArthurMorganAvatar } from '@/app/components/ArthurMorganAvatar';
import { useAuth } from '@/app/contexts/AuthContext';
import { apiFetch } from '@/app/api/api';
import { AvatarCropperModal } from '@/app/components/AvatarCropperModal';
import { playSound } from '@/app/audio/sounds';

type Tab = 'overview' | 'documents' | 'achievements';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  earnedAt: string;
}

interface AchievementProgress {
  key: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  progress: number;
  current: number;
  target: number;
  unlocked: boolean;
}

interface Document {
  id: string;
  title: string;
  type: string;
  date: string;
  status: 'active' | 'pending' | 'archived';
  fileUrl?: string;
  notes?: string;
}

type ProfileDraft = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

export function ProfileScreen() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [employee, setEmployee] = useState<{
    id?: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    hireDate?: string | null;
    department?: { name: string } | null;
    hourlyRate?: number | null;
    avatar?: { fileUrl?: string | null; notes?: string | null } | null;
  } | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [workedShiftsCount, setWorkedShiftsCount] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const [avatarDraftUrl, setAvatarDraftUrl] = useState<string | null>(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    if (!token || !user?.employeeId) return;
    
    // Загрузить информацию сотрудника
    Promise.all([
      apiFetch(`/employees/${user.employeeId}`, undefined, token),
      apiFetch<any[]>('/shifts', undefined, token).catch(() => []),
    ])
      .then(([data, shifts]) => {
        const employeeData = data as any;
        setEmployee(employeeData);
        setProfileDraft({
          firstName: employeeData.firstName || '',
          lastName: employeeData.lastName || '',
          phone: employeeData.phone || '',
          email: employeeData.email || user.email || '',
        });
        if (employeeData.avatar?.fileUrl) {
          setAvatarDataUrl(employeeData.avatar.fileUrl);
          if (employeeData.avatar.notes) {
            try {
              const meta = JSON.parse(employeeData.avatar.notes) as { zoom?: number; offsetX?: number; offsetY?: number };
              setAvatarZoom(meta.zoom ?? 1);
              setAvatarOffsetX(meta.offsetX ?? 0);
              setAvatarOffsetY(meta.offsetY ?? 0);
            } catch {
              // ignore invalid avatar metadata
            }
          }
        }
        const shiftsForEmployee = (Array.isArray(shifts) ? shifts : []).filter(
          (shift: any) =>
            shift.employeeId === user.employeeId &&
            ['Confirmed', 'confirmed'].includes(String(shift.status)),
        );
        setWorkedShiftsCount(shiftsForEmployee.length);
      })
      .catch(() => setEmployee(null));
    
    // Загрузить документы сотрудника
    apiFetch(`/employee-documents/my-uploads`, undefined, token)
      .then((data: any) => {
        const docs = (Array.isArray(data) ? data : []).map((doc: any) => ({
          id: doc.id,
          title: doc.template?.name || 'Документ',
          type: doc.template?.description || 'Документ',
          date: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('ru-RU') : '—',
          status: doc.status === 'approved' ? 'active' : doc.status === 'rejected' ? 'archived' : 'pending',
          fileUrl: doc.fileUrl,
          notes: doc.notes,
        }));
        setDocuments(docs);
      })
      .catch(() => setDocuments([]));

    apiFetch<any[]>(`/achievements/by-employee/${user.employeeId}`, undefined, token)
      .then((rows) => {
        setAchievements(
          rows.map((entry) => ({
            id: entry.id,
            title: entry.achievement?.title || 'Достижение',
            description: entry.achievement?.description || '',
            icon: entry.achievement?.icon || '🏆',
            points: entry.achievement?.points || 0,
            earnedAt: entry.earnedAt,
          })),
        );
      })
      .catch(() => setAchievements([]));
  }, [token, user?.employeeId]);

  const fullName = useMemo(() => {
    if (employee) return `${employee.firstName} ${employee.lastName}`.trim();
    return user?.email ?? 'Профиль сотрудника';
  }, [employee, user?.email]);

  const hireDateLabel = employee?.hireDate
    ? new Date(employee.hireDate).toLocaleDateString('ru-RU')
    : '—';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'var(--status-confirmed)';
      case 'pending':
        return 'var(--status-pending)';
      case 'archived':
        return 'var(--text-tertiary)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const handleAvatarChange = async (file?: File) => {
    if (!file) return;
    const toBase64 = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    const image = await toBase64();
    setAvatarDraftUrl(image);
  };

  const saveAvatarCropped = async (payload: { croppedDataUrl: string }) => {
    if (!token) return;
    setSavingAvatar(true);
    try {
      await apiFetch(
        '/employees/me/avatar',
        {
          method: 'PATCH',
          body: JSON.stringify({
            fileUrl: payload.croppedDataUrl,
            fileName: 'avatar.jpg',
          }),
        },
        token,
      );
      setAvatarDataUrl(payload.croppedDataUrl);
      setAvatarZoom(1);
      setAvatarOffsetX(0);
      setAvatarOffsetY(0);
      playSound('edited');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setSavingProfile(true);
    try {
      const updated = await apiFetch<any>(
        '/employees/me/profile',
        {
          method: 'PATCH',
          body: JSON.stringify({
            firstName: profileDraft.firstName,
            lastName: profileDraft.lastName,
            phone: profileDraft.phone,
            email: profileDraft.email,
          }),
        },
        token,
      );
      setEmployee(updated);
      setIsEditingProfile(false);
      playSound('edited');
    } catch (error) {
      console.error(error);
    } finally {
      setSavingProfile(false);
    }
  };

  const achievementProgress = useMemo<AchievementProgress[]>(() => {
    const approvedDocs = documents.filter((doc) => doc.status === 'active').length;
    const profileFields = [
      profileDraft.firstName.trim(),
      profileDraft.lastName.trim(),
      profileDraft.phone.trim(),
      profileDraft.email.trim(),
    ];
    const profileCompletion = profileFields.filter(Boolean).length;

    const rules = [
      { key: 'profile', title: 'Первые шаги', description: 'Заполните профиль', icon: '👤', points: 10, current: profileCompletion, target: 4 },
      { key: 'first-doc', title: 'Первый документ', description: 'Отправьте 1 документ', icon: '📄', points: 15, current: documents.length, target: 1 },
      { key: 'first-approved', title: 'Проверка пройдена', description: 'Получите 1 одобренный документ', icon: '✅', points: 25, current: approvedDocs, target: 1 },
      { key: 'doc-pack', title: 'Пакет собран', description: 'Отправьте 5 документов', icon: '🗂️', points: 40, current: documents.length, target: 5 },
      { key: 'shift-pro', title: 'Опытный сменщик', description: 'Отработайте 20 смен', icon: '⏱️', points: 35, current: workedShiftsCount, target: 20 },
    ];

    const unlockedTitles = new Set(achievements.map((a) => a.title));
    return rules.map((rule) => {
      const progress = Math.max(0, Math.min(100, Math.round((rule.current / rule.target) * 100)));
      return {
        ...rule,
        progress,
        unlocked: unlockedTitles.has(rule.title) || progress >= 100,
      };
    });
  }, [achievements, documents, profileDraft, workedShiftsCount]);

  return (
    <div className="min-h-screen w-full dust-effect" style={{ background: 'var(--bg-primary)' }}>
      <motion.header initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate('/home')} className="p-2 rounded-full glass hover-red-glow">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </motion.button>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            Личный кабинет
          </h1>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-full glass hover-red-glow">
            <Settings className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </motion.button>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8 card-shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }} />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <div className="relative">
                {avatarDataUrl ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--glass-border)' }}>
                    <img
                      src={avatarDataUrl}
                      alt="avatar"
                      className="w-full h-full object-cover"
                      style={{
                        transform: `translate(${avatarOffsetX}px, ${avatarOffsetY}px) scale(${avatarZoom})`,
                        transformOrigin: 'center',
                      }}
                    />
                  </div>
                ) : (
                  <ArthurMorganAvatar size="xl" />
                )}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)', border: '3px solid var(--bg-primary)' }}>
                  <Star className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  {fullName}
                </h2>
                <p className="text-lg mb-4" style={{ color: 'var(--accent-primary)' }}>
                  {employee?.department?.name || user?.role || 'Сотрудник'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><Mail className="w-4 h-4" /><span className="text-sm">{user?.email ?? '—'}</span></div>
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><Phone className="w-4 h-4" /><span className="text-sm">{employee?.phone ?? '—'}</span></div>
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><MapPin className="w-4 h-4" /><span className="text-sm">{employee?.department?.name ?? 'Отдел не указан'}</span></div>
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><Calendar className="w-4 h-4" /><span className="text-sm">В команде с {hireDateLabel}</span></div>
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><Briefcase className="w-4 h-4" /><span className="text-sm">Роль: {user?.role ?? '—'}</span></div>
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><Award className="w-4 h-4" /><span className="text-sm">Ставка: {employee?.hourlyRate != null ? `${employee.hourlyRate} ₽/ч` : '—'}</span></div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setIsEditingProfile((v) => !v)} className="px-3 py-2 rounded-lg glass">
                {isEditingProfile ? 'Отменить редактирование' : 'Редактировать профиль'}
              </motion.button>
            </div>

            {isEditingProfile && (
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <div className="md:col-span-2 rounded-xl p-4" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Аватарка редактируется в отдельном редакторе (обрезка как в соцсетях)
                  </p>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setAvatarEditorOpen(true)} className="px-4 py-2 rounded-lg font-medium" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                    Открыть редактор аватарки
                  </motion.button>
                </div>
                <input
                  value={profileDraft.firstName}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Имя"
                  className="rounded-lg p-3"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                <input
                  value={profileDraft.lastName}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Фамилия"
                  className="rounded-lg p-3"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                <input
                  value={profileDraft.phone}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Телефон"
                  className="rounded-lg p-3"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                <input
                  value={profileDraft.email}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                  className="rounded-lg p-3"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} disabled={savingProfile} onClick={handleSaveProfile} className="px-4 py-3 rounded-lg font-bold" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                  {savingProfile ? 'Сохраняем...' : 'Сохранить профиль'}
                </motion.button>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4 pt-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <div className="text-center"><div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-primary)' }}>{documents.length}</div><div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Документов</div></div>
              <div className="text-center"><div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--status-confirmed)' }}>{documents.filter((d) => d.status === 'active').length}</div><div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Одобрено</div></div>
              <div className="text-center"><div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--orange-subtle)' }}>{achievements.length}</div><div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ачивок</div></div>
              <div className="text-center"><div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>{workedShiftsCount}</div><div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Смен отработано</div></div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'overview', label: 'Обзор', icon: <User className="w-4 h-4" /> },
            { key: 'documents', label: 'Документы', icon: <FileText className="w-4 h-4" /> },
            { key: 'achievements', label: 'Достижения', icon: <Trophy className="w-4 h-4" /> },
          ].map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key as Tab)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--glass-bg)',
                color: activeTab === tab.key ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${activeTab === tab.key ? 'transparent' : 'var(--glass-border)'}`,
              }}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6 card-shadow">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Последние достижения</h3>
                <div className="space-y-3">
                  {achievements.slice(0, 3).map((ach) => (
                    <div key={ach.id} className="flex items-center gap-3 p-3 rounded-xl glass">
                      <div className="text-2xl">{ach.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ach.title}</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-2xl p-6 card-shadow">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Активные документы</h3>
                <div className="space-y-3">
                  {documents.filter((d) => d.status === 'active').map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl glass">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{doc.type}</p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5" style={{ color: getStatusColor(doc.status) }} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <motion.div 
                    key={doc.id} 
                    whileHover={{ scale: 1.02 }} 
                    onClick={() => {
                      setSelectedDocument(doc);
                      setShowDocumentModal(true);
                    }}
                    className="glass rounded-2xl p-6 card-shadow cursor-pointer hover-red-glow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: getStatusColor(doc.status) }}>
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{doc.title}</h4>
                          <p style={{ color: 'var(--text-secondary)' }}>{doc.type} • {doc.date}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="glass rounded-2xl p-12 text-center card-shadow">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Нет документов</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievementProgress.map((ach) => (
                <motion.div key={ach.key} whileHover={{ scale: 1.05 }} className="glass rounded-2xl p-6 card-shadow cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ background: ach.unlocked ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{ach.icon}</div>
                      <div className="text-sm px-2 py-1 rounded-full" style={{ background: 'var(--glass-bg)', color: 'var(--accent-primary)' }}>
                        +{ach.points}
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{ach.title}</h4>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{ach.description}</p>
                    <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--glass-bg)' }}>
                      <div className="h-full" style={{ width: `${ach.progress}%`, background: 'var(--accent-primary)' }} />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{ach.current}/{ach.target} • {ach.progress}%</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-center mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound('condemnation');
              logout();
              navigate('/login', { replace: true });
            }}
            className="glass rounded-xl px-6 py-3 flex items-center gap-2 hover-red-glow"
            style={{ color: 'var(--accent-primary)' }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Выход из Wild West</span>
          </motion.button>
        </motion.div>

        <AvatarCropperModal
          open={avatarEditorOpen}
          image={avatarDraftUrl || avatarDataUrl}
          onClose={() => setAvatarEditorOpen(false)}
          onPickFile={(file) => handleAvatarChange(file)}
          onSave={saveAvatarCropped}
        />
        
        {/* Модальное окно документа */}
        {showDocumentModal && selectedDocument && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowDocumentModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-8 max-w-2xl w-full"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    {selectedDocument.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="mt-1">{selectedDocument.type}</p>
                </div>
                <button 
                  onClick={() => setShowDocumentModal(false)}
                  className="text-2xl"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--glass-bg)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Статус</p>
                    <p className="font-bold mt-1" style={{ color: getStatusColor(selectedDocument.status) }}>
                      {selectedDocument.status === 'active' ? '✅ Активный' : selectedDocument.status === 'pending' ? '⏳ На проверке' : '📦 Архив'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Дата</p>
                    <p className="font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{selectedDocument.date}</p>
                  </div>
                </div>
              </div>

              {selectedDocument.fileUrl && (
                <div className="mb-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                    className="w-full py-3 rounded-xl font-bold"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                  >
                    📥 Скачать документ
                  </motion.button>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDocumentModal(false)}
                className="w-full py-3 rounded-xl font-bold"
                style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--text-primary)' }}
              >
                Закрыть
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
