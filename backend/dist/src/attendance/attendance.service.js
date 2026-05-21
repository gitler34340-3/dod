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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AttendanceService = class AttendanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, requesterRole) {
        this.requireCanManageAttendance(requesterRole);
        const checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
        const checkOut = dto.checkOut ? new Date(dto.checkOut) : null;
        const workHours = this.calcWorkHours(checkIn, checkOut);
        return this.prisma.attendance.create({
            data: {
                employeeId: dto.employeeId,
                date: new Date(dto.date),
                checkIn,
                checkOut,
                workHours: workHours ?? null,
                status: dto.status ?? 'present',
                notes: dto.notes,
            },
            include: { employee: { select: { firstName: true, lastName: true } } },
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters.employeeId)
            where.employeeId = filters.employeeId;
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from)
                where.date.gte = new Date(filters.from);
            if (filters.to)
                where.date.lte = new Date(filters.to);
        }
        return this.prisma.attendance.findMany({
            where,
            include: { employee: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
        });
    }
    async findOne(id) {
        return this.prisma.attendance.findUniqueOrThrow({
            where: { id },
            include: { employee: true },
        });
    }
    async update(id, dto, requesterRole) {
        this.requireCanManageAttendance(requesterRole);
        const existing = await this.prisma.attendance.findUniqueOrThrow({ where: { id } });
        const checkIn = dto.checkIn != null ? new Date(dto.checkIn) : existing.checkIn;
        const checkOut = dto.checkOut != null ? new Date(dto.checkOut) : existing.checkOut;
        const workHours = this.calcWorkHours(checkIn, checkOut);
        return this.prisma.attendance.update({
            where: { id },
            data: {
                ...(dto.date && { date: new Date(dto.date) }),
                ...(dto.checkIn !== undefined && { checkIn: checkIn }),
                ...(dto.checkOut !== undefined && { checkOut: checkOut }),
                ...(workHours != null && { workHours }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
            },
            include: { employee: true },
        });
    }
    async remove(id, requesterRole) {
        this.requireCanManageAttendance(requesterRole);
        return this.prisma.attendance.delete({ where: { id } });
    }
    requireCanManageAttendance(role) {
        if (!['Admin', 'HR', 'Manager'].includes(role)) {
            throw new common_1.ForbiddenException('Недостаточно прав');
        }
    }
    calcWorkHours(checkIn, checkOut) {
        if (!checkIn || !checkOut || checkOut <= checkIn)
            return null;
        return Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60) * 100) / 100;
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map