# HR Management App Design

This is a code bundle for HR Management App Design. The original project is available at https://www.figma.com/design/7dZ0IofqhXXN7yG6RaDiKE/HR-Management-App-Design.

## Как запустить всё вместе (бэкенд + сайт)

1. В **корне проекта** (папка `HR Management App Design`) выполни:
   ```bash
   npm i
   npm run dev:all
   ```
   Откроются два процесса: **api** (бэкенд на http://localhost:3000) и **web** (сайт на http://localhost:5173).

2. В браузере открой **http://localhost:5173** и войди с одним из аккаунтов ниже.

## Логин и пароль (скопируй точно, латиницей)

| Роль        | Email                    | Пароль     |
|------------|---------------------------|------------|
| Менеджер   | `gm.tverskaya@dodo.pizza` | `manager123` |
| Пиццамейкер | `povar.ivan@dodo.pizza`   | `worker123`  |
| Кассир    | `kassir.anna@dodo.pizza`  | `worker123`  |

Если логин не принимает — открой в браузере **http://localhost:3000/auth/accounts**: там список всех аккаунтов с точными email и паролями (бэкенд должен быть запущен).

## Запуск по отдельности

- Только сайт: в корне проекта `npm run dev`.
- Только бэкенд: `cd backend` → `npm run dev`.
- Всё вместе: в корне `npm run dev:all`.
