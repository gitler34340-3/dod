# 🎨 Hard Blocker: Цвета, Анимации, UI Спецификация
## Complete Color Palette (HEX) + Tailwind Config + Дизайн Указания

**Версия:** 1.0  
**Фокус:** Color System, Animations, Darkmode, Responsive

---

## 📋 Оглавление

1. [Color Palette (HEX Codes)](#color-palette)
2. [Tailwind Extended Config](#tailwind-config)
3. [UI Component Specifications](#ui-component-specs)
4. [Animations Deep Dive](#animations)
5. [DarkMode Strategy](#darkmode)
6. [Responsive Design](#responsive)

---

## 🎨 Color Palette

### Концепция

**Fusion:** Dodo Pizza (modern, orange) + Red Dead Redemption 2 (vintage, western)

```
ДОМИНИРУЮЩИЕ:
├─ Dodo Orange (современность, действие)
└─ Parchment (старина, история)

ПОДДЕРЖИВАЮЩИЕ:
├─ Wood Tones (структура, рамка)
├─ Ink Colors (текст, контрастность)
└─ Status Colors (feedback, действие)
```

### Полная Палитра

```ini
# ========== DODO ORANGE (Додо) ==========

dodo-50   = #FFF7F0
dodo-100  = #FFE6D5
dodo-200  = #FFCCAA
dodo-300  = #FFB380
dodo-400  = #FF9955
dodo-500  = #FF8833  ← Основной оранжевый
dodo-600  = #FF6B35  ← Основной (более острый)
dodo-700  = #E55100
dodo-800  = #CC4400
dodo-900  = #992200

# ========== PARCHMENT (Пергамент) ==========

parchment-50   = #FFFEF8
parchment-100  = #FBF9F3
parchment-150  = #F5EFE8
parchment-200  = #F5E6D3  ← Основной пергамент
parchment-250  = #EDD9BB
parchment-300  = #E8D7C3
parchment-350  = #E0CEBB
parchment-400  = #D4C4B0
parchment-450  = #C8B8A4

# ========== WOOD (Дерево) ==========

wood-50    = #F5F3F1
wood-100   = #E8E5E0
wood-200   = #D4C8BD
wood-300   = #B8A99D
wood-400   = #8B7D70
wood-500   = #6B5D50  ← Middle wood
wood-600   = #6B5344  ← Medium wood
wood-700   = #544033
wood-800   = #4A3728  ← Dark wood (borders)
wood-900   = #3D2F24

# ========== INK (Чернила) ==========

ink-50    = #F9F8F7
ink-100   = #EDE9E4
ink-200   = #D4C8BD
ink-300   = #9E9891
ink-400   = #6B6560
ink-500   = #5C4A41  ← Secondary text
ink-600   = #4A3D37
ink-700   = #3D302A
ink-800   = #2C1810  ← Primary text (very dark)
ink-900   = #1A0F0A

# ========== SEPIA (Сепия / Тёплые Оттенки) ==========

sepia-50   = #FBF5F0
sepia-100  = #F5E6D3
sepia-200  = #E8D4B8
sepia-300  = #D4B896
sepia-400  = #C99860
sepia-500  = #A67C52  ← Основной сепия (старое фото)
sepia-600  = #8B6439
sepia-700  = #6B4F30
sepia-800  = #543F24
sepia-900  = #3D2F18

# ========== STATUS COLORS (Статусы Документов) ==========

status-approve  = #2D5016  ← Зелёный (sheriff star)
status-pending  = #C79C3F  ← Золотой (wax seal)
status-reject   = #8B0000  ← Тёмный красный (wanted)
status-expired  = #D4522D  ← Ржавый оранжевый

# ========== FUNCTIONAL COLORS ==========

success  = #2D5016
warning  = #FFB300
danger   = #D32F2F
info     = #1976D2

# ========== GRAY NEUTRAL (для secondary текста) ==========

neutral-50   = #FAFAFA
neutral-100  = #F5F5F5
neutral-200  = #EEEEEE
neutral-300  = #E0E0E0
neutral-400  = #BDBDBD
neutral-500  = #9E9E9E
neutral-600  = #757575
neutral-700  = #616161
neutral-800  = #424242
neutral-900  = #212121
```

### Как Использовать в Tailwind

```tsx
// TEXT
className="text-ink-800"          // Dark (very dark brown)
className="text-ink-600"          // Secondary
className="text-sepia-600"        // Old-style text

// BACKGROUNDS
className="bg-parchment-200"      // Main background (old paper)
className="bg-wood-800"           // Dark borders, frames
className="bg-dodo-600"           // Call-to-action button

// BORDERS
className="border-wood-800"       // Dark borders
className="border-dodo-600"       // Orange accent borders
className="border-parchment-300"  // Light dividers

// STATUS
className="bg-status-approve"     // Green (approved)
className="bg-status-pending"     // Gold (pending)
className="bg-status-reject"      // Red (rejected)
className="bg-status-expired"     // Rust orange (expired)
```

---

## 🎨 Tailwind Extended Config

**Файл:** `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DODO ORANGE
        dodo: {
          50: '#FFF7F0',
          100: '#FFE6D5',
          200: '#FFCCAA',
          300: '#FFB380',
          400: '#FF9955',
          500: '#FF8833',
          600: '#FF6B35',
          700: '#E55100',
          800: '#CC4400',
          900: '#992200',
        },
        
        // PARCHMENT
        parchment: {
          50: '#FFFEF8',
          100: '#FBF9F3',
          150: '#F5EFE8',
          200: '#F5E6D3',
          250: '#EDD9BB',
          300: '#E8D7C3',
          350: '#E0CEBB',
          400: '#D4C4B0',
          450: '#C8B8A4',
        },
        
        // WOOD
        wood: {
          50: '#F5F3F1',
          100: '#E8E5E0',
          200: '#D4C8BD',
          300: '#B8A99D',
          400: '#8B7D70',
          500: '#6B5D50',
          600: '#6B5344',
          700: '#544033',
          800: '#4A3728',
          900: '#3D2F24',
        },
        
        // INK
        ink: {
          50: '#F9F8F7',
          100: '#EDE9E4',
          200: '#D4C8BD',
          300: '#9E9891',
          400: '#6B6560',
          500: '#5C4A41',
          600: '#4A3D37',
          700: '#3D302A',
          800: '#2C1810',
          900: '#1A0F0A',
        },
        
        // SEPIA
        sepia: {
          50: '#FBF5F0',
          100: '#F5E6D3',
          200: '#E8D4B8',
          300: '#D4B896',
          400: '#C99860',
          500: '#A67C52',
          600: '#8B6439',
          700: '#6B4F30',
          800: '#543F24',
          900: '#3D2F18',
        },
        
        // STATUS
        status: {
          approve: '#2D5016',
          pending: '#C79C3F',
          reject: '#8B0000',
          expired: '#D4522D',
        },
      },
      
      // ========== ANIMATIONS ==========
      keyframes: {
        stampHit: {
          '0%': {
            transform: 'scale(1.3) rotate(45deg)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(0.95) rotate(-5deg)',
          },
          '100%': {
            transform: 'scale(1) rotate(0deg)',
            opacity: '0.8',
          },
        },
        
        sealPulse: {
          '0%': {
            boxShadow: '0 0 10px rgba(255, 107, 53, 0.5)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 25px rgba(255, 107, 53, 0.8)',
            transform: 'scale(1.05)',
          },
          '100%': {
            boxShadow: '0 0 10px rgba(255, 107, 53, 0.5)',
            transform: 'scale(1)',
          },
        },
        
        pageFlip: {
          '0%': {
            transform: 'rotateY(0deg)',
          },
          '50%': {
            transform: 'rotateY(90deg)',
          },
          '100%': {
            transform: 'rotateY(0deg)',
          },
        },
        
        emberPulse: {
          '0%': {
            boxShadow: '0 0 5px rgba(255, 107, 53, 0.3)',
            opacity: '0.3',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(255, 107, 53, 0.8)',
            opacity: '0.8',
          },
          '100%': {
            boxShadow: '0 0 5px rgba(255, 107, 53, 0.3)',
            opacity: '0.3',
          },
        },
        
        burnEffect: {
          '0%': {
            backgroundColor: 'rgba(245, 230, 211, 1)',
            opacity: '1',
          },
          '50%': {
            backgroundColor: 'rgba(212, 196, 176, 1)',
            opacity: '0.8',
          },
          '100%': {
            backgroundColor: 'rgba(230, 204, 170, 1)',
            opacity: '0.9',
          },
        },
      },
      
      animation: {
        stampHit: 'stampHit 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        sealPulse: 'sealPulse 2s ease-in-out infinite',
        pageFlip: 'pageFlip 0.4s ease-in-out',
        emberPulse: 'emberPulse 1.5s ease-in-out infinite',
        burnEffect: 'burnEffect 1s ease-out',
      },
      
      // ========== SHADOWS (Saloon-style) ==========
      boxShadow: {
        'saloon-dark': '0 10px 30px rgba(0, 0, 0, 0.4)',
        'saloon-light': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'saloon-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
        'wood-frame': '0 0 0 8px #4A3728, inset 0 0 0 3px #6B5344',
      },
      
      // ========== FONTS ==========
      fontFamily: {
        serif: ['Georgia', 'Garamond', 'serif'],
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      
      // ========== BORDERS ==========
      borderRadius: {
        'saloon': '2px',
        'saloon-lg': '6px',
      },
      
      // ========== SPACING: наследуется из Tailwind defaults ==========
    },
  },
  plugins: [],
}

export default config
```

---

## 🖼️ UI Component Specifications

### 1. GatekeeperBlockscreen (Full Screen)

**Когда:** Сотрудник без обязательного документа

**Визуал:**
```
┌────────────────────────────────────────────┐
│ Полный экран, wood-800 фон                │
│                                            │
│        ┌──────────────────────────┐       │
│        │ parchment-200 card       │       │
│        │ border: wood-800 4px     │       │
│        │                          │       │
│        │  🔐 (size: 7xl)          │       │
│        │                          │       │
│        │  "ДОСТУП ОГРАНИЧЕН"      │       │
│        │  text-ink-800, serif,    │       │
│        │  text-3xl, font-black    │       │
│        │                          │       │
│        │  📋 (size: 6xl)          │       │
│        │                          │       │
│        │  Медицинская книжка      │       │
│        │  text-2xl, serif, bold   │       │
│        │                          │       │
│        │  [⏳ PENDING badge]       │       │
│        │                          │       │
│        │  "Без этого..."          │       │
│        │  text-sm, serif, italic  │       │
│        │                          │       │
│        │  [Upload Zone - dashed]  │       │
│        │                          │       │
│        │  [🔄 Загрузить] orange   │       │
│        │  button, dodo-600        │       │
│        │                          │       │
│        └──────────────────────────┘       │
│                                            │
└────────────────────────────────────────────┘
```

**Tailwind Classes:**
```tsx
<div className="fixed inset-0 flex items-center justify-center bg-wood-800 z-50">
  <div className="
    bg-parchment-200
    border-4 border-wood-800
    rounded-lg
    p-8
    max-w-md
    shadow-saloon-dark
  ">
    {/* Content */}
  </div>
</div>
```

---

### 2. DocumentRequestBanner (Top Alert)

**Когда:** Админ отправил ордер на документ

**Визуал:**
```
┌─────────────────────────────────────────────────┐
│ 🚨|ТРЕБУЕТСЯ: Медицинская книжка              [X]│
│   |СРОЧНО! Без этого не возьму в смены    [ОТКРЫТЬ]│
│   |⏰ Дедлайн: 31.03.2026                       │
└─────────────────────────────────────────────────┘
 ↑
 status-reject (red background)
```

**Tailwind:**
```tsx
<motion.div
  className={`
    fixed top-0 left-0 right-0
    z-40
    bg-status-reject
    border-b-4 border-status-reject
    p-4
    shadow-lg
  `}
>
```

---

### 3. DocumentCard (Small Component)

**Когда:** Документ в списке

**Визуал:**
```
┌──────────────────────────────┐
│ 📋 Паспорт                   │
├──────────────────────────────┤
│ Статус: ✅ АКТИВЕН           │ ← status-approve green
│ Выдано: 15.06.2015           │
│ Действует до: 15.06.2025     │ ← will turn red at expired
│                              │
│ [📥 Скачать] [🔄 Обновить]   │
└──────────────────────────────┘
```

**Color Mapping:**
- ✅ approved → status-approve (green)
- ⏳ pending → status-pending (gold)
- ✗ rejected → status-reject (red)
- ⚠ expired → status-expired (rust)

---

### 4. Admin Dashboard (Амбарная Книга)

**Визуал (Split Screen):**
```
┌─────────────────────────────────────────────┐
│ АМБАРНАЯ КНИГА                  [ОРДЕРЫ] 📋 │
├──────────────────┬──────────────────────────┤
│ Pending Documents│ Документ Preview/Details  │
│                  │                          │
│ 1. Иван Петров  │ Название: Паспорт        │
│    Паспорт      │ Статус: Pending          │
│    [2 дня]      │ Загружен: 28.03.2026     │
│                  │ 📄 [PDF Preview]         │
│ 2. Мария Смирн. │                          │
│    Медкнижка    │ [✅ Approve] [❌ Reject] │
│    [⚠ EXPIRED]  │                          │
│                  │                          │
│ 3. Петр Сидоров│                          │
│    ДМС         │                          │
│                  │                          │
└──────────────────┴──────────────────────────┘
```

**Color:**
- Main background: parchment-200
- Left panel: parchment-150
- Right panel: parchment-100
- Approve button: status-approve
- Reject button: status-reject

---

## 🎬 Animations Deep Dive

### 1. Stamp Hit Animation

**Когда:** Admin кликает "Approve"

**Код:**
```css
@keyframes stampHit {
  0% {
    transform: scale(1.3) rotate(45deg);
    opacity: 1;
    filter: drop-shadow(0 0 10px rgba(255, 107, 53, 0.6));
  }
  50% {
    transform: scale(0.95) rotate(-5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.8;
  }
}

.stamp-animation {
  animation: stampHit 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**React:**
```tsx
<motion.div
  animate={{ scale: [1.3, 0.95, 1], rotate: [45, -5, 0] }}
  transition={{ duration: 0.6 }}
  className="text-6xl"
>
  ✅ APPROVED
</motion.div>
```

---

### 2. Ember Pulse (Drop Zone)

**Когда:** Файл драгается над зоной загрузки

**Визуал:**
```
        ◌ ◌ ◌               ember particles
        
   ┌──────────────┐
   │ DRAG FILE    │ ← border turns orange
   │   HERE       │ ← particles glow
   │ ◌ ◌ ◌        │
   └──────────────┘
        ◌ ◌ ◌
```

**Код:**
```css
@keyframes emberPulse {
  0% {
    box-shadow: 0 0 5px rgba(255, 107, 53, 0.3);
    opacity: 0.3;
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 107, 53, 0.8);
    opacity: 0.8;
  }
  100% {
    box-shadow: 0 0 5px rgba(255, 107, 53, 0.3);
    opacity: 0.3;
  }
}

.drop-zone-active {
  animation: emberPulse 1.5s ease-in-out infinite;
  background: rgba(255, 107, 53, 0.05);
}
```

---

### 3. Page Flip (Tab Switching)

**Когда:** Переходит между Pending/WANTED табами

**Визуал:**
```
  ╱╱╱╱╱    (tab1 уходит за горизонт)
 ║ TAB1║
 ║════ ║
         ╲╲╲╲╲    (tab2 приходит)
        ║ TAB2║
        ║════ ║
```

**Код:**
```css
@keyframes pageFlip {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(90deg); }
  100% { transform: rotateY(0deg); }
}

.tab-flip {
  animation: pageFlip 0.4s ease-in-out;
  perspective: 1000px;
}
```

---

### 4. Burn Effect (Document Approved)

**Когда:** Документ переходит в active

**Визуал:** Бумага то светлеет то темнеет (как от жара)

```css
@keyframes burnEffect {
  0% {
    background-color: rgba(245, 230, 211, 1);
    opacity: 1;
  }
  50% {
    background-color: rgba(212, 196, 176, 1);
    opacity: 0.8;
  }
  100% {
    background-color: rgba(230, 204, 170, 1);
    opacity: 0.9;
  }
}

.document-approved {
  animation: burnEffect 1s ease-out;
}
```

---

## 🌙 DarkMode Strategy

**Подход:** Сохраняем Western aesthetic в обеих темах

### Light Mode (Default)

```
Background: parchment-200 (светлый пергамент)
Text: ink-800 (тёмные чернила)
Accent: dodo-600 (оранжевый)
Borders: wood-800 (тёмное дерево)
```

### Dark Mode (@media prefers-color-scheme: dark)

```typescript
// Если добавить support для darkmode:

const darkConfig = {
  colors: {
    // Более тёмные версии база
    parchment: {
      200: '#3E3428', // почти чёрный пергамент
      300: '#4A3D34',
    },
    ink: {
      800: '#F5E6D3', // инвертированный (свет вместо тёмного)
    },
    wood: {
      800: '#8B7D70', // осветлённое тёмное дерево
    },
  },
};
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind defaults + Custom)

```typescript
screens: {
  'xs': '320px',   // Mobile small
  'sm': '640px',   // Mobile
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Desktop large
  '2xl': '1536px', // Desktop XL
}
```

### Примеры Адаптивности

**GatekeeperBlockscreen:**
```tsx
<div className="
  p-8         // Desktop
  md:p-6
  sm:p-4      // Mobile
  
  max-w-md    // Desktop max
  w-full      // Fill на мобайл
  sm:max-w-sm // Smaller на телефоне
">
```

**AdminDashboard:**
```tsx
<div className="
  grid grid-cols-2 gap-4  // Desktop: 2 column
  md:grid-cols-1          // Tablet: 1 column
  sm:grid-cols-1          // Mobile: 1 column
">
```

---

## 🎨 CSS Utility Classes

**Добавить в globals.css:**

```css
/* Paper Texture */
.bg-paper-texture {
  background-image:
    linear-gradient(45deg, transparent 45%, rgba(0, 0, 0, 0.01) 45%),
    linear-gradient(-45deg, transparent 45%, rgba(0, 0, 0, 0.01) 45%);
  background-size: 2px 2px;
  background-color: #F5E6D3;
}

/* Wood Texture */
.bg-wood-texture {
  background-image: repeating-linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.05) 0px,
    transparent 1px,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 3px
  ),
  repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.03) 0px,
    transparent 1px,
    transparent 2px,
    rgba(0, 0, 0, 0.02) 3px
  );
  background-color: #4A3728;
}

/* Serif Text (Old Document Feel) */
.font-serif-old {
  font-family: 'Georgia', 'Garamond', serif;
  font-weight: 400;
  letter-spacing: 0.5px;
}

/* Saloon Shadow */
.shadow-saloon {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Stamp Effect */
.stamp-style {
  border: 3px dashed #FF6B35;
  border-radius: 50%;
  transform: rotate(-15deg);
  opacity: 0.8;
  font-weight: black;
  color: #FF6B35;
}
```

---

## 🎯 Design Checklist

**Colour Usage:**
- [ ] Text = ink-800 or ink-600
- [ ] Background = parchment-200 or wood-800
- [ ] CTA Buttons = dodo-600
- [ ] Borders = wood-800 or parchment-300
- [ ] Status = status-* colors

**Animations:**
- [ ] Approve action = stampHit
- [ ] Drop zone hover = emberPulse
- [ ] Tab switch = pageFlip
- [ ] Document update = burnEffect

**Typography:**
- [ ] Headlines = serif, bold, ink-800
- [ ] Body = serif or sans depending on context, ink-600
- [ ] Small text = sans, ink-500

**Components:**
- [ ] GatekeeperBlockscreen = parchment bg, wood borders
- [ ] DocumentRequestBanner = status-reject bg
- [ ] AdminDashboard = split screen, wood frame
- [ ] All buttons = dodo-600 hover:dodo-700

---

## 📐 Font System

```css
/* Headings: Serif (Old Document) */
h1, h2, h3 {
  font-family: 'Georgia', serif;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Body: Can be Sans or Serif depending on section */
body {
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
}

/* Small: Monospace for codes/serial numbers */
.font-mono {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

/* Important warnings: Bold Serif */
.font-bold-serif {
  font-family: 'Georgia', serif;
  font-weight: 700;
  letter-spacing: 1px;
}
```

---

## 🚀 Quick Color Reference Sheet

**Copy-Paste for Tailwind:**

```
Orange Accents:       dodo-600
Paper Background:     parchment-200
Dark Borders:         wood-800
Text (main):          ink-800
Text (secondary):     ink-600
Approved Status:      status-approve
Pending Status:       status-pending
Rejected Status:      status-reject
Expired Status:       status-expired
```

---

**Версия:** 1.0  
**Статус:** 🎨 Design System Ready  
**Next:** Implement in Figma / Adobe XD based on this spec

**Проверьте:**
- [ ] Color palette в Figma copied from this doc
- [ ] Typography scale established
- [ ] Animations implemented in Framer Motion
- [ ] Components follow responsive breakpoints
- [ ] DarkMode support planned
