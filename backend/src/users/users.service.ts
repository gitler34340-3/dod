import { Injectable, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus, Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, requesterRole: Role) {
    this.requireAdminOrHrOrManager(requesterRole);

    // Validate role assignment:
    // - Only Admin/HR can create Manager role
    // - Only Admin/HR can create Admin role
    // - Manager role is fixed and cannot be changed after creation
    const assignedRole = dto.role ?? 'Employee';
    
    if (assignedRole === 'Manager' && requesterRole !== 'Admin' && requesterRole !== 'HR') {
      throw new ForbiddenException('Только администратор может создавать менеджеров');
    }

    if (assignedRole === 'Admin' && requesterRole !== 'Admin') {
      throw new ForbiddenException('Только администратор может создавать администраторов');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Пользователь с таким email уже существует');
    
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

  async findAll(requesterRole: Role) {
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

  async findOne(id: string, requesterRole: Role) {
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

  async updateCredentials(
    id: string,
    dto: { email?: string; password?: string },
    requesterRole: Role,
  ) {
    this.requireAdminOrHrOrManager(requesterRole);

    if (!dto.email?.trim() && !dto.password?.trim()) {
      throw new BadRequestException('Укажите новый логин, пароль или оба поля');
    }

    const data: Record<string, unknown> = {};

    if (dto.email?.trim()) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Пользователь с таким логином уже существует');
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

  async requestCredentialChange(
    userId: string,
    dto: { requestedEmail?: string; requestedPassword?: string; comment?: string },
  ) {
    const requestedEmail = dto.requestedEmail?.trim().toLowerCase();
    const requestedPassword = dto.requestedPassword?.trim();

    if (!requestedEmail && !requestedPassword) {
      throw new BadRequestException('Укажите новый логин, пароль или оба поля');
    }

    if (requestedEmail) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: requestedEmail,
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new ConflictException('Пользователь с таким логином уже существует');
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

  async getMyCredentialRequests(userId: string) {
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

  async getCredentialRequests(requesterRole: Role) {
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

  async reviewCredentialRequest(
    requestId: string,
    status: 'Approved' | 'Rejected',
    reviewerId: string,
    requesterRole: Role,
  ) {
    this.requireAdminOrHrOrManager(requesterRole);

    const request = await this.prisma.credentialChangeRequest.findUniqueOrThrow({
      where: { id: requestId },
    });

    if (request.status !== RequestStatus.Pending) {
      throw new BadRequestException('Заявка уже обработана');
    }

    if (status === RequestStatus.Approved) {
      if (request.requestedEmail) {
        const existing = await this.prisma.user.findFirst({
          where: {
            email: request.requestedEmail,
            NOT: { id: request.userId },
          },
        });
        if (existing) {
          throw new ConflictException('Пользователь с таким логином уже существует');
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

  private requireAdminOrHr(role: Role) {
    if (role !== 'Admin' && role !== 'HR') {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  private requireAdminOrHrOrManager(role: Role) {
    if (!['Admin', 'HR', 'Manager'].includes(role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }
}
