# VetConnect SaaS — Premium Veterinary Ecosystem 🐾

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Jasmin ERP](https://img.shields.io/badge/Jasmin-ERP_Integrated-orange?style=for-the-badge)](https://www.jasminsoftware.com/)

VetConnect is a high-performance, enterprise-grade SaaS platform designed for modern veterinary clinics. It combines clinical precision with financial automation through deep integration with the Jasmin ERP system.

## 💎 Premium Design Language
The interface follows a **"Premium Pro"** aesthetic, characterized by:
- **Ultra-Deep Dark Mode**: Utilizing the `oklch` color space for superior contrast and legibility.
- **Glassmorphism Components**: High-fidelity UI elements with multi-layered blur and border-glow effects.
- **Kinetic Interactivity**: Smooth, physics-based animations (`premium-slide`) and responsive micro-interactions.
- **Enterprise Typography**: Bold, black-weight typography for a authoritative yet modern feel.

## 🚀 Key Modules

### 📅 Master Agenda (Calendar)
- **Fluid Scheduling**: Optimized rendering logic (`O(N)` grouping) for zero-latency grid interactions.
- **Clinical Views**: Interactive detail dialogs with one-click consultation starts.
- **Visual Hierarchy**: Color-coded appointments by veterinarian and urgency icons.

### 🏥 Clinical Records (Electronic Health Records)
- **Advanced SOAP Documentation**: Structured clinical notes (Subjective, Objective, Assessment, Plan).
- **Diagnostic Integration**: Direct HL7/DICOM communication with Lab (Fuji) and Imaging (Examion) systems.
- **Interactive Timeline**: A chronological history of all patient interactions, weights, and treatments.

### 💰 Financial Hub (Jasmin ERP)
- **Automated Billing**: Instant invoice generation in Jasmin ERP upon consultation closure.
- **VAT Compliance**: Real-time validation of NIF (VAT numbers) and fiscal addresses.
- **Inventory Sync**: Real-time deduction of clinical stock and pharmacy items.

## 🛠️ Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4.
- **State Management**: TanStack Query (React Query) for robust data synchronization.
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL.
- **Integrations**: Jasmin ERP API, HL7/DICOM simulation layers.

## 📸 Interface Preview
*(Screenshots to be added here)*

| Dashboard | Master Agenda | Clinical SOAP |
| :---: | :---: | :---: |
| ![Dashboard](https://placehold.co/600x400?text=Dashboard+Preview) | ![Agenda](https://placehold.co/600x400?text=Agenda+Preview) | ![SOAP](https://placehold.co/600x400?text=SOAP+Preview) |

## 📦 Installation & Setup

### 1. Clone and Install
```bash
npm install
```

### 2. Start PostgreSQL with Docker
```bash
docker-compose up -d
```
Services:
- **PostgreSQL**: `localhost:5432` (user: `vetconnect`, pass: `vetconnect123`, db: `vetconnect`)
- **pgAdmin**: `http://localhost:5050` (email: `admin@vetconnect.local`, pass: `admin123`)

### 3. Configure Environment
```bash
cp .env.local.example .env.local  # already created
# Edit .env.local if needed (defaults work for local dev)
```

### 4. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Seed Demo Data (optional)
```bash
# Start the dev server, then visit:
# http://localhost:3000/api/debug/seed
```

### 6. Start Development Server
```bash
npm run dev
```

### Useful Commands
```bash
# View database in pgAdmin
# 1. Open http://localhost:5050
# 2. Login with admin@vetconnect.local / admin123
# 3. Add Server: localhost:5432, user vetconnect, pass vetconnect123

# Reset database
docker-compose down -v  # removes data volume
docker-compose up -d
npx prisma migrate reset

# Re-generate Prisma client after schema changes
npx prisma generate
```

---
Developed with ❤️ by the VetConnect Engineering Team.
