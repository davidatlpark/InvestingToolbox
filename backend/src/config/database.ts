import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Create a single Prisma client instance
// In development, we want to avoid creating multiple instances due to hot reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};
