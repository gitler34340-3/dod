"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
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
    const requiredDocuments = [
        {
            name: 'Паспорт',
            description: 'Копия первой страницы паспорта',
            department: null,
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
    await prisma.documentTemplate.deleteMany({});
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
//# sourceMappingURL=seed.js.map