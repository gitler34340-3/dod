# 🧩 Компоненты - Техническая документация

## 📁 Структура компонентов

### Основные экраны (Screens)

#### `DashboardScreen.tsx`
**Путь**: `/src/app/components/DashboardScreen.tsx`  
**Роут**: `/home`

Главный дашборд приложения.

**Импорты**:
```typescript
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { SalaryBlock } from '@/app/components/SalaryBlock';
import { ShiftsDistributionChart } from '@/app/components/charts/ShiftsDistributionChart';
import { KPIChart } from '@/app/components/charts/KPIChart';
```

**Состояние**:
- `showNotifications: boolean` - отображение выпадающего меню уведомлений

**Данные**:
- `upcomingShifts: Shift[]` - ближайшие 3 смены
- `notifications: Notification[]` - список уведомлений
- `quickStats` - быстрая статистика (4 карточки)

**Особенности**:
- Проверяет `localStorage.getItem('training_completed')` для показа баннера обучения
- Интерактивные карточки статистики с навигацией
- Выпадающее меню уведомлений с анимациями

---

#### `ProfileScreen.tsx`
**Путь**: `/src/app/components/ProfileScreen.tsx`  
**Роут**: `/profile`

Личный кабинет сотрудника.

**Типы**:
```typescript
type Tab = 'overview' | 'documents' | 'achievements' | 'training';
```

**Состояние**:
- `activeTab: Tab` - активная вкладка

**Данные**:
- `achievements: Achievement[]` - массив достижений с редкостью
- `documents: Document[]` - массив документов со статусами
- `training: TrainingModule[]` - пройденные модули обучения

**Методы**:
- `toggleAchievementVisibility(id)` - переключение публичности ачивки
- `getRarityColor(rarity)` - цвет по редкости
- `getStatusColor(status)` - цвет по статусу

**Особенности**:
- 4 вкладки с разным контентом
- Аватар размера XL
- Интерактивные ачивки с звёздочками

---

#### `ImprovedScheduleScreen.tsx`
**Путь**: `/src/app/components/ImprovedScheduleScreen.tsx`  
**Роут**: `/schedule`

Улучшенная страница управления сменами.

**Типы**:
```typescript
type ViewMode = 'list' | 'calendar';
interface Shift {
  status: 'confirmed' | 'pending' | 'conflict' | 'draft' | 'rejected';
}
```

**Состояние**:
- `selectedShift: Shift | null` - выбранная смена для действий
- `showReplaceModal: boolean` - модалка обмена
- `showCreateModal: boolean` - модалка создания
- `viewMode: ViewMode` - режим просмотра

**Методы**:
- `handleRequestReplace()` - запрос обмена сменой
- `handleSubmitDraft(shiftId)` - отправка черновика на утверждение
- `handleCreateShift()` - создание новой смены

**Особенности**:
- 5 статусов смен с разными цветами
- Кнопки действий в зависимости от статуса
- Календарный вид (заглушка)
- Статистика по статусам

---

#### `StoryScreen.tsx`
**Путь**: `/src/app/components/StoryScreen.tsx`  
**Роут**: `/story`

Интерактивное обучение в формате stories.

**Состояние**:
- `currentStoryIndex: number` - текущая глава (0-4)
- `isPaused: boolean` - пауза
- `progress: number` - прогресс текущей главы

**Данные**:
- `stories: Story[]` - 5 глав обучения

**Методы**:
- `handleNext()` - следующая глава
- `handlePrevious()` - предыдущая глава
- `handleComplete()` - завершение обучения

**Особенности**:
- Сохраняет `training_completed` в localStorage
- Свайпы для навигации (touchscreen)
- Прогресс-бар вверху
- Анимации между главами

---

### Вспомогательные компоненты

#### `ThemeToggle.tsx`
**Путь**: `/src/app/components/ThemeToggle.tsx`

Переключатель темы с анимацией.

