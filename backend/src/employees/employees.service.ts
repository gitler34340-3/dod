import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmploymentContractService } from '../documents/employment-contract.service';
import { Role } from '@prisma/client';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AchievementsHrService } from '../achievements-hr/achievements-hr.service';

@Injectable()
export class EmployeesService {
  private readonly avatarTemplateName = '__PROFILE_AVATAR__';

  private async getAvatarMap(employeeIds: string[]) {
    const uniqueIds = Array.from(new Set(employeeIds.filter(Boolean)));
    if (uniqueIds.length === 0) return new Map<string, { fileUrl?: string | null; fileName?: string | null; notes?: string | null }>();

    const avatarDocs = await this.prisma.employeeDocument.findMany({
      where: {
        employeeId: { in: uniqueIds },
        template: { name: this.avatarTemplateName },
      },
      include: { template: true },
      orderBy: { updatedAt: 'desc' },
    });

    const map = new Map<string, { fileUrl?: string | null; fileName?: string | null; notes?: string | null }>();
    for (const doc of avatarDocs) {
      if (!map.has(doc.employeeId)) {
        map.set(doc.employeeId, {
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          notes: doc.notes,
        });
      }
    }
    return map;
  }

  constructor(
    private prisma: PrismaService,
    private contractService: EmploymentContractService,
    private readonly achievementsService: AchievementsHrService,
  ) {}

