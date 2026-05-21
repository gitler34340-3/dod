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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
let JobApplicationService = class JobApplicationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createApplication(dto) {
        return this.prisma.jobApplication.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                position: dto.position,
                experience: dto.experience,
                status: 'pending',
            },
        });
    }
    async getAllApplications() {
        return this.prisma.jobApplication.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async getApplicationById(id) {
        return this.prisma.jobApplication.findUniqueOrThrow({
            where: { id },
        });
    }
    async reviewApplication(id, dto, reviewedBy) {
        const application = await this.prisma.jobApplication.findUniqueOrThrow({
            where: { id },
        });
        if (dto.status === 'approved') {
            const password = dto.password?.trim();
            if (!password) {
                throw new common_1.BadRequestException('Для одобрения заявки нужно задать пароль');
            }
            const normalizedEmail = application.email.trim().toLowerCase();
            const existingUser = await this.prisma.user.findUnique({
                where: { email: normalizedEmail },
                select: { id: true },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Аккаунт с таким email уже существует');
            }
            let employee = await this.prisma.employee.findFirst({
                where: { email: normalizedEmail },
                select: { id: true },
            });
            if (!employee) {
                employee = await this.prisma.employee.create({
                    data: {
                        firstName: application.firstName,
                        lastName: application.lastName,
                        email: normalizedEmail,
                        phone: application.phone,
                        hireDate: new Date(),
                        hourlyRate: 0,
                    },
                    select: { id: true },
                });
            }
            const passwordHash = await bcrypt.hash(password, 10);
            await this.prisma.user.create({
                data: {
                    email: normalizedEmail,
                    passwordHash,
                    role: 'Employee',
                    employeeId: employee.id,
                },
            });
        }
        return this.prisma.jobApplication.update({
            where: { id },
            data: {
                status: dto.status,
                notes: dto.notes,
                reviewedAt: new Date(),
                reviewedBy,
            },
        });
    }
    async deleteApplication(id) {
        return this.prisma.jobApplication.delete({
            where: { id },
        });
    }
};
exports.JobApplicationService = JobApplicationService;
exports.JobApplicationService = JobApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobApplicationService);
//# sourceMappingURL=job-application.service.js.map