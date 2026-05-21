# Интеграция Supabase для Dodo Staff

## 📊 Зачем нужен Supabase?

В данный момент приложение работает с **mock данными** (тестовыми данными), которые хранятся локально в компонентах. Для полноценной работы приложения в продакшене необходима база данных и бэкенд.

**Supabase** предоставит:
- 🔐 **Аутентификацию пользователей** - безопасный вход и управление сессиями
- 💾 **Базу данных PostgreSQL** - хранение всех данных о сменах, документах, ачивках
- 🔄 **Real-time обновления** - моментальное получение изменений без перезагрузки
- 📁 **Хранилище файлов** - загрузка и хранение PDF документов
- 🔔 **Push-уведомления** - оповещения о новых сменах и событиях

## 🗄️ Структура базы данных

### Таблица: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  position TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: `shifts`
```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT CHECK (status IN ('confirmed', 'pending', 'conflict')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: `documents`
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  size TEXT,
  signed BOOLEAN DEFAULT FALSE,
  urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: `achievements`
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'legendary')),
  icon TEXT,
  max_progress INTEGER
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  unlocked BOOLEAN DEFAULT FALSE,
  progress INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);
```

### Таблица: `stories`
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  character_emoji TEXT,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Примеры кода для интеграции

### 1. Инициализация Supabase клиента

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2. Аутентификация (Login)

```typescript
// LoginScreen.tsx - замена mock login
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    toast.error('Ошибка входа: ' + error.message);
  } else {
    navigate('/home');
  }
};
```

### 3. Получение смен (Schedule)

```typescript
// ScheduleScreen.tsx - замена mock data
const [shifts, setShifts] = useState<Shift[]>([]);

useEffect(() => {
  const fetchShifts = async () => {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', user?.user?.id)
      .order('date', { ascending: true });

    if (!error && data) {
      setShifts(data);
    }
  };

  fetchShifts();
}, []);
```

### 4. Real-time обновления смен

```typescript
// ScheduleScreen.tsx - real-time subscriptions
useEffect(() => {
  const channel = supabase
    .channel('shifts-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shifts'
      },
      (payload) => {
        // Обновляем список смен при изменениях
        fetchShifts();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### 5. Загрузка и подписание документов

```typescript
// DocumentsScreen.tsx
const handleUploadDocument = async (file: File) => {
  const { data: user } = await supabase.auth.getUser();
  
  // Загрузка файла в Storage
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('documents')
    .upload(`${user?.user?.id}/${file.name}`, file);

  if (!uploadError && uploadData) {
    // Создание записи в БД
    await supabase.from('documents').insert({
      user_id: user?.user?.id,
      title: file.name,
      type: 'PDF',
      file_url: uploadData.path,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });
  }
};

const handleSignDocument = async (docId: string) => {
  const { error } = await supabase
    .from('documents')
    .update({ signed: true })
    .eq('id', docId);

  if (!error) {
    toast.success('Документ подписан!');
  }
};
```

### 6. Система достижений

```typescript
// AchievementsScreen.tsx
const unlockAchievement = async (achievementId: string) => {
  const { data: user } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('user_achievements')
    .update({
      unlocked: true,
      unlocked_at: new Date().toISOString()
    })
    .eq('user_id', user?.user?.id)
    .eq('achievement_id', achievementId);

  if (!error) {
    // Показываем Steam-style уведомление
    setShowNewAchievement(true);
  }
};

const updateProgress = async (achievementId: string, progress: number) => {
  const { data: user } = await supabase.auth.getUser();
  
  await supabase
    .from('user_achievements')
    .update({ progress })
    .eq('user_id', user?.user?.id)
    .eq('achievement_id', achievementId);
};
```

## 🔒 Row Level Security (RLS)

Для безопасности данных необходимо настроить RLS политики:

```sql
-- Пользователи видят только свои смены
CREATE POLICY "Users can view own shifts"
  ON shifts FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи видят только свои документы
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи видят только свои достижения
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);
```

## 📱 Переменные окружения

Создайте файл `.env.local`:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🚀 Следующие шаги

1. **Подключите проект к Supabase** через Figma Make
2. **Создайте таблицы** в Supabase Dashboard
3. **Настройте RLS политики** для безопасности
4. **Замените mock данные** на реальные запросы к БД
5. **Добавьте real-time подписки** для живых обновлений
6. **Настройте Storage** для хранения документов

## ⚠️ Важные замечания

- Figma Make **НЕ предназначен** для сбора PII (персональных данных)
- НЕ храните в приложении чувствительные данные (паспорта, ИНН, и т.д.)
- Используйте только для **демонстрационных** и **обучающих** целей
- Для продакшена требуется дополнительная настройка безопасности

## 📚 Полезные ссылки

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**Совет**: Начните с простой аутентификации, затем добавляйте функции постепенно, тестируя каждый этап! 🚀
