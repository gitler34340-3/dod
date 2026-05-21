import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto, DocumentResponseDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Получить все документы текущего пользователя
  async getUserDocuments(userId: string): Promise<DocumentResponseDto[]> {
    const documents = await this.prisma.document.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return documents.map((doc) => this.mapToResponse(doc));
  }

  // Получить все документы (только для админ/HR)
  async getAllDocuments(userRole: string): Promise<DocumentResponseDto[]> {
    if (!['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Недостаточно прав для просмотра всех документов');
    }

    const documents = await this.prisma.document.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((doc) => this.mapToResponse(doc));
  }

  // Получить документ по ID
  async getDocumentById(
    documentId: string,
    userId: string,
    userRole: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    // Проверка прав доступа
    if (document.ownerId !== userId && !['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Нет доступа к этому документу');
    }

    return this.mapToResponse(document);
  }

  // Создать новый документ
  async createDocument(
    dto: CreateDocumentDto,
    userId: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type || 'document',
        status: 'active',
        ownerId: userId,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
      },
    });

    return this.mapToResponse(document);
  }

  async createDocumentForEmployee(
    dto: CreateDocumentDto,
    userRole: string,
  ): Promise<DocumentResponseDto> {
    if (!['Admin', 'HR', 'Manager'].includes(userRole)) {
      throw new ForbiddenException('Недостаточно прав для создания документа сотруднику');
    }

    if (!dto.employeeId) {
      throw new NotFoundException('Сотрудник не указан');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!employee?.user?.id) {
      throw new NotFoundException('У сотрудника не найден привязанный пользователь');
    }

    const document = await this.prisma.document.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type || 'document',
        status: 'active',
        ownerId: employee.user.id,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return this.mapToResponse(document);
  }

  // Обновить документ
  async updateDocument(
    documentId: string,
    dto: UpdateDocumentDto,
    userId: string,
    userRole: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    // Проверка прав доступа
    if (document.ownerId !== userId && !['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Нет прав для редактирования этого документа');
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        title: dto.title || document.title,
        description: dto.description !== undefined ? dto.description : document.description,
        type: dto.type || document.type,
        status: dto.status || document.status,
        fileName: dto.fileName !== undefined ? dto.fileName : document.fileName,
        fileUrl: dto.fileUrl !== undefined ? dto.fileUrl : document.fileUrl,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return this.mapToResponse(updated);
  }

  // Удалить документ
  async deleteDocument(
    documentId: string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    // Проверка прав доступа
    if (document.ownerId !== userId && !['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Нет прав для удаления этого документа');
    }

    await this.prisma.document.delete({
      where: { id: documentId },
    });

    return { message: 'Документ успешно удален' };
  }

  // Архивировать документ
  async archiveDocument(
    documentId: string,
    userId: string,
    userRole: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    if (document.ownerId !== userId && !['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Нет прав для архивирования этого документа');
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'archived' },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return this.mapToResponse(updated);
  }

  // Восстановить архивированный документ
  async restoreDocument(
    documentId: string,
    userId: string,
    userRole: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    if (document.ownerId !== userId && !['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Нет прав для восстановления этого документа');
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'active' },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return this.mapToResponse(updated);
  }

  // Экспортировать все документы админа (JSON)
  async exportDocumentsAsJson(userRole: string): Promise<any> {
    if (!['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Недостаточно прав для экспорта');
    }

    const documents = await this.prisma.document.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      exportedAt: new Date().toISOString(),
      totalDocuments: documents.length,
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        type: doc.type,
        status: doc.status,
        ownerEmail: doc.owner?.email,
        fileName: doc.fileName,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    };
  }

  // Вспомогательный метод для преобразования
  private mapToResponse(document: any): DocumentResponseDto {
    return {
      id: document.id,
      title: document.title,
      description: document.description,
      type: document.type,
      status: document.status,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      ownerId: document.ownerId,
      ownerEmail: document.owner?.email,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
