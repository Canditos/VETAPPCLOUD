import { PrismaClient } from '@prisma/client'
import { multiTenantExtension } from './prisma-tenant-ext'

const prismaClientSingleton = () => {
  if (process.env.NEXT_PHASE === 'phase-production-build' && !process.env.DATABASE_URL) {
    console.warn("Skipping Prisma initialization during build due to missing DATABASE_URL");
    return {} as any;
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
