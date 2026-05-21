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
var DepartmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DepartmentsService = DepartmentsService_1 = class DepartmentsService {
    prisma;
    logger = new common_1.Logger(DepartmentsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        const defaults = [
            { name: 'Human Resources', code: 'HR', description: 'HR отдел' },
            { name: 'Доставка', code: 'DELIVERY', description: 'Отдел доставки' },
            { name: 'Кухня', code: 'KITCHEN', description: 'Кухня и производство' },
        ];
        for (const department of defaults) {
            await this.prisma.department.upsert({
                where: { code: department.code },
                update: {},
                create: department,
            });
        }
        const count = await this.prisma.department.count();
        this.logger.log(`Departments ready: ${count}`);
    }
    async create(dto) {
        const existing = await this.prisma.department.findUnique({
            where: { code: dto.code.toUpperCase() },
        });
        if (existing)
            throw new common_1.ConflictException('Отдел с таким кодом уже существует');
        return this.prisma.department.create({
            data: {
                name: dto.name,
                code: dto.code.toUpperCase(),
                description: dto.description,
            },
        });
    }
    async findAll() {
        return this.prisma.department.findMany({
            include: { _count: { select: { employees: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        return this.prisma.department.findUniqueOrThrow({
            where: { id },
            include: { employees: true },
        });
    }
    async update(id, dto) {
        if (dto.code) {
            const existing = await this.prisma.department.findFirst({
                where: { code: dto.code.toUpperCase(), NOT: { id } },
            });
            if (existing)
                throw new common_1.ConflictException('Отдел с таким кодом уже существует');
        }
        return this.prisma.department.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.code && { code: dto.code.toUpperCase() }),
                ...(dto.description !== undefined && { description: dto.description }),
            },
        });
    }
    async remove(id) {
        return this.prisma.department.delete({ where: { id } });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = DepartmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map