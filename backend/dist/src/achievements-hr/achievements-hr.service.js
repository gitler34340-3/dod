"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsHrService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AchievementsHrService = class AchievementsHrService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    automaticAchievements = [
        {
            title: 'Первые шаги',
            description: 'Заполнен профиль сотрудника',
            icon: '👤',
            points: 10,
        },
        {
            title: 'Первый документ',
            description: 'Отправлен первый документ на проверку',
            icon: '📄',
            points: 15,
        },
        {
            title: 'Проверка пройдена',
            description: 'Первый документ успешно одобрен',
            icon: '✅',
            points: 25,
        },
        {
            title: 'Пакет собран',
            description: 'Отправлено минимум 5 документов',
            icon: '🗂️',
            points: 40,
        },
        {
            title: 'Месяц в команде',
            description: 'Стаж работы достиг 30 дней',
            icon: '🏅',
            points: 30,
        },
    ];
    async createAchievement(dto, requesterRole) {
        this.requireCanManage(requesterRole);
        return this.prisma.achievement.create({
            data: {
                title: dto.title,
                description: dto.description,
                icon: dto.icon,
                points: dto.points ?? 0,
            },
        });
    }
    async findAllAchievements() {
        return this.prisma.achievement.findMany({
            include: { _count: { select: { employeeAchievements: true } } },
            orderBy: { title: 'asc' },
        });
    }
    async findOneAchievement(id) {
        return this.prisma.achievement.findUniqueOrThrow({
            where: { id },
            include: { employeeAchievements: { include: { employee: true } } },
        });
    }
    async assignToEmployee(dto, requesterRole) {
        this.requireCanManage(requesterRole);
        return this.prisma.employeeAchievement.create({
            data: {
                employeeId: dto.employeeId,
                achievementId: dto.achievementId,
                notes: dto.notes,
            },
            include: { employee: true, achievement: true },
        });
    }
    async getEmployeeAchievements(employeeId) {
        return this.prisma.employeeAchievement.findMany({
            where: { employeeId },
            include: { achievement: true },
            orderBy: { earnedAt: 'desc' },
        });
    }
    async getAllEmployeeAchievements() {
        return this.prisma.employeeAchievement.findMany({
            include: { employee: true, achievement: true },
            orderBy: { earnedAt: 'desc' },
        });
    }
    async awardAutomaticForEmployee(employeeId) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                hireDate: true,
            },
        });
        if (!employee)
            return [];
        const [submittedCount, approvedCount] = await Promise.all([
            this.prisma.employeeDocument.count({
                where: {
                    employeeId,
                    status: { in: ['submitted', 'approved', 'completed'] },
                },
            }),
            this.prisma.employeeDocument.count({
                where: {
                    employeeId,
                    status: { in: ['approved', 'completed'] },
                },
            }),
        ]);
        const profileCompleted = Boolean(employee.firstName?.trim() &&
            employee.lastName?.trim() &&
            employee.phone?.trim() &&
            employee.email?.trim());
        const workedAtLeastMonth = employee.hireDate
            ? Date.now() - new Date(employee.hireDate).getTime() >= 30 * 24 * 60 * 60 * 1000
            : false;
        const shouldAward = new Set();
        if (profileCompleted)
            shouldAward.add('Первые шаги');
        if (submittedCount >= 1)
            shouldAward.add('Первый документ');
        if (approvedCount >= 1)
            shouldAward.add('Проверка пройдена');
        if (submittedCount >= 5)
            shouldAward.add('Пакет собран');
        if (workedAtLeastMonth)
            shouldAward.add('Месяц в команде');
        const existingAwards = await this.prisma.employeeAchievement.findMany({
            where: { employeeId },
            include: { achievement: true },
        });
        const alreadyHas = new Set(existingAwards.map((entry) => entry.achievement.title));
        const awarded = [];
        for (const definition of this.automaticAchievements) {
            if (!shouldAward.has(definition.title) || alreadyHas.has(definition.title))
                continue;
            const achievement = await this.prisma.achievement.upsert({
                where: { id: `auto-${definition.title}` },
                update: {
                    title: definition.title,
                    description: definition.description,
                    icon: definition.icon,
                    points: definition.points,
                },
                create: {
                    id: `auto-${definition.title}`,
                    title: definition.title,
                    description: definition.description,
                    icon: definition.icon,
                    points: definition.points,
                },
            });
            const created = await this.prisma.employeeAchievement.create({
                data: {
                    employeeId,
                    achievementId: achievement.id,
                    notes: 'Автоматически выдано системой',
                },
                include: { achievement: true, employee: true },
            });
            awarded.push(created);
        }
        return awarded;
    }
    requireCanManage(role) {
        if (!['Admin', 'HR', 'Manager'].includes(role)) {
            throw new common_1.ForbiddenException('Недостаточно прав');
        }
    }
};
exports.AchievementsHrService = AchievementsHrService;
exports.AchievementsHrService = AchievementsHrService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AchievementsHrService);
//# sourceMappingURL=achievements-hr.service.js.map