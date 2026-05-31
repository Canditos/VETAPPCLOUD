const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // 1. Create Clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: 'Clínica Veterinária Demo',
        vatNumber: '500000000',
        email: 'geral@clinica.pt'
      }
    });
    console.log('Clinic created:', clinic.id);

    // 2. Create Admin User
    const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(password, 10);
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@vetapp.com';
    
    const user = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        passwordHash: hash,
        role: 'ADMIN',
        clinicId: clinic.id
      }
    });
    console.log('User created:', user.email, 'with clinicId:', user.clinicId);
    
    console.log(`SUCCESS: You can now login with ${user.email} / ${password}`);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
main();
