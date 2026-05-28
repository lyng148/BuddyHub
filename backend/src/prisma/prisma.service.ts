import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) return undefined;

  const databaseUrl = new URL(process.env.DATABASE_URL);
  if (!databaseUrl.searchParams.has('connection_limit')) {
    databaseUrl.searchParams.set('connection_limit', '1');
  }
  if (!databaseUrl.searchParams.has('pool_timeout')) {
    databaseUrl.searchParams.set('pool_timeout', '20');
  }

  return databaseUrl.toString();
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const url = getDatabaseUrl();
    super(url ? { datasources: { db: { url } } } : undefined);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
