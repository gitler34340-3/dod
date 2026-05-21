import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UploadDocumentDto,
  ReviewDocumentDto,
  AssignEmployeeDocumentDto,
  RespondEmployeeDocumentDto,
} from './dto/index';
import { AchievementsHrService } from '../achievements-hr/achievements-hr.service';

@Injectable()
export class EmployeeDocumentService {
  constructor(
    private prisma: PrismaService,
    private readonly achievementsService: AchievementsHrService,
  ) {}

  private appendHistoryEntry(existing: string | null | undefined, entry: string) {
    const current = existing?.trim() || '';
    return [current, `[HISTORY ${new Date().toISOString()}] ${entry}`]
      .filter(Boolean)
      .join('\n');
  }

  async getRequiredDocumentsForEmployee(employeeId: string) {
    const db = this.prisma as any;
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: employeeId },
      select: { departmentId: true },
    });

    const templates = await db.documentTemplate.findMany({
      where: {
        isRequired: true,
        OR: [{ department: null }, { department: employee.departmentId ?? undefined }],
      },
    });

    const submissions = await db.employeeDocument.findMany({
      where: { employeeId },
      include: { template: true },
    });

    return templates.map(template => {
      const submission = submissions.find(s => s.templateId === template.id);
      return {
        templateId: template.id,
        name: template.name,
        description: template.description,
        isRequired: template.isRequired,
        submission: submission
          ? {
              id: submission.id,
              fileName: submission.fileName,
              fileUrl: submission.fileUrl,
              status: submission.status,
              uploadedAt: submission.uploadedAt,
              notes: submission.notes,
            }
          : null,
      };
    });
  }

  async uploadDocument(employeeId: string, templateId: string, dto: UploadDocumentDto) {
    const db = this.prisma as any;
    const template = await db.documentTemplate.findUniqueOrThrow({ where: { id: templateId } });
    const employee = await this.prisma.employee.findUniqueOrThrow({ where: { id: employeeId } });

    await db.employeeDocument.deleteMany({ where: { employeeId, templateId } });

    const created = await db.employeeDocument.create({
      data: {
        employeeId,
        templateId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
        status: 'pending',
      },
      include: { template: true },
    });
    await this.achievementsService.awardAutomaticForEmployee(employeeId);
    return created;
  }

  async assignDocumentToEmployee(dto: AssignEmployeeDocumentDto, userRole: string) {
    if (!['Admin', 'HR', 'Manager'].includes(userRole)) {
      throw new ForbiddenException('Только администратор или HR может назначать документы');
    }

    const db = this.prisma as any;
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: dto.employeeId },
      select: { id: true, departmentId: true },
    });

    const template = await db.documentTemplate.create({
      data: {
        name: dto.documentName,
        description: [
          dto.deadline ? `Дедлайн: ${dto.deadline}` : null,
          dto.priority ? `Приоритет: ${dto.priority}` : null,
          dto.notes?.trim() || null,
        ]
          .filter(Boolean)
          .join('\n'),
        department: employee.departmentId ?? undefined,
        isRequired: false,
      },
    });

    return db.employeeDocument.create({
      data: {
        employeeId: employee.id,
        templateId: template.id,
        status: 'pending',
        notes: [
          dto.deadline ? `Дедлайн: ${dto.deadline}` : null,
          dto.priority ? `Приоритет: ${dto.priority}` : null,
          dto.notes?.trim() || null,
        ]
          .filter(Boolean)
          .join('\n'),
      },
      include: {
        template: true,
        employee: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async getEmployeeDocument(documentId: string, employeeId: string, userRole: string) {
    const db = this.prisma as any;
    const document = await db.employeeDocument.findUnique({
      where: { id: documentId },
      include: { template: true },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    if (document.employeeId !== employeeId && !['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Доступ запрещён');
    }

    return document;
  }

  async getEmployeeDocuments(employeeId: string) {
    const db = this.prisma as any;
    return db.employeeDocument.findMany({
      where: { employeeId },
      include: { template: true },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async respondToDocument(
    documentId: string,
    employeeId: string,
    dto: RespondEmployeeDocumentDto,
  ) {
    const db = this.prisma as any;
    const document = await db.employeeDocument.findUniqueOrThrow({
      where: { id: documentId },
      include: { template: true },
    });

    if (document.employeeId !== employeeId) {
      throw new ForbiddenException('Доступ запрещён');
    }

    const employeeResponse = dto.notes?.trim() || '';
    const mergedNotes = this.appendHistoryEntry(
      document.notes,
      `EMPLOYEE_RESPONSE: ${employeeResponse || 'Без комментария'}`,
    );

    const updated = await db.employeeDocument.update({
      where: { id: documentId },
      data: {
        fileName: dto.fileName ?? document.fileName,
        fileUrl: dto.fileUrl ?? document.fileUrl,
        notes: mergedNotes,
        status: dto.status ?? 'submitted',
      },
      include: {
        template: true,
        employee: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    await this.achievementsService.awardAutomaticForEmployee(employeeId);
    return updated;
  }

  async getAllEmployeeDocuments(templateId?: string, status?: string, employeeId?: string) {
    const db = this.prisma as any;
    return db.employeeDocument.findMany({
      where: {
        ...(templateId && { templateId }),
        ...(status && { status }),
        ...(employeeId && { employeeId }),
      },
      include: {
        template: true,
        employee: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async reviewDocument(documentId: string, dto: ReviewDocumentDto, userRole: string) {
    if (!['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Только админ может проверять документы');
    }

    if (!dto?.status) {
      throw new BadRequestException('Не указан статус проверки документа');
    }

    const db = this.prisma as any;
    const existing = await db.employeeDocument.findUniqueOrThrow({ where: { id: documentId } });
    const mergedNotes = this.appendHistoryEntry(
      existing.notes,
      `ADMIN_REVIEW [${dto.status.toUpperCase()}]: ${(dto.notes || '').trim() || 'Без комментария'}`,
    );

    const updated = await db.employeeDocument.update({
      where: { id: documentId },
      data: { status: dto.status, notes: mergedNotes },
      include: { template: true },
    });
    await this.achievementsService.awardAutomaticForEmployee(existing.employeeId);
    return updated;
  }

  async deleteEmployeeDocument(documentId: string, employeeId: string, userRole: string) {
    const db = this.prisma as any;
    const document = await db.employeeDocument.findUniqueOrThrow({ where: { id: documentId } });

    if (document.employeeId !== employeeId && !['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Доступ запрещён');
    }

    return db.employeeDocument.delete({ where: { id: documentId } });
  }
}
