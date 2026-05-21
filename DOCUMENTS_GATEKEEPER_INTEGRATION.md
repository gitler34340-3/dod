# 🔗 Интеграция Гейткипера: Практические Примеры
## Как Гейткипер Взаимодействует с GraphQL, Shifts, Payroll

**Версия:** 1.0  
**Фокус:** Реальные примеры интеграции во все сервисы

---

## 📋 Быстрая Навигация

1. [Middleware Flow](#middleware-flow)
2. [ShiftsService + Гейткипер](#shiftsservice--гейткипер)
3. [PayrollService + Гейткипер](#payrollservice--гейткипер)
4. [GraphQL Query Guarding](#graphql-query-guarding)
5. [Фронтенд: Перехват 403](#фронтенд-перехват-403)
6. [Примеры Запросов](#примеры-запросов)

---

## 🔄 Middleware Flow

### Как работает Запрос

```
ФРОНТЕНД ОТПРАВЛЯЕТ:
GET /api/shifts/my-schedule

                ↓
                
BACKEND ПОЛУЧАЕТ:
middleware (auth) ✅
middleware (gatekeeper) 🔐
  └─ Проверить документы сотрудника
  └─ Все ли обязательные в статусе 'active'?
  
                ↓
                
РЕЗУЛЬТАТ:
├─ ДА → Middleware пропускает (next())
│       ShiftsService.getMySchedule() выполняется
│       ✅ Response 200 OK
│
└─ НЕТ → Middleware возвращает 403
         {
           "error": "GATEKEEPER_BLOCKED",
           "details": {
             "documentType": "Медицинская книжка",
             "reason": "EXPIRED"
           }
         }
         ShiftsService.getMySchedule() НИКОГДА НЕ ВЫЗЫВАЕТСЯ
```

### Таймак: За Какое Время Работает?

```
Request arrives
  ├─ Auth middleware: 1ms (проверка токена)
  ├─ Gatekeeper middleware: 10-15ms (одна SQL query)
  │  └─ SELECT from employee_documents (с индексом)
  │  └─ JOIN с document_types
  │  └─ Проверить статусы (in-memory)
  └─ Service execution: 50-200ms
  
Total: ~60-220ms (приемлемо для UI)
```

---

## 👥 ShiftsService + Гейткипер

### Сценарий: Сотрудник пытается просмотреть свои смены

```typescript
// backend/src/shifts/shifts.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получить все смены сотрудника
   * 🔐 ЗАЩИЩЕНО MIDDLEWARE!
   */
  async getMySchedule(employeeId: string) {
    // К этому моменту gatekeeper middleware уже проверил все!
    // Если мы тут → все документы в норме ✅
    
    const shifts = await this.prisma.shift.findMany({
      where: {
        employee_id: employeeId,
        date: {
          gte: new Date(),
        },
      },
      orderBy: {
        date: 'asc',
      },
      include: {
        department: true,
      },
    });

    return shifts;
  }

  /**
   * ⚠️ ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА:
   * Когда админ добавляет сотрудника в смену
   * (это может быть расширенная валидация)
   */
  async assignEmployeeToShift(shiftId: string, employeeId: string) {
    // Даже если фронтенд не был заблокирован,
    // админ может попытаться добавить сотрудника вручную
    // Нужна вторая линия защиты!

    // Проверить обязательные документы
    const blockedDocuments = await this.checkMandatoryDocuments(employeeId);
    
    if (blockedDocuments.length > 0) {
      throw new BadRequestException({
        message: 'Невозможно добавить в смену',
        reason: 'MISSING_DOCUMENTS',
        details: blockedDocuments.map(doc => ({
          name: doc.name,
          status: doc.status,
        })),
      });
    }

    // Всё в порядке → добавить в смену
    const shift = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        employees: {
          connect: { id: employeeId },
        },
      },
    });

    return shift;
  }

  /**
   * 🔍 Приватный метод: Проверить документы
   */
  private async checkMandatoryDocuments(employeeId: string) {
    // Получить все ОБЯЗАТЕЛЬНЫЕ типы в статусе ≠ 'active'
    const blockedDocuments = await this.prisma.employeeDocument.findMany({
      where: {
        employee_id: employeeId,
        document_type: {
          is_mandatory: true,
        },
        OR: [
          { status: { notIn: ['active', 'approved'] } },
          { expiry_date: { lt: new Date() } },
        ],
      },
      include: {
        document_type: true,
      },
    });

    return blockedDocuments.map(doc => ({
      id: doc.id,
      name: doc.document_type.name,
      status: doc.status,
      expiry_date: doc.expiry_date,
    }));
  }
}
```

### REST Контроллер для Смен

```typescript
// backend/src/shifts/shifts.controller.ts

import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  /**
   * GET /shifts/my-schedule
   * 🔐 Защищено Gatekeeper Middleware!
   * Если нет обязательного документа → 403
   */
  @Get('my-schedule')
  async getMySchedule(@Req() req: any) {
    return this.shiftsService.getMySchedule(req.user.employeeId);
  }

  /**
   * POST /shifts/:id/assign
   * Админ добавляет сотрудника в смену
   * Дополнительная проверка на случай, если админ обойдёт UI
   */
  @Post(':id/assign')
  @UseGuards(AdminGuard)
  async assignEmployeeToShift(
    @Param('id') shiftId: string,
    @Body('employee_id') employeeId: string,
  ) {
    return this.shiftsService.assignEmployeeToShift(shiftId, employeeId);
  }
}
```

---

## 💰 PayrollService + Гейткипер

### Сценарий: Сотрудник пытается просмотреть зарплату

```typescript
// backend/src/payroll/payroll.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получить зарплату сотрудника
   * 🔐 ЗАЩИЩЕНО MIDDLEWARE!
   */
  async getMyPayslips(employeeId: string) {
    // Если мы тут → gatekeeper уже пропустил ✅
    
    const payslips = await this.prisma.payslip.findMany({
      where: { employee_id: employeeId },
      orderBy: { date: 'desc' },
    });

    return payslips;
  }

  /**
   * Получить один payslip с деталями
   * 🔐 ЗАЩИЩЕНО MIDDLEWARE!
   */
  async getPayslipDetails(employeeId: string, payslipId: string) {
    const payslip = await this.prisma.payslip.findFirst({
      where: {
        id: payslipId,
        employee_id: employeeId,
      },
      include: {
        deductions: true,
        bonuses: true,
      },
    });

    if (!payslip) {
      throw new Error('Payslip not found');
    }

    return payslip;
  }

  /**
   * Скачать PDF payslip
   * 🔐 ЗАЩИЩЕНО MIDDLEWARE!
   */
  async downloadPayslipPDF(employeeId: string, payslipId: string) {
    const payslip = await this.getPayslipDetails(employeeId, payslipId);
    
    // Генерировать PDF...
    // return PDF Buffer
  }
}
```

### REST Контроллер для Зарплаты

```typescript
// backend/src/payroll/payroll.controller.ts

import { Controller, Get, Param, UseGuards, Req, Res } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  /**
   * GET /payroll/my-payslips
   * 🔐 Защищено Gatekeeper Middleware!
   */
  @Get('my-payslips')
  async getMyPayslips(@Req() req: any) {
    return this.payrollService.getMyPayslips(req.user.employeeId);
  }

  /**
   * GET /payroll/payslips/:id
   * 🔐 Защищено Gatekeeper Middleware!
   */
  @Get('payslips/:id')
  async getPayslipDetails(
    @Req() req: any,
    @Param('id') payslipId: string,
  ) {
    return this.payrollService.getPayslipDetails(req.user.employeeId, payslipId);
  }

  /**
   * GET /payroll/payslips/:id/download
   * 🔐 Защищено Gatekeeper Middleware!
   */
  @Get('payslips/:id/download')
  async downloadPayslip(
    @Req() req: any,
    @Param('id') payslipId: string,
    @Res() res: any,
  ) {
    const pdfBuffer = await this.payrollService.downloadPayslipPDF(
      req.user.employeeId,
      payslipId,
    );
    
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  }
}
```

---

## 📊 GraphQL Query Guarding

### Если используешь GraphQL (Apollo/Nest)

```typescript
// backend/src/shifts/shifts.resolver.ts

import { Resolver, Query, Mutation, Args, UseGuards } from '@nestjs/graphql';
import { Req } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GatekeeperGuard } from '../common/guards/gatekeeper.guard';

@Resolver()
@UseGuards(JwtAuthGuard, GatekeeperGuard) // Оба гуарда!
export class ShiftsResolver {
  constructor(private shiftsService: ShiftsService) {}

  /**
   * Query mySchedule
   * 🔐 GatekeeperGuard проверит документы перед выполнением
   */
  @Query()
  async mySchedule(@Req() req: any) {
    return this.shiftsService.getMySchedule(req.user.employeeId);
  }

  /**
   * Mutation assignEmployeeToShift
   * 🔐 Требуется админ + гейткипер
   */
  @Mutation()
  @UseGuards(AdminGuard) // Дополнительно
  async assignEmployeeToShift(
    @Args('shiftId') shiftId: string,
    @Args('employeeId') employeeId: string,
  ) {
    return this.shiftsService.assignEmployeeToShift(shiftId, employeeId);
  }
}
```

### GraphQL Guard (вместо Middleware)

```typescript
// backend/src/common/guards/gatekeeper.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GatekeeperGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const employeeId = req.user?.employeeId;

    if (!employeeId) return true; // Не авторизован

    // Проверить обязательные документы
    const blockedDocuments = await this.prisma.employeeDocument.findMany({
      where: {
        employee_id: employeeId,
        document_type: { is_mandatory: true },
        OR: [
          { status: { notIn: ['active', 'approved'] } },
          { expiry_date: { lt: new Date() } },
        ],
      },
      include: { document_type: true },
    });

    if (blockedDocuments.length > 0) {
      throw new ForbiddenException({
        error: 'GATEKEEPER_BLOCKED',
        details: {
          documentType: blockedDocuments[0].document_type.name,
          reason: blockedDocuments[0].status === 'pending' ? 'PENDING' : 'EXPIRED',
        },
      });
    }

    return true; // Проверка пройдена
  }
}
```

---

## 📲 Фронтенд: Перехват 403

### React Context для Гейткипера

```typescript
// src/contexts/GatekeeperContext.tsx

import React, { createContext, useState, useCallback } from 'react';

export interface GatekeeperBlockedState {
  blocked: boolean;
  documentName?: string;
  documentId?: string;
  reason?: 'MISSING' | 'PENDING' | 'REJECTED' | 'EXPIRED';
}

export const GatekeeperContext = createContext<{
  state: GatekeeperBlockedState;
  setBlocked: (state: GatekeeperBlockedState) => void;
}>({
  state: { blocked: false },
  setBlocked: () => {},
});

export const GatekeeperProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<GatekeeperBlockedState>({ blocked: false });

  const setBlocked = useCallback((newState: GatekeeperBlockedState) => {
    setState(newState);
  }, []);

  return (
    <GatekeeperContext.Provider value={{ state, setBlocked }}>
      {children}
    </GatekeeperContext.Provider>
  );
};
```

### Axios Interceptor

```typescript
// src/api/axiosSetup.ts

import axios from 'axios';
import { useGatekeeperContext } from '../hooks/useGatekeeperContext';

export const setupAxiosInterceptors = (gatekeeperContext: any) => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403) {
        const data = error.response.data;

        if (data.error === 'GATEKEEPER_BLOCKED') {
          // Сигнал контексту
          gatekeeperContext.setBlocked({
            blocked: true,
            documentName: data.details.documentType,
            reason: data.details.reason,
          });

          // Прекратить навигацию
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );
};
```

### App.tsx с Гейткипер Экраном

```tsx
// src/App.tsx

import React, { useContext, useEffect } from 'react';
import { GatekeeperContext } from './contexts/GatekeeperContext';
import { GatekeeperBlockscreen } from './components/GatekeeperBlockscreen';
import { MainApp } from './components/MainApp';
import { setupAxiosInterceptors } from './api/axiosSetup';

export function App() {
  const gatekeeperContext = useContext(GatekeeperContext);

  useEffect(() => {
    setupAxiosInterceptors(gatekeeperContext);
  }, [gatekeeperContext]);

  if (gatekeeperContext.state.blocked) {
    return (
      <GatekeeperBlockscreen
        documentName={gatekeeperContext.state.documentName || 'Документ'}
        reason={gatekeeperContext.state.reason || 'MISSING'}
        onUpload={async (file) => {
          try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/documents/upload', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              // Успешно загружено → снять блокировку
              gatekeeperContext.setBlocked({ blocked: false });
              // Переинициировать, если нужно
              window.location.reload();
            }
          } catch (error) {
            console.error('Upload error:', error);
          }
        }}
      />
    );
  }

  return <MainApp />;
}
```

---

## 📬 Примеры Запросов

### 1. Сотрудник Загружает Документ

**Request:**
```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: [binary PDF data]
document_type_id: "doc-type-medical"
```

**Backend:**
```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadDocument(
  @UploadedFile() file: Express.Multer.File,
  @Body('document_type_id') documentTypeId: string,
  @Req() req: any,
) {
  const employeeId = req.user.employeeId;

  // 1. Сохранить файл
  const fileUrl = await this.storageService.upload(file);

  // 2. Создать документ в БД
  const doc = await this.prisma.employeeDocument.create({
    data: {
      employee_id: employeeId,
      document_type_id: documentTypeId,
      title: file.originalname,
      file_url: fileUrl,
      file_size: file.size,
      mime_type: file.mimetype,
      status: 'pending', // ⏳ На проверке!
    },
  });

  return { id: doc.id, status: 'pending' };
}
```

**Response:**
```json
{
  "id": "doc-789",
  "status": "pending",
  "message": "Документ принят на проверку. Администратор проверит его в течение 24 часов."
}
```

---

### 2. Админ Проверяет Документ (Approve)

**Request:**
```http
PATCH /api/documents/789/approve
Authorization: Bearer [admin-token]

Body:
{
  "review_notes": "Всё в порядке, медкнижка действительна"
}
```

**Backend:**
```typescript
@Patch(':id/approve')
@UseGuards(AdminGuard)
async approveDocument(
  @Param('id') docId: string,
  @Body('review_notes') reviewNotes: string,
  @Req() req: any,
) {
  const adminId = req.user.id;

  // Обновить статус с 'pending' → 'active'
  const doc = await this.prisma.employeeDocument.update({
    where: { id: docId },
    data: {
      status: 'active',
      reviewed_at: new Date(),
      reviewed_by: adminId,
      review_notes: reviewNotes,
    },
  });

  // Залогировать в audit trail
  await this.prisma.documentLog.create({
    data: {
      document_id: docId,
      action: 'approved',
      actor_id: adminId,
      old_status: 'pending',
      new_status: 'active',
      details: { review_notes: reviewNotes },
    },
  });

  return { status: 'active', message: 'Документ одобрен' };
}
```

**Response:**
```json
{
  "status": "active",
  "message": "Документ одобрен",
  "reviewed_at": "2026-03-29T10:30:00Z"
}
```

---

### 3. Админ Отклоняет Документ (Reject)

**Request:**
```http
PATCH /api/documents/789/reject
Authorization: Bearer [admin-token]

Body:
{
  "review_notes": "Медкнижка истёкла 01.01.2024. Требуется новая."
}
```

**Backend:**
```typescript
@Patch(':id/reject')
@UseGuards(AdminGuard)
async rejectDocument(
  @Param('id') docId: string,
  @Body('review_notes') reviewNotes: string,
  @Req() req: any,
) {
  const adminId = req.user.id;

  // Обновить статус с 'pending' → 'rejected'
  const doc = await this.prisma.employeeDocument.update({
    where: { id: docId },
    data: {
      status: 'rejected',
      reviewed_at: new Date(),
      reviewed_by: adminId,
      review_notes: reviewNotes,
    },
  });

  // Сотрудник снова в блоке! Гейткипер его заблокирует.
  // Фронтенд покажет экран блокировки.

  return { status: 'rejected', message: 'Документ отклонён. Загрузите новый' };
}
```

**Response:**
```json
{
  "status": "rejected",
  "message": "Документ отклонён. Загрузите новый файл.",
  "review_notes": "Медкнижка истёкла 01.01.2024. Требуется новая."
}
```

---

### 4. Сотрудник Пытается Открыть Защищённый Раздел (BLOCKED)

**Request:**
```http
GET /api/shifts/my-schedule
Authorization: Bearer [employee-token]
```

**Middleware (Gatekeeper):  403**
```json
{
  "error": "GATEKEEPER_BLOCKED",
  "message": "Требуется документ: Медицинская книжка",
  "details": {
    "blocked": true,
    "documentType": "Медицинская книжка",
    "reason": "EXPIRED"
  }
}
```

**Фронтенд:** Показывает GatekeeperBlockscreen с предложением загрузить документ.

---

### 5. Админ Создаёт Ордер (Warrant)

**Request:**
```http
POST /api/document-requests
Authorization: Bearer [admin-token]

Body:
{
  "employee_id": "emp-123",
  "document_type_id": "doc-type-medical",
  "deadline": "2026-03-31T23:59:59Z",
  "priority": "high",
  "message": "СРОЧНО! Без медкнижки не могу расписать тебя на смены. У тебя до 31 марта."
}
```

**Response:**
```json
{
  "id": "req-456",
  "status": "pending",
  "employee_id": "emp-123",
  "document_type": "Медицинская книжка",
  "deadline": "2026-03-31T23:59:59Z",
  "priority": "high",
  "created_at": "2026-03-29T10:30:00Z",
  "message": "СРОЧНО! ..."
}
```

**Фронтенд (сотрудник):** Видит DocumentRequestBanner (красный баннер вверху) с требованием загрузить документ.

---

### 6. Получить Мои Ордеры

**Request:**
```http
GET /api/document-requests/my
Authorization: Bearer [employee-token]
```

**Response:**
```json
{
  "requests": [
    {
      "id": "req-456",
      "document_type": "Медицинская книжка",
      "deadline": "2026-03-31T23:59:59Z",
      "priority": "high",
      "status": "pending",
      "message": "СРОЧНО! ...",
      "days_remaining": 2
    },
    {
      "id": "req-789",
      "document_type": "Справка санитарная",
      "deadline": "2026-03-30T23:59:59Z",
      "priority": "normal",
      "status": "submitted",
      "message": "Обновите справку",
      "days_remaining": 1
    }
  ]
}
```

---

## 🎬 Flow Визуально

### Сценарий 1: Сотрудник ВСЁ В НОРМЕ ✅

```
GET /api/shifts/my-schedule
        ↓
    🔐 Gatekeeper Middleware
        ↓
   ✅ Все обязательные документы
      в статусе 'active'
        ↓
    📤 next() → ShiftsService
        ↓
    ✅ Response: [Shift, Shift, ...]
        ↓
   Фронтенд ВИДИТ РАСПИСАНИЕ
```

### Сценарий 2: Документ Просрочен ⏳

```
GET /api/shifts/my-schedule
        ↓
    🔐 Gatekeeper Middleware
        ↓
   ❌ Медкнижка expiry_date < NOW()
        ↓
   🛑 res.status(403) {GATEKEEPER_BLOCKED}
        ↓
   ShiftsService НЕ ВЫЗЫВАЕТСЯ
        ↓
Фронтенд ВИДИТ GatekeeperBlockscreen
     (с возможностью загрузить)
        ↓
Сотрудник загружает новую медкнижку
        ↓
Админ проверяет → status = 'active'
        ↓
Сотрудник теперь НЕ в блоке ✅
```

### Сценарий 3: Админ Отправляет Ордер 🎯

```
POST /api/document-requests
(админ требует медкнижку от emp-123)
        ↓
📋 Создаётся request с status='pending'
        ↓
Фронтенд сотрудника видит DocumentRequestBanner
(красный баннер: "ТРЕБУЕТСЯ МЕДКНИЖКА!")
        ↓
Сотрудник загружает файл
        ↓
Request status = 'submitted'
(админ видит в очереди на проверку)
        ↓
Админ проверяет и одобряет
        ↓
Document status = 'active'
Request status = 'completed'
        ↓
✅ Гейткипер больше НЕ блокирует
```

---

## 📈 Performance Tips

| Метрика | Целевое значение |
|---------|------------------|
| Gatekeeper check time | < 15ms |
| Database query latency | < 5ms (с индексом) |
| Total request time (with gatekeeper) | < 50ms overhead |

**Оптимизации:**

1. **Индекс на is_mandatory + status:**
```sql
CREATE INDEX idx_mandatory_status ON employee_documents(
  employee_id, 
  status
) 
WHERE document_type.is_mandatory = true;
```

2. **Кеширование (Redis):**
```typescript
// Если документы не часто меняются, кешировать на 5-10 мин
const cacheKey = `gatekeeper:${employeeId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

3. **Batch checking:**
```typescript
// Если много запросов, получить все обязательные документы за раз
const mandatoryDocs = await this.prisma.employeeDocument.findMany({
  where: {
    employee_id: employeeId,
    document_type: { is_mandatory: true },
  },
  select: { status: true, expiry_date: true },
});
```

---

## 🚨 Summary

| С Гейткипером | Без Гейткипера |
|---|---|
| ✅ Сотрудник без медкнижки → БЛОКИРОВКА | ❌ Может открыть тайком |
| ✅ Админ видит WANTED список | ❌ Админ не знает кого блокировать |
| ✅ Ордеры заставляют обновлять | ❌ Мяcо и бизнес рискует |
| ✅ Audit logs всё отслеживают | ❌ Нет истории доступа |
| ✅ Твёрдые правила соблюдаются | ❌ Можно обойти кодом |

---

**Версия:** 1.0  
**Статус:** 🟡 Ready for Implementation  
**Next Step:** Скопировать код в проект и тестировать!
