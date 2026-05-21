import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { motion } from 'motion/react';
import { Crown, Users as UsersIcon, UserPlus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  hireDate: string;
  hourlyRate?: number | null;
  user?: { id: string; role: string; email: string };
}

interface EmployeeOfMonthRow {
  id: string;
  month: number;
  year: number;
  title: string;
  message?: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export function WorkersScreen() {
  const navigate = useNavigate();
  const { token, isHr } = useAuth();
  const [list, setList] = useState<EmployeeRow[]>([]);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    if (token && !isHr) navigate('/home', { replace: true });
  }, [token, isHr, navigate]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [employeeOfMonth, setEmployeeOfMonth] = useState<EmployeeOfMonthRow | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // employment details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [hourlyRate, setHourlyRate] = useState('0');
  const [passportSeries, setPassportSeries] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportIssuedBy, setPassportIssuedBy] = useState('');
  const [passportIssueDate, setPassportIssueDate] = useState('');
  const [passportDivisionCode, setPassportDivisionCode] = useState('');
  const [passportRegistrationAddress, setPassportRegistrationAddress] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadUsers = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`${API_URL}/employees/employee-of-month/current`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([employees, currentEmployeeOfMonth]) => {
        setList(employees);
        setEmployeeOfMonth(currentEmployeeOfMonth);
      })
      .finally(() => setLoading(false));
  };

  const resetFormFields = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setHireDate('');
    setHourlyRate('0');
    setPassportSeries('');
    setPassportNumber('');
    setPassportIssuedBy('');
    setPassportIssueDate('');
    setPassportDivisionCode('');
    setPassportRegistrationAddress('');
    setEditingEmployeeId(null);
  };

  const openAddForm = () => {
    resetFormFields();
    setShowForm(true);
  };


  const handleStartEdit = (employee: EmployeeRow) => {
    setEditingEmployeeId(employee.id);
    setFirstName(employee.firstName || '');
    setLastName(employee.lastName || '');
    setPhone(employee.phone || '');
    const hireDateValue = employee.hireDate
      ? new Date(employee.hireDate).toISOString().slice(0, 10)
      : '';
    setHireDate(hireDateValue);
    setHourlyRate(employee.hourlyRate !== undefined && employee.hourlyRate !== null ? String(employee.hourlyRate) : '0');
    setEmail(employee.user?.email || employee.email || '');
    setPassword('');
    setShowForm(true);
  };

  const handleAssignEmployeeOfMonth = async (employee: EmployeeRow) => {
    if (!token) return;
    const now = new Date();
    const message = prompt(
      `Почему ${employee.firstName} ${employee.lastName} выбран(а) работником месяца?`,
      employeeOfMonth?.employee.id === employee.id ? employeeOfMonth.message || '' : '',
    );
    if (message === null) return;

    setSubmitLoading(true);
    try {
      const res = await fetch(`${API_URL}/employees/employee-of-month`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: employee.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          title: 'Работник месяца',
          message,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || 'Не удалось назначить работника месяца');
      }
      toast.success(`${employee.firstName} ${employee.lastName} назначен(а) работником месяца`);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось назначить работника месяца');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string, name: string) => {
    if (!token) return;
    if (!confirm(`Точно удалить сотрудника ${name}? Это действие необратимо.`)) return;
    setSubmitLoading(true);
    try {
      const res = await fetch(`${API_URL}/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || 'Ошибка удаления сотрудника');
      }
      toast.success('Сотрудник удален');
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось удалить сотрудника');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleTerminate = async (employeeId: string, name: string) => {
    if (!token) return;
    const reason = prompt(`Причина увольнения ${name}:`);
    if (!reason) return;
    setSubmitLoading(true);
    try {
      const res = await fetch(`${API_URL}/employees/${employeeId}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Ошибка увольнения');
      toast.success('Сотрудник уволен, документ создан');
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось уволить');
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !token ||
      !firstName.trim() ||
      !lastName.trim() ||
      !hireDate ||
      Number(hourlyRate) < 0
    ) {
      toast.error('Заполните обязательные поля: имя, фамилия, дата найма и ставка (>=0)');
      return;
    }

    if (!editingEmployeeId && (!email.trim() || password.length < 8)) {
      toast.error('Для нового работника нужны email и пароль (8+ символов)');
      return;
    }

    setSubmitLoading(true);

    try {
      const empPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        hireDate,
        hourlyRate: Number(hourlyRate),
        passportSeries: passportSeries.trim() || undefined,
        passportNumber: passportNumber.trim() || undefined,
        passportIssuedBy: passportIssuedBy.trim() || undefined,
        passportIssueDate: passportIssueDate || undefined,
        passportDivisionCode: passportDivisionCode.trim() || undefined,
        passportRegistrationAddress: passportRegistrationAddress.trim() || undefined,
      };

      if (editingEmployeeId) {
        const res = await fetch(`${API_URL}/employees/${editingEmployeeId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(empPayload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message || 'Ошибка обновления сотрудника');
        }
        const linkedUserId = list.find((item) => item.id === editingEmployeeId)?.user?.id;
        if (linkedUserId && (email.trim() || password.trim())) {
          const userRes = await fetch(`${API_URL}/users/${linkedUserId}/credentials`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: email.trim() || undefined,
              password: password.trim() || undefined,
            }),
          });
          if (!userRes.ok) {
            const err = await userRes.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Ошибка обновления логина/пароля');
          }
        }
        toast.success('Сотрудник обновлён');
      } else {
        const empRes = await fetch(`${API_URL}/employees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(empPayload),
        });
        if (!empRes.ok) {
          const err = await empRes.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message || 'Ошибка создания сотрудника');
        }
        const newEmployee = await empRes.json();

        // then create user and link to employee
        const res = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            role: 'Employee',
            employeeId: newEmployee.id,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message || 'Ошибка создания пользователя');
        }
        const newUser = await res.json();
        toast.success('Рабочий добавлен. Логин: ' + newUser.email);
      }

      loadUsers();
      resetFormFields();
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось сохранить работника');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <UsersIcon className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
          Рабочие (команда)
        </h1>
        <Button
          type="button"
          onClick={() => {
            if (showForm) {
              resetFormFields();
              setShowForm(false);
            } else {
              openAddForm();
            }
          }}
          style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none' }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {showForm ? 'Отмена' : 'Добавить рабочего'}
        </Button>
      </div>

      <div className="rounded-xl border p-4" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <div className="font-semibold">Работник месяца</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {employeeOfMonth
                ? `${employeeOfMonth.employee.firstName} ${employeeOfMonth.employee.lastName}${employeeOfMonth.message ? ` - ${employeeOfMonth.message}` : ''}`
                : 'Пока не назначен'}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6 border"
          style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
        >
          <h2 className="text-lg font-semibold mb-4">
            {editingEmployeeId ? 'Редактирование сотрудника' : 'Новый рабочий: логин и пароль'}
          </h2>
          <form onSubmit={handleAddWorker} className="space-y-4 max-w-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Email (логин)
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="worker@company.com"
                required={!editingEmployeeId}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                {editingEmployeeId ? 'Новый пароль (необязательно)' : 'Пароль (не менее 8 символов)'}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required={!editingEmployeeId}
                minLength={editingEmployeeId && !password ? undefined : 8}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Имя
              </label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Иван"
                required
                maxLength={100}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Фамилия
              </label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Петров"
                required
                maxLength={100}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Телефон
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 999 123-45-67"
                maxLength={15}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Дата найма
              </label>
              <Input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Почасовая ставка, ₽/ч
              </label>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                min={0}
                step={0.01}
                required
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Серия паспорта
              </label>
              <Input
                type="text"
                value={passportSeries}
                onChange={(e) => setPassportSeries(e.target.value)}
                placeholder="1234"
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Номер паспорта
              </label>
              <Input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="567890"
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Кем выдан
              </label>
              <Input
                type="text"
                value={passportIssuedBy}
                onChange={(e) => setPassportIssuedBy(e.target.value)}
                placeholder="УМВД России..."
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Дата выдачи паспорта
              </label>
              <Input
                type="date"
                value={passportIssueDate}
                onChange={(e) => setPassportIssueDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Код подразделения
              </label>
              <Input
                type="text"
                value={passportDivisionCode}
                onChange={(e) => setPassportDivisionCode(e.target.value)}
                placeholder="000-000"
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Адрес регистрации
              </label>
              <Input
                type="text"
                value={passportRegistrationAddress}
                onChange={(e) => setPassportRegistrationAddress(e.target.value)}
                placeholder="г. Москва, ул..."
                className="rounded-lg"
              />
            </div>
            </div>
            <Button type="submit" disabled={submitLoading} style={{ background: 'var(--accent-primary)', color: '#fff' }}>
              {submitLoading ? (editingEmployeeId ? 'Сохранение...' : 'Создание...') : (editingEmployeeId ? 'Сохранить' : 'Создать учётную запись')}
            </Button>
          </form>
        </motion.div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)' }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
            Загрузка...
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
            Пока нет пользователей. Добавьте рабочего.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                <th className="text-left p-3">Имя</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Телефон</th>
                <th className="text-left p-3">Дата найма</th>
                <th className="text-left p-3">Ставка, ₽/ч</th>
                <th className="text-left p-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-t" style={{ borderColor: 'var(--glass-border)' }}>
                  <td className="p-3">{u.firstName} {u.lastName}</td>
                  <td className="p-3 font-mono text-sm">{u.user?.email || u.email || '-'} </td>
                  <td className="p-3">{u.phone || '-'}</td>
                  <td className="p-3">{u.hireDate ? new Date(u.hireDate).toLocaleDateString('ru') : '-'}</td>
                  <td className="p-3">{u.hourlyRate != null ? u.hourlyRate.toLocaleString('ru-RU') : '-'} </td>
                  <td className="p-3 flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handleStartEdit(u)}
                      className="px-2 py-1"
                    >
                      Редактировать
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleAssignEmployeeOfMonth(u)}
                      className="px-2 py-1"
                      style={{ background: 'var(--accent-primary)', color: '#fff' }}
                    >
                      Работник месяца
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDeleteEmployee(u.id, `${u.firstName} ${u.lastName}`)}
                      className="px-2 py-1"
                      variant="destructive"
                    >
                      Удалить
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
