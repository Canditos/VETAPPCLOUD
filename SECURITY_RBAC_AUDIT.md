# Security and RBAC Audit

Date: 2026-05-27
Branch: melhorias/coolify-hardening-2026-05-27

## Scope
This audit classifies API route protection by guard type:
- `withRole`: auth + tenant + role-permission check
- `withAuth`: auth + tenant only
- `none`: no `withAuth` or `withRole` wrapper detected in route file

## Current Coverage
- Total API route files: 84
- `withRole`: 7
- `withAuth`: 40
- `none`: 37

## Hardening Completed In This Package
- Added schema validation (`zod`) and removed `any` in:
  - `src/app/api/privacy/consent/route.ts`
  - `src/app/api/privacy/send-invite/route.ts`
  - `src/app/api/settings/sms-stats/route.ts`
  - `src/app/api/settings/templates/route.ts`
- Upgraded those routes from `withAuth` to `withRole` where applicable.

## Highest Priority Gaps (No Guard Wrapper)
These routes should be reviewed first for explicit auth/tenant/role guarantees:
- `src/app/api/appointments/[id]/route.ts`
- `src/app/api/customers/[id]/route.ts`
- `src/app/api/hospitalization/[id]/route.ts`
- `src/app/api/inventory/[id]/route.ts`
- `src/app/api/patients/[id]/route.ts`
- `src/app/api/owners/route.ts`
- `src/app/api/portal/appointments/route.ts`
- `src/app/api/portal/invoices/route.ts`
- `src/app/api/portal/messages/route.ts`
- `src/app/api/notifications/[id]/read/route.ts`

## Recommended Migration Plan
1. Convert high-risk `none` routes to `withRole` where they are clinic-internal APIs.
2. Keep public routes as `none` only if intentionally public and documented.
3. Convert `withAuth` routes handling sensitive write actions to `withRole`.
4. Add a CI check to fail when new API routes are added without explicit guard classification.

## Notes
- `none` does not always mean vulnerable; some portal routes may perform custom cookie/JWT checks internally.
- This file tracks coverage status and prioritization, not a full penetration test.
