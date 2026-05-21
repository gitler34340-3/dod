import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Query,
  Response,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { User } from '../domain/entities';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/create-document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // Получить мои документы (для сотрудников)
  @Get('my')
  async getMyDocuments(@CurrentUser() user: User) {
    return this.documentsService.getUserDocuments(user.id);
  }

  // Получить все документы (только для админ/HR)
  @Get('all')
  async getAllDocuments(@CurrentUser() user: User) {
    return this.documentsService.getAllDocuments(user.role);
  }

  // Получить документ по ID
  @Get(':id')
  async getDocument(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.getDocumentById(id, user.id, user.role);
  }

  // Создать новый документ
  @Post()
  async createDocument(@Body() dto: CreateDocumentDto, @CurrentUser() user: User) {
    return this.documentsService.createDocument(dto, user.id);
  }

  @Post('admin/create-for-employee')
  async createDocumentForEmployee(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.createDocumentForEmployee(dto, user.role);
  }

  // Обновить документ
  @Put(':id')
  async updateDocument(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.updateDocument(id, dto, user.id, user.role);
  }

  // Удалить документ
  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.deleteDocument(id, user.id, user.role);
  }

  // Архивировать документ
  @Put(':id/archive')
  async archiveDocument(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.archiveDocument(id, user.id, user.role);
  }

  // Восстановить архивированный документ
  @Put(':id/restore')
  async restoreDocument(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.restoreDocument(id, user.id, user.role);
  }

  // Экспортировать документы (JSON)
  @Get('export/json')
  async exportDocumentsAsJson(
    @CurrentUser() user: User,
    @Response() res: any,
  ) {
    const data = await this.documentsService.exportDocumentsAsJson(user.role);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="documents.json"');
    res.send(data);
  }
}
