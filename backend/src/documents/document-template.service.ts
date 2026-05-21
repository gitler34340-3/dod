import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTemplateDto, UpdateDocumentTemplateDto } from './dto/index';

@Injectable()
export class DocumentTemplateService {
  constructor(private prisma: PrismaService) {}

  async getAllTemplates() {
    const db = this.prisma as any;
    return db.documentTemplate.findMany({
      include: {
        submissions: {
          select: {
            id: true,
            employeeId: true,
            status: true,
            uploadedAt: true,
            employee: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplatesForDepartment(department: string) {
    const db = this.prisma as any;
    return db.documentTemplate.findMany({
      where: {
        OR: [{ department: null }, { department }],
        isRequired: true,
      },
    });
  }

  async getTemplateById(id: string) {
    const db = this.prisma as any;
    const template = await db.documentTemplate.findUnique({
      where: { id },
      include: {
        submissions: {
          select: {
            id: true,
            employeeId: true,
            status: true,
            uploadedAt: true,
            employee: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Шаблон не найден');
    }

    return template;
  }

  async createTemplate(dto: CreateDocumentTemplateDto, userRole: string) {
    if (!['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Только админ может создавать шаблоны');
    }

    const db = this.prisma as any;
    return db.documentTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        department: dto.department,
        isRequired: dto.isRequired ?? true,
      },
    });
  }

  async updateTemplate(id: string, dto: UpdateDocumentTemplateDto, userRole: string) {
    if (!['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Только админ может обновлять шаблоны');
    }

    const db = this.prisma as any;
    const template = await this.getTemplateById(id);
    if (!template) {
      throw new NotFoundException('Шаблон не найден');
    }

    return db.documentTemplate.update({
      where: { id },
      data: {
        name: dto.name ?? template.name,
        description: dto.description ?? template.description,
        department: dto.department ?? template.department,
        isRequired: dto.isRequired ?? template.isRequired,
      },
    });
  }

  async deleteTemplate(id: string, userRole: string) {
    if (!['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Только админ может удалять шаблоны');
    }

    const db = this.prisma as any;
    const template = await this.getTemplateById(id);
    if (!template) {
      throw new NotFoundException('Шаблон не найден');
    }

    return db.documentTemplate.delete({ where: { id } });
  }
}
