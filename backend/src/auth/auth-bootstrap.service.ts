import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_ADMIN_EMAIL = 'admin@hr.local';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';

@Injectable()
export class AuthBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AuthBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    await this.prisma.user.upsert({
      where: { email: DEFAULT_ADMIN_EMAIL },
      update: {
        passwordHash,
        role: 'Admin',
      },
      create: {
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash,
        role: 'Admin',
      },
    });

    this.logger.log(`Default admin is ready: ${DEFAULT_ADMIN_EMAIL}`);
  }
}
