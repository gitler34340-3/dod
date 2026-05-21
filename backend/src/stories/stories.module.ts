import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  controllers: [StoriesController],
  providers: [StoriesService, PrismaService],
})
export class StoriesModule {}

