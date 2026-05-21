import { Injectable, ConflictException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService implements OnModuleInit {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const defaults = [
      { name: 'Human Resources', code: 'HR', description: 'HR отдел' },
      { name: 'Доставка', code: 'DELIVERY', description: 'Отдел доставки' },
      { name: 'Кухня', code: 'KITCHEN', description: 'Кухня и производство' },
    ];

    for (const department of defaults) {
      await this.prisma.department.upsert({
        where: { code: department.code },
        update: {},
        create: department,
      });
    }

    const count = await this.prisma.department.count();
    this.logger.log(`Departments ready: ${count}`);
  }

  async create(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) throw new ConflictException('Отдел с таким кодом уже существует');
    return this.prisma.department.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(),
        description: dto.description,
      },
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.department.findUniqueOrThrow({
      where: { id },
      include: { employees: true },
    });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    if (dto.code) {
      const existing = await this.prisma.department.findFirst({
        where: { code: dto.code.toUpperCase(), NOT: { id } },
      });
      if (existing) throw new ConflictException('Отдел с таким кодом уже существует');
    }
    return this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code.toUpperCase() }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }
}
