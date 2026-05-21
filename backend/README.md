# HR Management API (Production-ready NestJS)

Backend для HR-системы: PostgreSQL, Prisma, JWT, RBAC (Admin, HR, Manager, Employee).

## Стек

- **NestJS** — фреймворк
- **PostgreSQL** — БД
- **Prisma** — ORM
- **JWT** — access + refresh токены
- **class-validator / class-transformer** — валидация DTO
- **Swagger** — документация API

## Структура папок

```
backend/
├── prisma/
│   └── schema.prisma       # Модели: User, Employee, Department, Attendance, PayrollItem, Achievement, EmployeeAchievement
├── src/
│   ├── common/
│   │   ├── decorators/     # @CurrentUser(), @Roles(), @Public()
│   │   ├── filters/        # AllExceptionsFilter
│   │   └── guards/         # JwtAuthGuard, RolesGuard
│   ├── prisma/             # PrismaService, PrismaModule (global)
│   ├── auth/               # Регистрация, логин, refresh, logout
│   ├── users/              # Список/просмотр пользователей (Admin, HR)
│   ├── departments/        # CRUD отделов
│   ├── employees/          # CRUD сотрудников
│   ├── attendance/         # Учёт посещаемости
│   ├── payroll/            # Расчёт и выплаты зарплаты
│   ├── achievements-hr/    # Типы достижений и назначения сотрудникам
│   ├── app.module.ts
│   └── main.ts
├── .env.example
└── package.json
```

## Команды для запуска

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Переменные окружения

Скопируй `.env.example` в `.env` и заполни:

```bash
cp .env.example .env
```

Обязательно: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (не менее 32 символов).

### 3. База данных

```bash
# Создать миграции и применить к БД
npm run prisma:migrate

# Наполнить начальными данными (Admin + отдел + сотрудник)
npx prisma db seed

# (опционально) Открыть Prisma Studio
npm run prisma:studio
```

**Первый вход после seed:** `admin@hr.local` / `Admin123!` (роль Admin).

### 4. Запуск приложения

```bash
# Режим разработки (watch)
npm run dev

# Сборка
npm run build

# Production
npm run start:prod
```

### 5. Swagger

После запуска: **http://localhost:3000/api/docs**

## Роли и доступ

| Роль     | Описание |
|----------|----------|
| Admin    | Полный доступ |
| HR       | Пользователи, отделы, сотрудники, посещаемость, зарплата, достижения |
| Manager  | Отделы, сотрудники, посещаемость, зарплата, достижения |
| Employee | Просмотр своих данных, списков отделов/сотрудников/посещаемости/зарплаты/достижений |

## Основные эндпоинты

- **POST /auth/register** — регистрация (email, password, role)
- **POST /auth/login** — вход → accessToken, refreshToken, user
- **POST /auth/refresh** — обновление токенов (body: `{ "refreshToken": "..." }`)
- **POST /auth/logout** — выход (Bearer token)
- **GET /users** — список пользователей (Admin, HR)
- **GET/POST/PATCH/DELETE /departments** — CRUD отделов
- **GET/POST/PATCH/DELETE /employees** — CRUD сотрудников
- **GET/POST/PATCH/DELETE /attendance** — посещаемость
- **GET/POST /payroll**, **PATCH /payroll/:id/approve**, **PATCH /payroll/:id/paid** — зарплата
- **GET/POST /achievements**, **GET /achievements/assignments**, **GET /achievements/by-employee/:id**, **POST /achievements/assign** — достижения

Все защищённые маршруты требуют заголовок: `Authorization: Bearer <accessToken>`.
