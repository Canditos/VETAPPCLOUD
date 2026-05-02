import { PrismaClient } from '@prisma/client'
import { multiTenantExtension } from './prisma-tenant-ext'

const prismaClientSingleton = () => {
  if (process.env.NEXT_PHASE === 'phase-production-build' && !process.env.DATABASE_URL) {
    console.warn("Using No-Op Prisma Proxy during build phase");
    return new Proxy({} as any, {
      get: (target, prop) => {
        if (prop === '$extends') return () => prisma;
        if (prop === '$transaction') return (fn: any) => fn(prisma);
        return {
          findMany: async () => [],
          findUnique: async () => null,
          findFirst: async () => null,
          create: async () => ({}),
          update: async () => ({}),
          delete: async () => ({}),
          count: async () => 0,
          aggregate: async () => ({}),
          groupBy: async () => [],
        };
      }
    });
  }
  return new PrismaClient();
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

/**
 * Returns a Prisma client instance scoped to a specific clinic.
 * All queries made through this client will automatically include the clinicId.
 */
export const getTenantClient = (clinicId: string) => {
  return prisma.$extends(multiTenantExtension(clinicId));
}