**Использование**:
```typescript
import { ThemeToggle } from '@/app/components/ThemeToggle';
<ThemeToggle />
```

**Особенности**:
- Использует `useTheme()` из ThemeContext
- Анимация вращения иконок (Moon/Sun)
- Hover эффект red-glow

---

#### `SalaryBlock.tsx`
**Путь**: `/src/app/components/SalaryBlock.tsx`

Блок зарплаты с графиком.

**Типы**:
```typescript
type Period = 'day' | 'week' | 'month' | 'year' | 'all';
```

**Состояние**:
- `selectedPeriod: Period` - выбранный период

**Данные**:
- `periods` - массив кнопок периодов
- `getSalaryData()` - данные по периоду (amount, change)

**Особенности**:
- Wanted poster стилистика (диагональные полосы)
- Индикатор роста/падения
- Интеграция с SalaryChart
- Адаптивная высота графика

---

#### `InteractiveStats.tsx`
**Путь**: `/src/app/components/InteractiveStats.tsx`

Интерактивная статистика с модальными окнами.

**Состояние**:
- `selectedStat: Stat | null` - выбранная карточка

**Данные**:
- `stats: Stat[]` - 4 карточки статистики

**Особенности**:
- Открывает модалку с деталями
- Показывает графики для смен и KPI
- Индикатор графика (точка в углу)

---

### Компоненты графиков (Charts)

#### `SalaryChart.tsx`
**Путь**: `/src/app/components/charts/SalaryChart.tsx`

Линейный график зарплаты.

**Props**:
```typescript
interface SalaryChartProps {
  period: 'day' | 'week' | 'month' | 'year' | 'all';
}
```

**Особенности**:
- Chart.js Line chart
- Адаптация под тему (isDark)
- Данные по периодам
- Красная линия с градиентной заливкой
- Tooltips с форматированием (₽)

**Регистрация Chart.js**:
```typescript
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ...);
```

---

#### `ShiftsDistributionChart.tsx`
**Путь**: `/src/app/components/charts/ShiftsDistributionChart.tsx`

Круговая диаграмма распределения смен.

**Особенности**:
- Chart.js Doughnut chart
- 4 категории: Утренние, Дневные, Вечерние, Ночные
- Градации красного/оранжевого
- Legend внизу
- Tooltips с количеством смен

---

#### `KPIChart.tsx`
**Путь**: `/src/app/components/charts/KPIChart.tsx`

Столбчатая диаграмма KPI.

**Особенности**:
- Chart.js Bar chart
- 2 dataset: Задачи выполнены, KPI балл
- По дням недели (Пн-Вс)
- Красные и оранжевые столбцы
- Rounded corners (borderRadius: 6)

---

### UI компоненты

#### `ArthurMorganAvatar.tsx`
**Путь**: `/src/app/components/ArthurMorganAvatar.tsx`

Аватар персонажа.

**Props**:
```typescript
interface ArthurMorganAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}
```

**Размеры**:
- sm: 10x10 (2xl emoji)
- md: 16x16 (4xl emoji)
- lg: 24x24 (6xl emoji)
- xl: 32x32 (8xl emoji)

**Особенности**:
- Градиентная рамка (red-orange)
- Hover анимация (scale + rotate)
- Ковбойская шляпа emoji 🤠

---

### Контекст

#### `ThemeContext.tsx`
**Путь**: `/src/app/contexts/ThemeContext.tsx`

Context API для управления темой.

**Тип**:
```typescript
type Theme = 'dark' | 'light';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
```

**Использование**:
```typescript
import { useTheme } from '@/app/contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  // ...
}
```

**Особенности**:
- Сохранение в localStorage ('rdr2-theme')
- Установка атрибута `data-theme` на html
- Инициализация из localStorage или 'dark'

---

## 🎨 CSS классы и переменные

### Кастомные классы

