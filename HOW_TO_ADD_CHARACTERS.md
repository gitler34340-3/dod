# 🤠 Как добавить PNG картинки персонажей RDR2

## Быстрый старт

### Шаг 1: Подготовьте изображения
Скачайте или создайте PNG изображения персонажей из Red Dead Redemption 2:

**Рекомендуемые персонажи:**
1. Arthur Morgan (arthur-morgan.png)
2. Dutch van der Linde (dutch-van-der-linde.png)
3. John Marston (john-marston.png)
4. Hosea Matthews (hosea-matthews.png)
5. Sadie Adler (sadie-adler.png)
6. Charles Smith (charles-smith.png)

### Шаг 2: Поместите файлы в папку
```
/public/characters/
  ├── arthur-morgan.png
  ├── dutch-van-der-linde.png
  ├── john-marston.png
  ├── hosea-matthews.png
  ├── sadie-adler.png
  └── charles-smith.png
```

### Шаг 3: Проверьте результат
После добавления файлов:
1. Перезапустите dev сервер (если нужно)
2. Откройте главную страницу дашборда
3. Прокрутите вниз до секции "🤠 Команда Банды"
4. Картинки персонажей загрузятся автоматически!

---

## Требования к изображениям

### Формат
- **Тип**: PNG с прозрачным фоном
- **Размер**: 400x400px (минимум) - квадратное соотношение
- **Вес**: До 500KB на изображение

### Качество
- Высокое разрешение для четкости на retina дисплеях
- Центрированный портрет персонажа
- Без лишнего белого пространства

### Стиль
- Официальные арты или рендеры из игры
- Единый стиль для всех персонажей
- Желательно с похожим освещением

---

## Где взять изображения

### Рекомендуемые источники:

1. **PNG Wing** - https://www.pngwing.com/
   - Поиск: "Red Dead Redemption 2 Arthur Morgan PNG"
   - Много качественных PNG с прозрачным фоном

2. **PNG Tree** - https://pngtree.com/
   - Поиск: "RDR2 characters PNG transparent"
   - Бесплатные и платные варианты

3. **Freepik** - https://www.freepik.com/
   - Поиск: "red dead redemption characters cutout"
   - Требуется регистрация

4. **DeviantArt** - https://www.deviantart.com/
   - Поиск: "RDR2 character render PNG"
   - Много фан-артов

5. **Remove.bg** - https://www.remove.bg/
   - Если нужно убрать фон с существующего изображения

---

## Как это работает

### Автоматическое определение путей
Компонент `CharacterCard` автоматически генерирует путь к изображению:

```tsx
// Имя персонажа: "Arthur Morgan"
// Путь к файлу: "/characters/arthur-morgan.png"

const imagePath = `/characters/${name.toLowerCase().replace(/\s+/g, '-')}.png`;
```

### Fallback при ошибке
Если изображение не найдено, показывается эмодзи 🤠:

```tsx
<img 
  src="/characters/arthur-morgan.png"
  alt="Arthur Morgan"
  onError={() => setImageError(true)} // Показывает 🤠
/>
```

---

## Добавление новых персонажей

Чтобы добавить новых персонажей, отредактируйте массив в `/src/app/components/DashboardScreen.tsx`:

```tsx
const characters = [
  { name: 'Arthur Morgan', role: 'Главный стрелок', color: 'var(--accent-primary)' },
  { name: 'Dutch van der Linde', role: 'Лидер банды', color: 'var(--orange-subtle)' },
  // ... добавьте своих персонажей:
  { name: 'Bill Williamson', role: 'Громила', color: '#8B4513' },
  { name: 'Javier Escuella', role: 'Разведчик', color: '#FFD700' },
];
```

Затем добавьте соответствующий PNG файл в `/public/characters/`.

---

## Пример структуры файлов

```
project/
├── public/
│   └── characters/
│       ├── README.md                    ← Инструкция
│       ├── arthur-morgan.png            ← PNG 400x400px
│       ├── dutch-van-der-linde.png
│       ├── john-marston.png
│       ├── hosea-matthews.png
│       ├── sadie-adler.png
│       └── charles-smith.png
│
└── src/
    └── app/
        └── components/
            ├── DashboardScreen.tsx      ← Массив персонажей
            └── CharacterCard.tsx        ← Компонент карточки
```

---

## Оптимизация изображений

### Перед добавлением рекомендуется:

1. **Сжать PNG** через TinyPNG.com
2. **Обрезать лишнее** через Photopea.com
3. **Убрать фон** через Remove.bg
4. **Изменить размер** до 400x400px или 800x800px

### Пример команды оптимизации (если используете CLI):
```bash
# Установить pngquant
npm install -g pngquant-bin

# Сжать изображение
pngquant arthur-morgan.png --quality=80-90 --output arthur-morgan.png
```

---

## Troubleshooting

### Изображение не появляется?
1. Проверьте, что файл находится в `/public/characters/`
2. Проверьте правильность имени файла (строчные буквы, дефисы)
3. Очистите кеш браузера (Ctrl+Shift+R)
4. Перезапустите dev сервер

### Изображение выглядит растянутым?
1. Убедитесь, что исходник квадратный (1:1)
2. Используйте `object-cover` в CSS
3. Проверьте `aspect-ratio: 1/1` в карточке

### Изображение слишком большое?
1. Используйте онлайн сжатие: tinypng.com
2. Или imageoptim.com для Mac
3. Или squoosh.app от Google

---

## Готово! 🎉

После добавления всех изображений ваш дашборд будет выглядеть как настоящая банда с Дикого Запада!

Если возникнут вопросы - проверьте код в:
- `/src/app/components/CharacterCard.tsx`
- `/src/app/components/DashboardScreen.tsx`
