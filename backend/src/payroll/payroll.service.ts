import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { SalaryCalculationService } from './salary-calculation.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private salaryCalcService: SalaryCalculationService,
  ) {}

  /**
   * Create payroll item with automatic salary calculation based on worked hours
   */
  async create(dto: CreatePayrollDto, requesterRole: Role) {
    this.requireCanManagePayroll(requesterRole);

    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: dto.employeeId },
      select: { departmentId: true },
    });

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    // Calculate salary based on worked hours
    const salary = await this.salaryCalcService.calculateSalary(
      dto.employeeId,
      periodStart,
      periodEnd,
    );

    const bonuses = dto.bonuses ?? 0;
    const deductions = dto.deductions ?? 0;
    const total = salary.grossSalary + bonuses - deductions;

    return this.prisma.payrollItem.create({
      data: {
        employeeId: dto.employeeId,
        departmentId: dto.departmentId ?? employee.departmentId,
        periodStart,
        periodEnd,
        baseSalary: salary.grossSalary,
        bonuses,
        deductions,
        total,
        status: 'draft',
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, hourlyRate: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(filters: { employeeId?: string; departmentId?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.status) where.status = filters.status;

    return this.prisma.payrollItem.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ periodEnd: 'desc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.payrollItem.findUniqueOrThrow({
      where: { id },
      include: { employee: true, department: true },
    });
  }

  async approve(id: string, requesterRole: Role) {
    this.requireCanManagePayroll(requesterRole);
    return this.prisma.payrollItem.update({
      where: { id },
      data: { status: 'approved' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async markPaid(id: string, requesterRole: Role) {
    this.requireCanManagePayroll(requesterRole);
    return this.prisma.payrollItem.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  private requireCanManagePayroll(role: Role) {
    if (!['Admin', 'HR', 'Manager'].includes(role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }
}

