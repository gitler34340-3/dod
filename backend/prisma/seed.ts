import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hr.local' },
    update: {},
    create: {
      email: 'admin@hr.local',
      passwordHash: hash,
      role: 'Admin',
    },
  });

  const dept = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: { name: 'Human Resources', code: 'HR', description: 'HR отдел' },
  });

  const deliveryDept = await prisma.department.upsert({
    where: { code: 'DELIVERY' },
    update: {},
    create: { name: 'Доставка', code: 'DELIVERY', description: 'Отдел доставки' },
  });

  const kitchenDept = await prisma.department.upsert({
    where: { code: 'KITCHEN' },
    update: {},
    create: { name: 'Кухня', code: 'KITCHEN', description: 'Кухня' },
  });

  // Создать шаблоны требуемых документов для сотрудников
  const requiredDocuments = [
    {
      name: 'Паспорт',
      description: 'Копия первой страницы паспорта',
      department: null, // Для всех отделов
    },
    {
      name: 'Медицинская справка',
      description: 'Медицинская справка о допуске к работе',
      department: null,
    },
    {
      name: 'СНИЛС',
      description: 'Копия страховки (СНИЛС)',
      department: null,
    },
    {
      name: 'ИНН',
      description: 'Копия документа с ИНН',
      department: null,
    },
    {
      name: 'Водительское удостоверение',
      description: 'Для курьеров - копия водительского удостоверения',
      department: 'Доставка',
    },
    {
      name: 'Полис ОМС',
      description: 'Полис обязательного медицинского страхования',
      department: null,
    },
  ];

  // Удалить старые шаблоны
  await prisma.documentTemplate.deleteMany({});

  // Создать новые шаблоны
  for (const doc of requiredDocuments) {
    await prisma.documentTemplate.create({
      data: {
        name: doc.name,
        description: doc.description,
        department: doc.department,
        isRequired: true,
      },
    });
  }

  // sample employee removed to avoid placeholder on homepage
  // you can create real employees through the HR panel or API instead
  console.log('Seed OK:', { 
    admin: admin.email, 
    department: dept.name,
    documentTemplatesCount: requiredDocuments.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
