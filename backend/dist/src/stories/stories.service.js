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
exports.StoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let StoriesService = class StoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async feed(role, employeeId) {
        const now = new Date();
        const items = await this.prisma.story.findMany({
            where: { expiresAt: { gt: now } },
            orderBy: { createdAt: 'desc' },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                reactions: {
                    include: {
                        employee: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
                views: {
                    include: {
                        employee: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
            take: 200,
        });
        const isAdmin = role === client_1.Role.Admin || role === client_1.Role.HR || role === client_1.Role.Manager;
        return items.map((item) => {
            const viewerList = isAdmin
                ? item.views.map((view) => ({
                    employeeId: view.employeeId,
                    firstName: view.employee.firstName,
                    lastName: view.employee.lastName,
                    viewedAt: view.viewedAt,
                }))
                : [];
            const reactionList = isAdmin
                ? item.reactions.map((reaction) => ({
                    employeeId: reaction.employeeId,
                    firstName: reaction.employee.firstName,
                    lastName: reaction.employee.lastName,
                    emoji: reaction.emoji,
                    createdAt: reaction.createdAt,
                }))
                : [];
            const myReaction = employeeId
                ? item.reactions.find((reaction) => reaction.employeeId === employeeId)?.emoji ?? null
                : null;
            return {
                ...item,
                views: undefined,
                reactions: undefined,
                viewsCount: item.views.length,
                reactionsCount: item.reactions.length,
                viewers: viewerList,
                reactionDetails: reactionList,
                viewedByMe: employeeId ? item.views.some((view) => view.employeeId === employeeId) : false,
                myReaction,
            };
        });
    }
    async create(dto, role, employeeId) {
        if (!dto?.mediaUrl)
            throw new common_1.BadRequestException('mediaUrl is required');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        if (role === client_1.Role.Employee) {
            if (!employeeId)
                throw new common_1.BadRequestException('employeeId is required');
            const employee = await this.prisma.employee.findUnique({
                where: { id: employeeId },
                select: { canPublishStories: true },
            });
            if (!employee?.canPublishStories) {
                throw new common_1.ForbiddenException('Публикация сторис не разрешена администратором');
            }
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            const already = await this.prisma.story.findFirst({
                where: {
                    employeeId,
                    createdAt: { gte: startOfDay },
                },
                select: { id: true },
            });
            if (already)
                throw new common_1.BadRequestException('Сотрудник может публиковать 1 сторис в день');
        }
        return this.prisma.story.create({
            data: {
                employeeId: employeeId ?? null,
                title: dto.title ?? null,
                caption: dto.caption ?? null,
                mediaUrl: dto.mediaUrl,
                expiresAt,
            },
            include: { employee: { select: { id: true, firstName: true, lastName: true } } },
        });
    }
    async setPublishPermission(role, employeeId, canPublish) {
        if (role !== client_1.Role.Admin && role !== client_1.Role.HR) {
            throw new common_1.ForbiddenException('Недостаточно прав');
        }
        return this.prisma.employee.update({
            where: { id: employeeId },
            data: { canPublishStories: canPublish },
            select: { id: true, firstName: true, lastName: true, canPublishStories: true },
        });
    }
    async markViewed(storyId, employeeId) {
        const story = await this.prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
        if (!story)
            throw new common_1.BadRequestException('Сторис не найдена');
        await this.prisma.storyView.upsert({
            where: {
                storyId_employeeId: { storyId, employeeId },
            },
            update: { viewedAt: new Date() },
            create: { storyId, employeeId },
        });
        return { success: true };
    }
    async setReaction(storyId, employeeId, emoji) {
        if (!emoji || emoji.trim().length === 0) {
            throw new common_1.BadRequestException('emoji is required');
        }
        const story = await this.prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
        if (!story)
            throw new common_1.BadRequestException('Сторис не найдена');
        const value = emoji.trim().slice(0, 8);
        await this.prisma.storyReaction.upsert({
            where: {
                storyId_employeeId: { storyId, employeeId },
            },
            update: { emoji: value, createdAt: new Date() },
            create: { storyId, employeeId, emoji: value },
        });
        return { success: true };
    }
};
exports.StoriesService = StoriesService;
exports.StoriesService = StoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoriesService);
//# sourceMappingURL=stories.service.js.map