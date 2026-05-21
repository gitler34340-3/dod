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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, requesterRole) {
        this.requireAdminOrHrOrManager(requesterRole);
        const assignedRole = dto.role ?? 'Employee';
        if (assignedRole === 'Manager' && requesterRole !== 'Admin' && requesterRole !== 'HR') {
            throw new common_1.ForbiddenException('Только администратор может создавать менеджеров');
        }
        if (assignedRole === 'Admin' && requesterRole !== 'Admin') {
            throw new common_1.ForbiddenException('Только администратор может создавать администраторов');
        }
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existing)
            throw new common_1.ConflictException('Пользователь с таким email уже существует');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                role: assignedRole,
                employeeId: dto.employeeId,
            },
            select: { id: true, email: true, role: true, createdAt: true },
        });
        return user;
    }
    async findAll(requesterRole) {
        this.requireAdminOrHr(requesterRole);
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                employeeId: true,
                employee: {
                    select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } },
                },
            },
        });
    }
    async findOne(id, requesterRole) {
        this.requireAdminOrHr(requesterRole);
        return this.prisma.user.findUniqueOrThrow({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                employeeId: true,
                employee: true,
            },
        });
    }
    async updateCredentials(id, dto, requesterRole) {
        this.requireAdminOrHrOrManager(requesterRole);
        if (!dto.email?.trim() && !dto.password?.trim()) {
            throw new common_1.BadRequestException('Укажите новый логин, пароль или оба поля');
        }
        const data = {};
        if (dto.email?.trim()) {
            const email = dto.email.trim().toLowerCase();
            const existing = await this.prisma.user.findFirst({
                where: {
                    email,
                    NOT: { id },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('Пользователь с таким логином уже существует');
            }
            data.email = email;
        }
        if (dto.password?.trim()) {
            data.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: { id: true, email: true, role: true, createdAt: true, employeeId: true },
        });
    }
    async requestCredentialChange(userId, dto) {
        const requestedEmail = dto.requestedEmail?.trim().toLowerCase();
        const requestedPassword = dto.requestedPassword?.trim();
        if (!requestedEmail && !requestedPassword) {
            throw new common_1.BadRequestException('Укажите новый логин, пароль или оба поля');
        }
        if (requestedEmail) {
            const existing = await this.prisma.user.findFirst({
                where: {
                    email: requestedEmail,
                    NOT: { id: userId },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('Пользователь с таким логином уже существует');
            }
        }
        const requestedPasswordHash = requestedPassword
            ? await bcrypt.hash(requestedPassword, 10)
            : undefined;
        return this.prisma.credentialChangeRequest.create({
            data: {
                userId,
                requestedEmail,
                requestedPasswordHash,
                comment: dto.comment?.trim() || null,
            },
            select: {
                id: true,
                status: true,
                requestedEmail: true,
                comment: true,
                createdAt: true,
            },
        });
    }
    async getMyCredentialRequests(userId) {
        return this.prisma.credentialChangeRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                requestedEmail: true,
                comment: true,
                createdAt: true,
                reviewedAt: true,
                reviewer: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
    }
    async getCredentialRequests(requesterRole) {
        this.requireAdminOrHrOrManager(requesterRole);
        return this.prisma.credentialChangeRequest.findMany({
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                department: true,
                            },
                        },
                    },
                },
                reviewer: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
    }
    async reviewCredentialRequest(requestId, status, reviewerId, requesterRole) {
        this.requireAdminOrHrOrManager(requesterRole);
        const request = await this.prisma.credentialChangeRequest.findUniqueOrThrow({
            where: { id: requestId },
        });
        if (request.status !== client_1.RequestStatus.Pending) {
            throw new common_1.BadRequestException('Заявка уже обработана');
        }
        if (status === client_1.RequestStatus.Approved) {
            if (request.requestedEmail) {
                const existing = await this.prisma.user.findFirst({
                    where: {
                        email: request.requestedEmail,
                        NOT: { id: request.userId },
                    },
                });
                if (existing) {
                    throw new common_1.ConflictException('Пользователь с таким логином уже существует');
                }
            }
            await this.prisma.user.update({
                where: { id: request.userId },
                data: {
                    ...(request.requestedEmail ? { email: request.requestedEmail } : {}),
                    ...(request.requestedPasswordHash ? { passwordHash: request.requestedPasswordHash } : {}),
                },
            });
        }
        return this.prisma.credentialChangeRequest.update({
            where: { id: requestId },
            data: {
                status,
                reviewerId,
                reviewedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        employee: {
                            select: { id: true, firstName: true, lastName: true, department: true },
                        },
                    },
                },
                reviewer: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
    }
    requireAdminOrHr(role) {
        if (role !== 'Admin' && role !== 'HR') {
            throw new common_1.ForbiddenException('Недостаточно прав');
        }
    }
    requireAdminOrHrOrManager(role) {
        if (!['Admin', 'HR', 'Manager'].includes(role)) {
            throw new common_1.ForbiddenException('Недостаточно прав');
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map