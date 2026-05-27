# Security and RBAC Audit

Date: 2026-05-27
Branch: melhorias/coolify-hardening-2026-05-27

## Scope
This audit classifies API route protection by guard type:
- `withRole`: auth + tenant + role-permission check
- `withAuth`: auth + tenant only
- `withPortalSession`: portal cookie/JWT session validation for owner-facing portal APIs
- `none`: no explicit wrapper detected in route file

## Current Coverage
- Total API route files: 84
- `withRole`: 14
- `withAuth`: 51
- `withPortalSession`: 5
- `none`: 14

## Middleware Gate (Cross-Cutting Control)
`src/middleware.ts` now enforces API access by default:
- `/api/:path*` requires authenticated NextAuth token, except explicit allowlist routes.
- `/api/portal/:path*` requires either portal session cookie or authenticated NextAuth token, except portal auth public endpoints.

This means `none` routes are no longer automatically public by default. They are either:
- explicitly public by design,
- protected by secret/feature flag checks inside the route,
- or covered by middleware-level auth gate.

## Hardening Completed In This Package
- Added schema validation (`zod`) and removed `any` in:
  - `src/app/api/privacy/consent/route.ts`
  - `src/app/api/privacy/send-invite/route.ts`
  - `src/app/api/settings/sms-stats/route.ts`
  - `src/app/api/settings/templates/route.ts`
- Upgraded those routes from `withAuth` to `withRole` where applicable.
- Added role-aware guard support for parameterized routes via `withRoleParams`.
- Upgraded high-priority ID routes to explicit role checks:
  - `src/app/api/appointments/[id]/route.ts`
  - `src/app/api/customers/[id]/route.ts`
  - `src/app/api/hospitalization/[id]/route.ts`
  - `src/app/api/inventory/[id]/route.ts`
  - `src/app/api/owners/route.ts`
- Upgraded additional sensitive endpoints to role checks:
  - `src/app/api/marketing/campaigns/route.ts`
  - `src/app/api/sms-logs/route.ts`
- Migrated portal data routes to explicit portal-session wrappers:
  - `src/app/api/portal/appointments/[id]/confirm/route.ts`
  - `src/app/api/portal/appointments/route.ts`
  - `src/app/api/portal/invoices/route.ts`
  - `src/app/api/portal/me/route.ts`
  - `src/app/api/portal/privacy/route.ts`

## Remaining `none` Routes (Intentional / Special Flow)
- Public auth/framework:
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `src/app/api/auth/register/route.ts`
- Public health/policy:
  - `src/app/api/health/route.ts`
  - `src/app/api/privacy/policy/route.ts`
- Secret-gated jobs/webhooks/dev tools:
  - `src/app/api/cron/reminder-24h/route.ts`
  - `src/app/api/cron/vaccine-alert/route.ts`
  - `src/app/api/debug/seed/route.ts`
  - `src/app/api/dev/run-tests/route.ts`
  - `src/app/api/integrations/examion/route.ts`
  - `src/app/api/integrations/fuji/route.ts`
- Portal session/token flows (middleware-gated):
  - `src/app/api/portal/auth/login/route.ts`
  - `src/app/api/portal/auth/logout/route.ts`
  - `src/app/api/portal/auth/magic/route.ts`
  - `src/app/api/portal/messages/route.ts`

## Recommended Migration Plan
1. Convert high-risk `none` routes to `withRole` where they are clinic-internal APIs.
2. Keep public routes as `none` only if intentionally public and documented.
3. Convert `withAuth` routes handling sensitive write actions to `withRole`.
4. Add a CI check to fail when new API routes are added without explicit guard classification.

## Notes
- `none` does not always mean vulnerable; some portal routes may perform custom cookie/JWT checks internally.
- This file tracks coverage status and prioritization, not a full penetration test.
