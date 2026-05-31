import prisma from "@/lib/prisma";

export function createRateLimiter(options: { windowMs: number; maxAttempts: number }) {
  const { windowMs, maxAttempts } = options;

  return {
    async check(key: string): Promise<{ allowed: boolean; retryAfter: number }> {
      const now = new Date();
      const staleThreshold = new Date(now.getTime() - windowMs * 2);
      const activeWindowStart = new Date(now.getTime() - windowMs);

      await prisma.rateLimitEntry.deleteMany({
        where: {
          windowStart: {
            lt: staleThreshold,
          },
        },
      });

      const entry = await prisma.rateLimitEntry.findUnique({
        where: { key },
      });

      if (!entry || entry.windowStart < activeWindowStart) {
        await prisma.rateLimitEntry.upsert({
          where: { key },
          update: { attempts: 1, windowStart: now },
          create: { key, attempts: 1, windowStart: now },
        });
        return { allowed: true, retryAfter: 0 };
      }

      if (entry.attempts >= maxAttempts) {
        const retryAfter = Math.max(
          0,
          Math.ceil((entry.windowStart.getTime() + windowMs - now.getTime()) / 1000)
        );
        return { allowed: false, retryAfter };
      }

      await prisma.rateLimitEntry.update({
        where: { key },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return { allowed: true, retryAfter: 0 };
    },

    async reset(key: string) {
      await prisma.rateLimitEntry.deleteMany({
        where: { key },
      });
    },
  };
}

export function buildRateLimitKey(ip: string, identifier: string) {
  return `${ip}:${identifier.toLowerCase()}`;
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
