/* eslint-disable @typescript-eslint/no-require-imports */
const { Prisma } = require('@prisma/client');

/**
 * Prisma Extension for Multi-tenancy
 * This extension automatically filters all queries by the 'clinicId' 
 * and ensures new records are always linked to the correct tenant.
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
            'LabResult', 'ImagingStudy', 'Hospitalization'
          ];

          if (tenantModels.includes(model)) {
            // 1. For read/update/delete operations, inject clinicId into 'where'
            if (['findMany', 'findFirst', 'findUnique', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
              args.where = { ...args.where, clinicId };
            }

            // 2. For create operations, inject clinicId into 'data'
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

            // 3. Special handling for nested connect/create could be added here
          }

          return query(args);
        },
      },
    },
  });
};
