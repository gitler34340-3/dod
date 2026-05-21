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
  ForbiddenException,
} from '@nestjs/common';
import { DocumentTemplateService } from './document-template.service';
import { EmployeeDocumentService } from './employee-document.service';
import { EmploymentContractService } from './employment-contract.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '../domain/entities';
import {
  CreateDocumentTemplateDto,
  UpdateDocumentTemplateDto,
  UploadDocumentDto,
  AssignEmployeeDocumentDto,
  ReviewDocumentDto,
  RespondEmployeeDocumentDto,
  CreateEmploymentContractDto,
  UpdateEmploymentContractDto,
} from './dto/index';

@Controller('employee-documents')
@UseGuards(JwtAuthGuard)
export class EmployeeDocumentsController {
  constructor(
    private readonly templateService: DocumentTemplateService,
    private readonly documentService: EmployeeDocumentService,
    private readonly contractService: EmploymentContractService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('templates')
  async getAllTemplates() {
    return this.templateService.getAllTemplates();
  }

  @Get('templates/department/my')
  async getMyTemplates(@CurrentUser() user: User) {
    const userWithEmployee = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { employeeId: true },
    });

    if (!userWithEmployee?.employeeId) {
      return [];
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: userWithEmployee.employeeId },
      select: { departmentId: true },
    });
    
    if (!employee?.departmentId) {
      return [];
    }
    return this.templateService.getTemplatesForDepartment(employee.departmentId);
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.templateService.getTemplateById(id);
  }

  @Post('templates')
  async createTemplate(
    @Body() dto: CreateDocumentTemplateDto,
    @CurrentUser() user: User,
  ) {
    return this.templateService.createTemplate(dto, user.role);
  }

  @Put('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentTemplateDto,
    @CurrentUser() user: User,
  ) {
    return this.templateService.updateTemplate(id, dto, user.role);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.templateService.deleteTemplate(id, user.role);
  }

  @Get('required')
  async getRequiredDocuments(@CurrentUser() user: User) {
    const userWithEmployee = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { employeeId: true },
    });

    if (!userWithEmployee?.employeeId) {
      return [];
    }
    return this.documentService.getRequiredDocumentsForEmployee(
      userWithEmployee.employeeId,
    );
  }

  @Get('my-uploads')
  async getMyDocuments(@CurrentUser() user: User) {
    const userWithEmployee = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { employeeId: true },
    });

    if (!userWithEmployee?.employeeId) {
      return [];
    }
    return this.documentService.getEmployeeDocuments(userWithEmployee.employeeId);
  }

  @Post('upload/:templateId')
  async uploadDocument(
    @Param('templateId') templateId: string,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: User,
  ) {
    const userWithEmployee = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { employeeId: true },
    });

    if (!userWithEmployee?.employeeId) {
      throw new ForbiddenException('Employee not found');
    }
    return this.documentService.uploadDocument(
      userWithEmployee.employeeId,
      templateId,
      dto,
    );
  }

  @Put('document/:id/respond')
  async respondToDocument(
    @Param('id') id: string,
    @Body() dto: RespondEmployeeDocumentDto,
    @CurrentUser() user: User,
  ) {
    const userWithEmployee = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { employeeId: true },
    });

    if (!userWithEmployee?.employeeId) {
      throw new ForbiddenException('Employee not found');
    }

    return this.documentService.respondToDocument(
      id,
      userWithEmployee.employeeId,
      dto,
    );
  }

  @Post('admin/assign')
  async assignDocumentToEmployee(
    @Body() dto: AssignEmployeeDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.documentService.assignDocumentToEmployee(dto, user.role);
  }

  @Get('document/:id')
  async getDocument(@Param('id') id: string, @CurrentUser() user: User) {
    const userWithEmployee = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { employeeId: true },
    });

    if (!userWithEmployee?.employeeId) {
      throw new ForbiddenException('Employee not found');
    }
    return this.documentService.getEmployeeDocument(
      id,
      userWithEmployee.employeeId,
      user.role,
    );
  }

  @Delete('document/:id')
  async deleteDocument(@Param('id') id: string, @CurrentUser() user: User) {
    const userWithEmployee = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { employeeId: true },
    });

    if (!userWithEmployee?.employeeId) {
      throw new ForbiddenException('Employee not found');
    }
    return this.documentService.deleteEmployeeDocument(
      id,
      userWithEmployee.employeeId,
      user.role,
    );
  }

  @Get('admin/all')
  async getAllDocuments(
    @Query('templateId') templateId?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.documentService.getAllEmployeeDocuments(templateId, status, employeeId);
  }

  @Put('admin/review/:id')
  async reviewDocument(
    @Param('id') id: string,
    @Body() dto: ReviewDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.documentService.reviewDocument(id, dto, user.role);
  }

  @Get('contract/my')
  async getMyContract(@CurrentUser() user: User) {
    const userWithEmployee = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { employeeId: true },
    });

    if (!userWithEmployee?.employeeId) {
      return null;
    }
    return this.contractService.getContractByEmployeeId(
      userWithEmployee.employeeId,
      user.id,
      user.role,
    );
  }

  @Get('contract/:employeeId')
  async getEmployeeContract(
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: User,
  ) {
    return this.contractService.getContractByEmployeeId(
      employeeId,
      user.id,
      user.role,
    );
  }

  @Get('contracts/admin/all')
  async getAllContracts(@CurrentUser() user: User) {
    if (!['Admin', 'HR'].includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }
    return this.contractService.getAllContracts();
  }

  @Put('contract/:id')
  async updateContract(
    @Param('id') id: string,
    @Body() dto: UpdateEmploymentContractDto,
    @CurrentUser() user: User,
  ) {
    return this.contractService.updateContract(id, dto, user.role);
  }

  @Delete('contract/:id')
  async deleteContract(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contractService.deleteContract(id, user.role);
  }
}
