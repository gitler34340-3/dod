# Структура бэкенда

```
src/
├── main.ts                 # Точка входа, CORS, порт
├── app.module.ts           # Корневой модуль, подключение всех модулей
│
├── domain/                 # Сущности и начальные данные (без логики)
│   ├── entities.ts        # Интерфейсы: User, Team, Shift, Document, Achievement, LoginResponse
│   ├── seed.ts            # Начальные данные (команды, пользователи, смены, документы, ачивки)
│   └── index.ts
│
├── common/                 # Общие гуарды и декораторы
│   ├── common.module.ts
│   ├── guards/
│   │   ├── auth.guard.ts      # Проверка Bearer-токена, запись user в request
│   │   └── manager.guard.ts   # Доступ только для роли manager
│   └── decorators/
│       └── current-user.decorator.ts   # @CurrentUser() для получения user в контроллере
│
├── data/                   # Глобальное хранилище (in-memory)
│   ├── data.module.ts     # @Global(), экспортирует DataService
│   └── data.service.ts    # CRUD по командам, пользователям, сменам, документам, ачивкам
│
├── auth/                   # Авторизация
│   ├── auth.module.ts
│   ├── auth.controller.ts # POST /auth/login
│   └── dto/
│       └── login.dto.ts
│
├── users/                  # Сотрудники команды
│   ├── users.module.ts
│   ├── users.controller.ts # GET /users (список команды), POST /users (создать — только manager)
│   └── dto/
│       └── create-user.dto.ts
│
├── shifts/                 # Смены
│   ├── shifts.module.ts
│   ├── shifts.controller.ts # GET /shifts, POST /shifts (только manager)
│   └── dto/
│       └── create-shift.dto.ts
│
├── documents/              # Документы команды
│   ├── documents.module.ts
│   ├── documents.controller.ts # GET /documents, POST /documents (только manager)
│   └── dto/
│       └── create-document.dto.ts
│
├── achievements/           # Достижения (чтение)
│   ├── achievements.module.ts
│   └── achievements.controller.ts # GET /achievements
│
├── app.controller.ts
└── app.service.ts
```

## API

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | /auth/login | — | Логин (email, password), возвращает token, user, team, teamMembers, shifts, documents, achievements |
| GET | /users | Bearer | Список сотрудников своей команды |
| POST | /users | Bearer + manager | Добавить сотрудника в команду |
| GET | /shifts | Bearer | Смены своей команды |
| POST | /shifts | Bearer + manager | Создать смену |
| GET | /documents | Bearer | Документы команды |
| POST | /documents | Bearer + manager | Создать документ |
| GET | /achievements | Bearer | Достижения команды |

Токен после логина — это `user.id`. В запросах: заголовок `Authorization: Bearer <token>`.
