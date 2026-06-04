import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async feed(role: Role, employeeId?: string | null) {
    const now = new Date();
    const items = await this.prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        reactions: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        views: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      take: 200,
    });

    const isAdmin = role === Role.Admin || role === Role.HR || role === Role.Manager;
    return items.map((item) => {
      const viewerList = isAdmin
        ? item.views.map((view) => ({
            employeeId: view.employeeId,
            firstName: view.employee.firstName,
            lastName: view.employee.lastName,
            viewedAt: view.viewedAt,
          }))
        : [];
      const reactionList = isAdmin
        ? item.reactions.map((reaction) => ({
            employeeId: reaction.employeeId,
            firstName: reaction.employee.firstName,
            lastName: reaction.employee.lastName,
            emoji: reaction.emoji,
            createdAt: reaction.createdAt,
          }))
        : [];
      const myReaction = employeeId
        ? item.reactions.find((reaction) => reaction.employeeId === employeeId)?.emoji ?? null
        : null;

      return {
        ...item,
        views: undefined,
        reactions: undefined,
        viewsCount: item.views.length,
        reactionsCount: item.reactions.length,
        viewers: viewerList,
        reactionDetails: reactionList,
        viewedByMe: employeeId ? item.views.some((view) => view.employeeId === employeeId) : false,
        myReaction,
      };
    });
  }

  async create(dto: CreateStoryDto, role: Role, employeeId?: string | null) {
    if (!dto?.mediaUrl) throw new BadRequestException('mediaUrl is required');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (role === Role.Employee) {
      if (!employeeId) throw new BadRequestException('employeeId is required');
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: { canPublishStories: true },
      });
      if (!employee?.canPublishStories) {
        throw new ForbiddenException('Публикация сторис не разрешена администратором');
      }
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

  async setPublishPermission(role: Role, employeeId: string, canPublish: boolean) {
    if (role !== Role.Admin && role !== Role.HR) {
      throw new ForbiddenException('Недостаточно прав');
    }
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { canPublishStories: canPublish },
      select: { id: true, firstName: true, lastName: true, canPublishStories: true },
    });
  }

  async markViewed(storyId: string, employeeId: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
    if (!story) throw new BadRequestException('Сторис не найдена');
    await this.prisma.storyView.upsert({
      where: {
        storyId_employeeId: { storyId, employeeId },
      },
      update: { viewedAt: new Date() },
      create: { storyId, employeeId },
    });
    return { success: true };
  }

  async setReaction(storyId: string, employeeId: string, emoji: string) {
    if (!emoji || emoji.trim().length === 0) {
      throw new BadRequestException('emoji is required');
    }
    const story = await this.prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
    if (!story) throw new BadRequestException('Сторис не найдена');

    const value = emoji.trim().slice(0, 8);
    await this.prisma.storyReaction.upsert({
      where: {
        storyId_employeeId: { storyId, employeeId },
      },
      update: { emoji: value, createdAt: new Date() },
      create: { storyId, employeeId, emoji: value },
    });
    return { success: true };
  }
}