  async create(dto: CreateEmployeeDto, requesterRole: Role) {
    this.requireCanManageEmployees(requesterRole);
    
    const employee = await this.prisma.employee.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        hireDate: new Date(dto.hireDate),
        hourlyRate: dto.hourlyRate,
        departmentId: dto.departmentId,
        canPublishStories: dto.canPublishStories ?? false,
      },
      include: { department: true },
    });

    // Автоматически создать трудовой договор для нового сотрудника
    try {
      await this.contractService.createContractForEmployee(employee.id);
    } catch (error) {
      console.error('Failed to create employment contract:', error);
      // Continue even if contract creation fails
    }

    if (dto.passportSeries || dto.passportNumber || dto.passportIssuedBy || dto.passportRegistrationAddress) {
      const db = this.prisma as any;
      const template = await db.documentTemplate.create({
        data: {
          name: 'Паспорт',
          description: 'Паспортные данные сотрудника',
          department: employee.departmentId ?? undefined,
          isRequired: false,
        },
      });

      await db.employeeDocument.create({
        data: {
          employeeId: employee.id,
          templateId: template.id,
          status: 'approved',
          fileName: 'Паспорт',
          notes: [
            'Данные сотрудника:',
            `ФИО: ${employee.lastName} ${employee.firstName}`.trim(),
            dto.passportSeries ? `Серия: ${dto.passportSeries}` : null,
            dto.passportNumber ? `Номер: ${dto.passportNumber}` : null,
            dto.passportIssuedBy ? `Кем выдан: ${dto.passportIssuedBy}` : null,
            dto.passportIssueDate ? `Дата выдачи: ${dto.passportIssueDate}` : null,
            dto.passportDivisionCode ? `Код подразделения: ${dto.passportDivisionCode}` : null,
            dto.passportRegistrationAddress
              ? `Адрес регистрации: ${dto.passportRegistrationAddress}`
              : null,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      });
    }

    return employee;
  }

  async findAll(requesterRole: Role) {
    const rows = await this.prisma.employee.findMany({
      include: {
        department: true,
        // include linked user id so the client can know which employee belongs to current user
        user: { select: { id: true, email: true, role: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    const avatarMap = await this.getAvatarMap(rows.map((row) => row.id));
    return rows.map((row) => ({
      ...row,
      avatar: avatarMap.get(row.id) ?? null,
    }));
  }

  async findOne(id: string) {
    const row = await this.prisma.employee.findUniqueOrThrow({
      where: { id },
      include: { 
        department: true, 
        user: { select: { id: true, email: true, role: true } },
        minHoursQuota: true,
      },
    });
    const avatarMap = await this.getAvatarMap([id]);
    return {
      ...row,
      avatar: avatarMap.get(id) ?? null,
    };
  }

  async update(id: string, dto: UpdateEmployeeDto, requesterRole: Role) {
    this.requireCanManageEmployees(requesterRole);
    const data: Record<string, unknown> = {};
    if (dto.firstName != null) data.firstName = dto.firstName;
    if (dto.lastName != null) data.lastName = dto.lastName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.hireDate != null) data.hireDate = new Date(dto.hireDate);
    if (dto.hourlyRate != null) data.hourlyRate = dto.hourlyRate;
    if (dto.departmentId !== undefined) data.departmentId = dto.departmentId;
    if (dto.canPublishStories !== undefined) data.canPublishStories = dto.canPublishStories;

    return this.prisma.employee.update({
      where: { id },
      data,
      include: { department: true },
    });
  }

  async updateMyProfile(employeeId: string, dto: UpdateEmployeeDto) {
    const data: Record<string, unknown> = {};
    if (dto.firstName != null) data.firstName = dto.firstName;
    if (dto.lastName != null) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;

    const updated = await this.prisma.employee.update({
      where: { id: employeeId },
      data,
      include: { department: true },
    });

    await this.achievementsService.awardAutomaticForEmployee(employeeId);
    const avatarMap = await this.getAvatarMap([employeeId]);
    return {
      ...updated,
      avatar: avatarMap.get(employeeId) ?? null,
    };
  }

  async updateMyAvatar(employeeId: string, payload: { fileUrl: string; fileName?: string; zoom?: number; offsetX?: number; offsetY?: number }) {
    const template = await this.prisma.documentTemplate.upsert({
      where: { id: this.avatarTemplateName },
      update: {
        name: this.avatarTemplateName,
        description: 'Служебный шаблон аватара профиля',
        isRequired: false,
      },
      create: {
        id: this.avatarTemplateName,
        name: this.avatarTemplateName,
        description: 'Служебный шаблон аватара профиля',
        isRequired: false,
      },
    });

    await this.prisma.employeeDocument.deleteMany({
      where: { employeeId, templateId: template.id },
    });

    const created = await this.prisma.employeeDocument.create({
      data: {
        employeeId,
        templateId: template.id,
        status: 'approved',
        fileName: payload.fileName || 'avatar.png',
        fileUrl: payload.fileUrl,
        notes: JSON.stringify({
          zoom: payload.zoom ?? 1,
          offsetX: payload.offsetX ?? 0,
          offsetY: payload.offsetY ?? 0,
        }),
      },
    });

    return {
      employeeId,
      fileUrl: created.fileUrl,
      fileName: created.fileName,
      notes: created.notes,
    };
  }

  async getEmployeeAvatar(employeeId: string) {
    const avatarMap = await this.getAvatarMap([employeeId]);
    return avatarMap.get(employeeId) ?? null;
  }

  async remove(id: string, requesterRole: Role) {
    this.requireCanManageEmployees(requesterRole);
    return this.prisma.employee.delete({ where: { id } });
  }

  async getEmployeeOfMonth() {
    return this.prisma.employeeOfMonth.findFirst({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        employee: {
          include: {
            department: true,
            user: { select: { id: true, email: true, role: true } },
          },
        },
        selectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
    });
  }

  async setEmployeeOfMonth(
    employeeId: string,
    payload: { month: number; year: number; title?: string; message?: string },
    requesterRole: Role,
    selectedByEmployeeId?: string | null,
  ) {
    this.requireCanManageEmployees(requesterRole);

    await this.prisma.employee.findUniqueOrThrow({ where: { id: employeeId } });

    return this.prisma.employeeOfMonth.upsert({
      where: {
        month_year: {
          month: payload.month,
          year: payload.year,
        },
      },
      update: {
        employeeId,
        selectedByEmployeeId: selectedByEmployeeId ?? null,
        title: payload.title?.trim() || 'Работник месяца',
        message: payload.message?.trim() || null,
      },
      create: {
        employeeId,
        selectedByEmployeeId: selectedByEmployeeId ?? null,
        month: payload.month,
        year: payload.year,
        title: payload.title?.trim() || 'Работник месяца',
        message: payload.message?.trim() || null,
      },
      include: {
        employee: {
          include: {
            department: true,
            user: { select: { id: true, email: true, role: true } },
          },
        },
        selectedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
    });
  }

  async terminate(
    id: string,
    dto: { reason: string },
    requesterRole: Role,
    performedByUserId: string,
  ) {
    this.requireCanManageEmployees(requesterRole);

    // load employee with linked user (to get team)
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!emp) {
      throw new Error('Employee not found');
    }

    const userId = emp.user?.id ?? null;
    // create a document recording the termination using raw SQL (documents table may be outside Prisma schema)
    const title = `Увольнение ${emp.firstName} ${emp.lastName}`;
    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        INSERT INTO documents (user_id, title, type, file_url, size, signed, urgent, created_at, content, createdByUserId)
        VALUES (${userId}, ${title}, 'termination', '', '', 0, 0, ${new Date().toISOString()}, ${dto.reason}, ${performedByUserId})
      `,
      this.prisma.employee.delete({ where: { id } }),
    ]);

    return { success: true };
  }

  private requireCanManageEmployees(role: Role) {
    if (!['Admin', 'HR', 'Manager'].includes(role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }
}

