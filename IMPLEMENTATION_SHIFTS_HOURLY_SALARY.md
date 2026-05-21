# Реализованные изменения - Система смен и почасовая зарплата

## Резюме завершённых работ

### 1. ✅ Обновления базы данных (Prisma Schema)

**Новые enums:**
- `ShiftStatus`: Draft, Pending, Confirmed, Conflict, Rejected
- `ShiftType`: Optional, Mandatory, Requested
- `EmployeeRole`: Cashier, Delivery, Cook, Manager, Support

**Изменена модель Employee:**
- `salary: Float` → `hourlyRate: Float` (почасовая ставка в рублях)
- Добавлена связь с `minHoursQuota: ManagerMinimumHours?`
- Добавлена связь с `shifts: Shift[]`

**Новые модели:**

#### Shift
- `id` - уникальный идентификатор
- `employeeId` - сотрудник
- `departmentId` - отдел
- `startTime` / `endTime` - время смены
- `role` - EmployeeRole (роль при выборе)
- `status` - ShiftStatus  
- `type` - ShiftType (обязательная/опциональная/запрос)
- `canDecline` - может ли быть отклонена
- `createdBy` - кто создал
- `comment` - комментарий

#### ShiftTemplate
- Шаблоны для менеджеров (2/2, 5/2 утро, 5/2 вечер)
- Предустановленные паттерны для заполнения месяца

#### ManagerMinimumHours
- `managerId` - менеджер (уникальный)
- `minimumHoursPerWeek` - минимум часов в неделю
- `minimumHoursPerMonth` - минимум часов в месяц
- `currentWeekHours` / `currentMonthHours` - текущее значение

**Migration файл:** `20260313120000_add_shift_system_hourly_salary/migration.sql`

---

### 2. ✅ Backend сервисы

#### ShiftsService (`backend/src/shifts/shifts.service.ts`)
**Методы:**
- `createShift(dto, userId, userRole)` - создать смену с автоматическим статусом
- `getShifts(filters)` - получить смены с фильтрацией
- `updateShiftStatus(shiftId, status, managerId, userRole)` - менеджер утверждает/отклоняет
- `declineShift(shiftId, employeeId)` - сотрудник может отклонить опциональную
- `getAvailableRoles()` - получить доступные роли для dropdown'а
- `getManagerHoursStats(managerId)` - статистика по часам менеджера с красной подсветкой

#### ShiftTemplateService (`backend/src/shifts/shift-template.service.ts`)
**Встроенные шаблоны:**
- `2/2` - 2 дня работы, 2 дня отдыха (8 ч/сутки)
- `5/2-morning` - 5 дней (08:00-16:00), 2 дня отдыха
- `5/2-evening` - 5 дней (16:00-00:00), 2 дня отдыха

**Методы:**
- `getAvailableTemplates()` - получить все шаблоны
- `applyTemplateToMonth(departmentId, managerId, templateId, year, month, userRole)` - одним кликом заполнить месяц смен

#### SalaryCalculationService (`backend/src/payroll/salary-calculation.service.ts`)
**Методы:**
- `calculateSalary(employeeId, startDate, endDate)` - расчет зарплаты на основе отработанных часов
  - Приоритет: фактический check-in/check-out (из Attendance)
  - Fallback: длительность смены
  - Формула: `hourlyRate × totalHours`
- `getSalaryForCurrentWeek(employeeId)` - зарплата за неделю
- `getSalaryForCurrentMonth(employeeId)` - зарплата за месяц
- `createPayrollItem(employeeId, startDate, endDate)` - создать расчетный лист (автоматический расчет)

---

### 3. ✅ Backend API endpoints

#### Shifts Controller

**GET /shifts**
- Для сотрудников: показывает только его смены ("Мои смены")
- Для менеджеров: показывает все смены отдела ("Смены")
- Query: `employeeId`, `status`

