import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAttendanceDto, requesterRole: Role) {
    this.requireCanManageAttendance(requesterRole);
    const checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
    const checkOut = dto.checkOut ? new Date(dto.checkOut) : null;
    const workHours = this.calcWorkHours(checkIn, checkOut);

    return this.prisma.attendance.create({
      data: {
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        checkIn,
        checkOut,
        workHours: workHours ?? null,
        status: dto.status ?? 'present',
        notes: dto.notes,
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
  }

  async findAll(filters: { employeeId?: string; from?: string; to?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) (where.date as Record<string, Date>).gte = new Date(filters.from);
      if (filters.to) (where.date as Record<string, Date>).lte = new Date(filters.to);
    }

    return this.prisma.attendance.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.attendance.findUniqueOrThrow({
      where: { id },
      include: { employee: true },
    });
  }

  async update(id: string, dto: UpdateAttendanceDto, requesterRole: Role) {
    this.requireCanManageAttendance(requesterRole);
    const existing = await this.prisma.attendance.findUniqueOrThrow({ where: { id } });
    const checkIn = dto.checkIn != null ? new Date(dto.checkIn) : existing.checkIn;
    const checkOut = dto.checkOut != null ? new Date(dto.checkOut) : existing.checkOut;
    const workHours = this.calcWorkHours(checkIn, checkOut);

    return this.prisma.attendance.update({
      where: { id },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.checkIn !== undefined && { checkIn: checkIn }),
        ...(dto.checkOut !== undefined && { checkOut: checkOut }),
        ...(workHours != null && { workHours }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { employee: true },
    });
  }

  async remove(id: string, requesterRole: Role) {
    this.requireCanManageAttendance(requesterRole);
    return this.prisma.attendance.delete({ where: { id } });
  }

  private requireCanManageAttendance(role: Role) {
    if (!['Admin', 'HR', 'Manager'].includes(role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  private calcWorkHours(checkIn: Date | null, checkOut: Date | null): number | null {
    if (!checkIn || !checkOut || checkOut <= checkIn) return null;
    return Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60) * 100) / 100;
  }
}
