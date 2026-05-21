import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { EmployeeDocumentsController } from './employee-documents.controller';
import { DocumentTemplateService } from './document-template.service';
import { EmployeeDocumentService } from './employee-document.service';
import { EmploymentContractService } from './employment-contract.service';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementsHrModule } from '../achievements-hr/achievements-hr.module';

@Module({
  imports: [CommonModule, AchievementsHrModule],
  controllers: [DocumentsController, EmployeeDocumentsController],
  providers: [
    DocumentsService,
    DocumentTemplateService,
    EmployeeDocumentService,
    EmploymentContractService,
    PrismaService,
  ],
  exports: [
    DocumentsService,
    DocumentTemplateService,
    EmployeeDocumentService,
    EmploymentContractService,
  ],
})
export class DocumentsModule {}