**POST /shifts**
- Создать смену
- Сотрудник → статус `Pending` (требует одобрения)
- Менеджер → статус `Confirmed` (сразу активна)

**PATCH /shifts/:id/status**
- Менеджер утверждает/отклоняет смену
- Body: `{ status: ShiftStatus }`

**PATCH /shifts/:id/decline**
- Сотрудник может отклонить опциональную смену
- Только если `canDecline: true`

**GET /shifts/available-roles**
- Получить значения enum для dropdown'а

**GET /shifts/manager/hours-stats**
- Получить статистику часов менеджера
- Возвращает: `{ minimumHoursPerWeek, currentWeekHours, weekWarning, minimumHoursPerMonth, currentMonthHours, monthWarning }`
- `monthWarning: true` → подсвечивать красным если не хватает часов

#### Shift Templates Controller

**GET /shift-templates/predefined**
- Получить встроенные шаблоны

**GET /shift-templates/department/:departmentId**
- Получить пользовательские шаблоны отдела

**POST /shift-templates**
- Сохранить пользовательский шаблон

**POST /shift-templates/:templateId/apply-month**
- Применить шаблон к месяцу
- Query: `year`, `month`, `departmentId`
- Генерирует смены на весь месяц одним кликом

#### Salary Controller

**GET /salary/week/current**
- Зарплата за текущую неделю (для залогированного пользователя)
- Возвращает: `{ employeeId, totalHours, hourlyRate, grossSalary, period }`

**GET /salary/month/current**
- Зарплата за текущий месяц

**GET /salary/:employeeId/period**
- Зарплата за период
- Query: `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)

**GET /salary/:employeeId/week/current**
- Зарплата сотрудника за неделю (доступно менеджеру)

**GET /salary/:employeeId/month/current**
- Зарплата сотрудника за месяц (доступно менеджеру)

---

### 4. ✅ Обновления сотрудников (Users/Employees)

#### CreateUserDto
- Изменено: `salary` → `hourlyRate`
- Валидация: только Admin/HR могут создавать Manager role
- Manager role функционирует как fixed role (не может быть изменена)

#### UsersService
- Добавлена проверка: `if (role === 'Manager' && requesterRole !== 'Admin' && requesterRole !== 'HR')`
- Throw: `ForbiddenException('Только администратор может создавать менеджеров')`

#### EmployeesService & DTOs
- CreateEmployeeDto: `salary` → `hourlyRate`
- UpdateEmployeeDto: наследует от Create, использует `hourlyRate`

---

### 5. ✅ Frontend обновления

#### SalaryBlock.tsx
- Добавлена загрузка данных из API `/salary/week/current` и `/salary/month/current`
- Показывает реальный расчет: отработанные часы × почасовая ставка
- Формат: "35 000 ₽ за месяц (160 ч. × 500 ₽/ч)"
- Подержка периодов: неделя, месяц
- Обработка ошибок и loading состояния

---

## Ключевые бизнес-логика требования

### ✅ Реквизиты Requirement 1: Почасовая зарплата
- Зарплата рассчитывается на основе ОТРАБОТАННЫХ часов (не устанавливается менеджером)
- Менеджер НЕ может задавать зарплату
- Зарплата = hourlyRate × totalHours
- Отображается на главном экране (SalaryBlock)

### ✅ Требирования 2: Система смен сотрудников
- Смены могут быть:
  - **Автоматические** - система-generated
  - **Назначенные менеджером** - с флагом canDecline (обязательность)
- Сотрудник может:
  - Отклонить опциональную смену (API: PATCH /shifts/:id/decline)
  - Запросить смену (создать со статусом Pending для одобрения)
- Менеджер может:
  - Назначать смены сотрудникам
  - Устанавливать обязательность (canDecline)

### ✅ Требирования 3: Система смен менеджера
- "Мои смены" для сотрудников vs "Смены" для менеджеров (разные заголовки)
- Менеджер может использовать шаблоны:
  - "2/2", "5/2 утро", "5/2 вечер"
  - Одним кликом заполняет весь месяц
- Минимальные часы менеджера:
  - Устанавливается квота (часов в неделю/месяц)
  - Подсвечивается КРАСНЫМ если не хватает часов
- Manager role фиксирован (создается только Admin/HR)

### ✅ Требирования 4: Выбор ролей сотрудниками
- Сотрудники выбирают роль из dropdown (EmployeeRole enum)
- Доступные роли: Cashier, Delivery, Cook, Manager, Support
- При создании/запросе смены

---

## Следующие шаги для фронтенда

1. **Обновить ImprovedScheduleScreen:**
   - Динамический заголовок ("Мои смены" vs "Смены")
   - UI для отклонения опциональных смен
   - UI для запроса смен на одобрение
   - Менеджер шаблонов для заполнения месяца

2. **Добавить компонент ManagerShiftsPanel:**
   - Показывать минимальные часы с красной подсветкой
   - Управление шаблонами

3. **Добавить компонент RoleSelector:**
   - Dropdown с доступными ролями (из API)
   - При создании смены

4. **Обновить создание пользователя/сотрудника:**
   - Использовать `hourlyRate` вместо `salary`
   - Валидировать что Manager может создавать только Admin/HR

5. **Создать Prisma migration:**
   - Выполнить: `npx prisma migrate dev`
   - Будет создана SQLite таблица для shifts, templates, manager_minimum_hours
   - Изменит column `salary` → `hourly_rate` на таблице employees

---

## Тестирование

**SQL для проверки:**
```sql
-- Проверить структуру employees
PRAGMA table_info(employees);

