'use server';

import { NextRequest } from 'next/server';

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX = 10;

function getKey(req: NextRequest, identifier: string) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return `${ip}:${identifier}`;
}

export function assertAuthRateLimit(req: NextRequest) {
  const key = getKey(req, 'auth');
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  bucket.count += 1;

  if (bucket.count > MAX) {
    return false;
  }

  return true;
}
