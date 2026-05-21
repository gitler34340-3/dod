import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async feed() {
    const now = new Date();
    return this.prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 200,
    });
  }

  async create(dto: CreateStoryDto, role: Role, employeeId?: string | null) {
    if (!dto?.mediaUrl) throw new BadRequestException('mediaUrl is required');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (role === Role.Employee) {
      if (!employeeId) throw new BadRequestException('employeeId is required');
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const already = await this.prisma.story.findFirst({
        where: {
          employeeId,
          createdAt: { gte: startOfDay },
        },
        select: { id: true },
      });
      if (already) throw new BadRequestException('Сотрудник может публиковать 1 сторис в день');
    }

    return this.prisma.story.create({
      data: {
        employeeId: employeeId ?? null,
        title: dto.title ?? null,
        caption: dto.caption ?? null,
        mediaUrl: dto.mediaUrl,
        expiresAt,
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });
  }
}

