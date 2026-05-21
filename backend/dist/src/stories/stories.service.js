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
    async feed() {
        const now = new Date();
        return this.prisma.story.findMany({
            where: { expiresAt: { gt: now } },
            orderBy: { createdAt: 'desc' },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
            },
            take: 200,
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
};
exports.StoriesService = StoriesService;
exports.StoriesService = StoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoriesService);
//# sourceMappingURL=stories.service.js.map