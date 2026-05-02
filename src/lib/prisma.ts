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
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

let _prisma: any;
const getPrisma = () => {
  if (!_prisma) {
    _prisma = globalThis.prisma ?? prismaClientSingleton();
    if (process.env.NODE_ENV !== 'production') globalThis.prisma = _prisma;
  }
  return _prisma;
}

// Lazy Export to prevent build-time initialization
const prisma = new Proxy({} as any, {
  get: (target, prop) => {
    return getPrisma()[prop];
  }
});

export default prisma;

/**
 * Returns a Prisma client instance scoped to a specific clinic.
 */
export const getTenantClient = (clinicId: string) => {
  return getPrisma().$extends(multiTenantExtension(clinicId));
}
