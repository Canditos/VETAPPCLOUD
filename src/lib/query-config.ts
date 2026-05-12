/**
 * Shared TanStack Query stale time constants.
 * Use these instead of hardcoded values to ensure consistency
 * across all pages and reduce unnecessary refetches.
 */
export const STALE_TIMES = {
  /** 15 seconds — live data: dashboard KPIs, calendar today */
  LIVE: 15 * 1000,
  /** 1 minute — standard data: patients, billing, consultations */
  NORMAL: 60 * 1000,
  /** 5 minutes — slow-changing: team, settings, clinic info */
  STATIC: 5 * 60 * 1000,
  /** 30 minutes — very stable: vets list for dropdowns */
  STABLE: 30 * 60 * 1000,
} as const;
