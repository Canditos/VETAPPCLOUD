/* eslint-disable @typescript-eslint/no-require-imports */
const { Prisma } = require('@prisma/client');

/**
 * Prisma Extension for Multi-tenancy
 * This extension automatically filters all queries by the 'clinicId' 
 * and ensures new records are always linked to the correct tenant.
 *
 * IMPORTANT: Operations that require exact unique-field matching
 * (findUnique, update, delete) do NOT get clinicId auto-injected,
 * because Prisma requires the `where` clause to match only the fields
 * of a unique constraint (@id or @@unique). Adding extra fields would
 * throw "not available in the where clause" errors.
 *
 * For those operations, the caller MUST manually add clinicId to where,
 * or (preferred) use findFirst first to verify ownership.
 */
export const multiTenantExtension = (clinicId: string) => {
  return Prisma.defineExtension({
    name: 'multiTenantExtension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: { model: any; operation: any; args: any; query: any }) {
          // List of models that should be isolated by clinicId
          const tenantModels = [
            'User', 'Patient', 'Owner', 'Consultation', 'Appointment',
            'Invoice', 'Product', 'StockMovement',
            'LabResult', 'ImagingStudy', 'Hospitalization',
            'Prescription', 'Vaccination', 'Deworming',
            'Budget', 'Payment', 'HealthPlan', 'Subscription',
            'VitalSign', 'Notification', 'SmsLog',
            'PortalMessage', 'ServicePack', 'PrivacyConsent',
            'PortalAppointmentRequest',
          ];

          if (tenantModels.includes(model)) {
            // Operations where we can safely inject clinicId into `where`
            // (these accept arbitrary fields — NOT unique-constrained lookups)
            if (['findMany', 'findFirst', 'count', 'aggregate', 'groupBy', 'updateMany', 'deleteMany'].includes(operation)) {
              args.where = { ...args.where, clinicId };
            }

            // For create operations, inject clinicId into `data`
            if (['create', 'createMany'].includes(operation)) {
              if (operation === 'create') {
                args.data = { ...args.data, clinicId };
              } else if (operation === 'createMany') {
                if (Array.isArray(args.data)) {
                  args.data = args.data.map((item: any) => ({ ...item, clinicId }));
                } else {
                  args.data = { ...args.data, clinicId };
                }
              }
            }
          }

          return query(args);
        },
      },
    },
  });
};
