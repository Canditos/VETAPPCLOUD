const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://neondb_owner:npg_MX6YGrv5jJzP@ep-cool-hat-algk1xes-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
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
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@vetapp.com',
        passwordHash: hash,
        role: 'ADMIN',
        clinicId: clinic.id
      }
    });
    console.log('User created:', user.email, 'with clinicId:', user.clinicId);
    
    console.log('SUCCESS: You can now login with admin@vetapp.com / admin123');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
main();
