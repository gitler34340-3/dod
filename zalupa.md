# Запуск проекта на новом компьютере

Это проект из двух частей:

- frontend: React + Vite, запускается из корня проекта;
- backend: NestJS + Prisma + SQLite, лежит в папке `backend`.

## Что нужно заранее

1. Установить Node.js LTS. Лучше использовать Node.js 22 LTS.
2. Установить npm, он идет вместе с Node.js.
3. Открыть терминал в корне проекта.

Проверка:

```bash
node -v
npm -v
```

## Установка зависимостей

В корне проекта:

```bash
npm install
```

Потом установить зависимости backend:

```bash
cd backend
npm install
cd ..
```

## Настройка переменных окружения

В корне проекта должен быть файл `.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

В папке `backend` должен быть файл `.env`. Если его нет, скопируй пример:

```bash
cd backend
copy .env.example .env
cd ..
```

Для PowerShell можно так:

```powershell
Copy-Item backend\.env.example backend\.env
```

Главное, чтобы в `backend/.env` было:

```env
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

## Подготовка базы данных

Backend использует SQLite через Prisma. После установки зависимостей выполни:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
cd ..
```

Если база уже есть и миграции не нужны, достаточно:

```bash
cd backend
npm run prisma:generate
cd ..
```

## Запуск проекта

Самый простой вариант - запустить frontend и backend одной командой из корня:

```bash
npm run dev:all
```

Откроются два процесса:

- backend: `http://localhost:3001`;
- frontend: обычно `http://localhost:5173`.

Если хочешь запускать отдельно:

```bash
npm run dev:backend
npm run dev
```

Эти команды нужно держать открытыми в терминале.

## Проверка сборки

Frontend:

```bash
npm run build
```

Backend:

```bash
npm run build:backend
```

## Частые проблемы

Если frontend открывается, но данные не грузятся, проверь что backend запущен на `3001`, а в `.env.local` написано `VITE_API_URL=http://localhost:3001`.

Если команда пишет, что не найден `react` или `react-dom`, заново выполни `npm install` в корне проекта. Эти пакеты теперь находятся в обычных зависимостях проекта.

Если Prisma ругается на базу, зайди в `backend` и выполни:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Если порт занят, поменяй `PORT` в `backend/.env` и такой же порт укажи в корневом `.env.local`.
