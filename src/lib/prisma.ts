// @ts-ignore — Prisma v7 client
const { PrismaClient } = require('@prisma/client')
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
// Accelerate optional
const withAccelerate = (() => { try { return require('@prisma/extension-accelerate').withAccelerate; } catch { return null; } })()
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
          upsert: async () => ({}),
          delete: async () => ({}),
          count: async () => 0,
          aggregate: async () => ({}),
          groupBy: async () => [],
        };
      }
    });
  }

  try {
    const directUrl = process.env.DATABASE_URL || '';
    
    if (!directUrl) {
      throw new Error("DATABASE_URL is not defined");
    }

    // Check if Accelerate is configured
    if (process.env.PRISMA_ACCELERATE_URL) {
      console.log("Using Prisma Accelerate for global caching");
      return new PrismaClient({
        datasourceUrl: process.env.PRISMA_ACCELERATE_URL,
      }).$extends(withAccelerate());
    }

    // Fallback to direct connection with optimized pool for Serverless
    const isServerless = process.env.VERCEL === '1';
    const poolConfig = { 
      connectionString: directUrl,
      max: isServerless ? 5 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (err) {
    console.error("Failed to initialize Prisma Client:", err);
    throw err;
  }
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

const prisma = new Proxy({} as any, {
  get: (target, prop) => {
    const p = getPrisma();
    return p[prop];
  }
});

export default prisma;

export const getTenantClient = (clinicId: string) => {
  return getPrisma().$extends(multiTenantExtension(clinicId));
}