**`rdr2-theme.css`**:
- `.glass` - glassmorphism эффект
- `.dust-effect` - эффект пыли/дымки
- `.glow-legendary` - красное пульсирующее свечение
- `.glow-rare` - фиолетовое свечение
- `.glow-common` - зелёное свечение
- `.card-shadow` - тень для карточек
- `.card-shadow-lg` - большая тень
- `.hover-red-glow` - красное свечение при hover
- `.animate-fadeInUp` - анимация появления снизу
- `.animate-scaleIn` - анимация масштабирования
- `.animate-bounceIn` - анимация отскока

### CSS переменные

**Тёмная тема**:
```css
--bg-primary: #0f0f0f;
--bg-secondary: #1a1a1a;
--accent-primary: #c1121f;
--text-primary: #ffffff;
```

**Светлая тема**:
```css
[data-theme="light"] {
  --bg-primary: #f5e6d3;
  --accent-primary: #a01010;
  --text-primary: #2c1810;
}
```

**Использование в компонентах**:
```tsx
<div style={{ background: 'var(--bg-primary)' }}>
  <p style={{ color: 'var(--text-primary)' }}>Text</p>
</div>
```

---

## 🔧 Утилиты и хелперы

### Форматирование данных

**Даты**:
```typescript
new Date().toLocaleDateString('ru-RU', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})
```

**Числа**:
```typescript
amount.toLocaleString('ru-RU') // 1234567 → 1 234 567
```

### LocalStorage ключи

- `rdr2-theme` - выбранная тема ('dark' | 'light')
- `training_completed` - статус обучения ('true' | null)

---

## 🧪 Тестирование компонентов

### Проверка темы

```typescript
// Проверить сохранение темы
localStorage.setItem('rdr2-theme', 'light');
// Перезагрузить страницу
// Должна загрузиться светлая тема
```

### Проверка графиков

```typescript
// В DashboardScreen проверить рендеринг
// Должны отобразиться 3 графика без ошибок
```

### Проверка смен

```typescript
// Создать смену
// Проверить статус "draft"
// Отправить на утверждение
// Статус должен измениться на "pending"
```

---

## 📦 Экспорты

### Основные компоненты
```typescript
export { DashboardScreen } from '@/app/components/DashboardScreen';
export { ProfileScreen } from '@/app/components/ProfileScreen';
export { ImprovedScheduleScreen } from '@/app/components/ImprovedScheduleScreen';
```

### Вспомогательные
```typescript
export { ThemeToggle } from '@/app/components/ThemeToggle';
export { SalaryBlock } from '@/app/components/SalaryBlock';
export { ArthurMorganAvatar } from '@/app/components/ArthurMorganAvatar';
```

### Графики
```typescript
export { SalaryChart } from '@/app/components/charts/SalaryChart';
export { ShiftsDistributionChart } from '@/app/components/charts/ShiftsDistributionChart';
export { KPIChart } from '@/app/components/charts/KPIChart';
```

### Контексты
```typescript
export { ThemeProvider, useTheme } from '@/app/contexts/ThemeContext';
```

---

## 🔍 Отладка

### Chart.js warnings

Если видите предупреждения Chart.js:
```
Chart.js: ... is not registered
```

**Решение**: Убедитесь, что все необходимые компоненты зарегистрированы:
```typescript
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
```

### Theme не применяется

**Проверить**:
1. ThemeProvider обёрнут вокруг RouterProvider в App.tsx
2. CSS переменные определены в rdr2-theme.css
3. Атрибут `data-theme` установлен на document.documentElement

### Графики не отображаются

**Проверить**:
1. chart.js и react-chartjs-2 установлены
2. Высота контейнера задана (например, `h-64`)
3. Данные передаются в правильном формате

---

## 📚 Дополнительные ресурсы

- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Motion Documentation](https://motion.dev/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)

---

Это техническая документация для разработчиков. Для пользователей смотрите `USER_MANUAL.md`.