-- Проверить новые таблицы
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('shifts', 'shift_templates', 'manager_minimum_hours');

-- Проверить были ли смены созданы
SELECT * FROM shifts LIMIT 5;
```

**API тестирование (cURL примеры):**
```bash
# Получить смены сотрудника
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/shifts

# Получить доступные роли
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/shifts/available-roles

# Получить зарплату за месяц
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/salary/month/current

# Менеджер проверить свои часы
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/shifts/manager/hours-stats
```

---

## Файлы, которые были изменены/созданы

### Backend
- ✅ `backend/prisma/schema.prisma` - обновлена схема
- ✅ `backend/prisma/migrations/20260313120000_add_shift_system_hourly_salary/migration.sql` - создана
- ✅ `backend/src/shifts/shifts.service.ts` - создана (была только controller)
- ✅ `backend/src/shifts/shifts.controller.ts` - обновлена для работы с сервисом
- ✅ `backend/src/shifts/shift-template.service.ts` - создана
- ✅ `backend/src/shifts/shift-template.controller.ts` - создана
- ✅ `backend/src/shifts/shifts.module.ts` - обновлена
- ✅ `backend/src/shifts/dto/create-shift.dto.ts` - обновлена
- ✅ `backend/src/shifts/dto/update-shift.dto.ts` - обновлена
- ✅ `backend/src/payroll/salary-calculation.service.ts` - создана
- ✅ `backend/src/payroll/salary.controller.ts` - создана  
- ✅ `backend/src/payroll/payroll.module.ts` - обновлена
- ✅ `backend/src/payroll/payroll.service.ts` - обновлена для использования SalaryCalculationService
- ✅ `backend/src/employees/employees.service.ts` - обновлена (salary → hourlyRate)
- ✅ `backend/src/employees/dto/create-employee.dto.ts` - обновлена (salary → hourlyRate)
- ✅ `backend/src/users/users.service.ts` - добавлена валидация Manager role

### Frontend
- ✅ `src/app/components/SalaryBlock.tsx` - обновлена на загрузку из API

### TODO: Frontend компоненты (требуют создания/обновления)
- ImprovedScheduleScreen.tsx - требует значительные обновления
- ManagerShiftsPanel.tsx - новый компонент
- RoleSelector.tsx - новый компонент
- ShiftTemplateUI.tsx - новый компонент
