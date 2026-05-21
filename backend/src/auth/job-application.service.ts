import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateJobApplicationDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  experience?: string;
}

export interface ReviewJobApplicationDto {
  status: 'approved' | 'rejected';
  notes?: string;
  password?: string;
}

@Injectable()
export class JobApplicationService {
  constructor(private prisma: PrismaService) {}

  async createApplication(dto: CreateJobApplicationDto) {
    return this.prisma.jobApplication.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        position: dto.position,
        experience: dto.experience,
        status: 'pending',
      },
    });
  }

  async getAllApplications() {
    return this.prisma.jobApplication.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getApplicationById(id: string) {
    return this.prisma.jobApplication.findUniqueOrThrow({
      where: { id },
    });
  }

  async reviewApplication(id: string, dto: ReviewJobApplicationDto, reviewedBy: string) {
    const application = await this.prisma.jobApplication.findUniqueOrThrow({
      where: { id },
    });

    if (dto.status === 'approved') {
      const password = dto.password?.trim();
      if (!password) {
        throw new BadRequestException('Для одобрения заявки нужно задать пароль');
      }

      const normalizedEmail = application.email.trim().toLowerCase();
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (existingUser) {
        throw new ConflictException('Аккаунт с таким email уже существует');
      }

      let employee = await this.prisma.employee.findFirst({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      if (!employee) {
        employee = await this.prisma.employee.create({
          data: {
            firstName: application.firstName,
            lastName: application.lastName,
            email: normalizedEmail,
            phone: application.phone,
            hireDate: new Date(),
            hourlyRate: 0,
          },
          select: { id: true },
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: 'Employee',
          employeeId: employee.id,
        },
      });
    }

    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes,
        reviewedAt: new Date(),
        reviewedBy,
      },
    });
  }

  async deleteApplication(id: string) {
    return this.prisma.jobApplication.delete({
      where: { id },
    });
  }
}
