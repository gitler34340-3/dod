import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmploymentContractDto, UpdateEmploymentContractDto } from './dto/index';

@Injectable()
export class EmploymentContractService {
  constructor(private prisma: PrismaService) {}

  async getContractByEmployeeId(
    employeeId: string,
    currentUserId?: string,
    userRole?: string,
  ) {
    const db = this.prisma as any;
    const contract = await db.employmentContract.findUnique({
      where: { employeeId },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            hireDate: true,
            hourlyRate: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Трудовой договор не найден');
    }

    if (contract.employeeId !== employeeId && !['Admin', 'HR'].includes(userRole || '')) {
      throw new ForbiddenException('Доступ запрещён');
    }

    return contract;
  }

  async getAllContracts() {
    const db = this.prisma as any;
    return db.employmentContract.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createContractForEmployee(
    employeeId: string,
    dto?: CreateEmploymentContractDto,
  ) {
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: employeeId },
      select: {
        firstName: true,
        lastName: true,
        hireDate: true,
        hourlyRate: true,
        departmentId: true,
      },
    });

    let departmentName = 'Основное отделение';
    if (employee.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: employee.departmentId },
        select: { name: true },
      });
      departmentName = dept?.name ?? 'Основное отделение';
    }

    const contractNumber = `НД-${new Date().getFullYear()}-${Date.now()}`;
    const db = this.prisma as any;

    return db.employmentContract.create({
      data: {
        employeeId,
        contractNumber,
        startDate: employee.hireDate,
        endDate: dto?.endDate || null,
        position: dto?.position || 'Сотрудник',
        department: departmentName,
        salary: employee.hourlyRate,
        content:
          dto?.content ||
          this.generateDefaultContent(
            `${employee.firstName} ${employee.lastName}`,
            departmentName,
            employee.hireDate,
          ),
        fileName: dto?.fileName,
        fileUrl: dto?.fileUrl,
      },
    });
  }

  async updateContract(
    contractId: string,
    dto: UpdateEmploymentContractDto,
    userRole: string,
  ) {
    if (!['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Только админ может обновлять договоры');
    }

    const db = this.prisma as any;
    const contract = await db.employmentContract.findUniqueOrThrow({
      where: { id: contractId },
    });

    return db.employmentContract.update({
      where: { id: contractId },
      data: {
        position: dto.position ?? contract.position,
        endDate: dto.endDate ?? contract.endDate,
        content: dto.content ?? contract.content,
        salary: dto.salary ?? contract.salary,
        fileName: dto.fileName ?? contract.fileName,
        fileUrl: dto.fileUrl ?? contract.fileUrl,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            hireDate: true,
          },
        },
      },
    });
  }

  async deleteContract(contractId: string, userRole: string) {
    if (!['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Только админ может удалять договоры');
    }

    const db = this.prisma as any;
    return db.employmentContract.delete({ where: { id: contractId } });
  }

  private generateDefaultContent(
    name: string,
    department: string,
    hireDate: Date,
  ): string {
    return `
ТРУДОВОЙ ДОГОВОР

Между работодателем и работником ${name}

Отделение: ${department}
Дата начала: ${hireDate.toLocaleDateString('ru-RU')}

Данный трудовой договор заключен в соответствии с законодательством 
и регулирует трудовые отношения между сторонами.

Условия:
- Работник принимает на себя обязательства по выполнению работ
- Работодатель гарантирует своевременную оплату труда
- Рабочее время и отпуск регулируются внутренними регламентами

Подписи сторон подтверждают согласие с условиями договора.
    `;
  }
}
