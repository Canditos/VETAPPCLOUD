const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.ownerPortalToken.findMany().then(t => console.log(t)).finally(() => p.$disconnect());
