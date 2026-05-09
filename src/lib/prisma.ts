import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { multiTenantExtension } from './prisma-tenant-ext'

/**
 * Extract the direct PostgreSQL URL from a prisma+postgres:// URL.
 * The api_key is a base64-encoded JSON with a databaseUrl field.
 */
function getDirectPostgresUrl(): string {
  const dbUrl = process.env.DATABASE_URL || '';
  
  if (dbUrl.startsWith('prisma+postgres://')) {
    try {
      const apiKey = dbUrl.split('api_key=')[1];
      if (apiKey) {
        const payload = Buffer.from(apiKey, 'base64').toString('utf-8');
        const data = JSON.parse(payload);
        return data.databaseUrl;
      }
    } catch (e) {
      console.warn('Could not parse prisma+postgres URL, using as-is');
    }
  }
  
  // If it's already a direct postgres:// URL, use it
  return dbUrl;
}

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
    const directUrl = getDirectPostgresUrl();
    
    if (!directUrl) {
      throw new Error("DATABASE_URL is not defined or is empty");
    }

    // Serverless optimization: limit pool size for Vercel
    const isServerless = process.env.VERCEL === '1';
    const poolConfig = { 
      connectionString: directUrl,
      max: isServerless ? 5 : 10, // Reduce max connections in serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // Increase timeout for serverless cold starts
    };

    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (err) {
    console.error("Failed to initialize Prisma Client with Adapter:", err);
    // Re-throw the error instead of returning a broken client
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

// Lazy Export to prevent build-time initialization
const prisma = new Proxy({} as any, {
  get: (target, prop) => {
    const p = getPrisma();
    return p[prop];
  }
});

export default prisma;

/**
 * Returns a Prisma client instance scoped to a specific clinic.
 */
export const getTenantClient = (clinicId: string) => {
  return getPrisma().$extends(multiTenantExtension(clinicId));
}
