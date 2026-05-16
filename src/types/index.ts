/**
 * ============================================
 * VET CONNECT SAAS - CENTRALIZED TYPES
 * ============================================
 *
 * Este ficheiro contém todas as interfaces TypeScript utilizadas
 * na aplicação. NÃO usar `any` — adicionar aqui primeiro.
 *
 * Estrutura:
 * - Enums (replicados do Prisma schema)
 * - Domain Models (entidades principais)
 * - DTOs (Data Transfer Objects para APIs)
 * - Component Props (interfaces de UI)
 * - API Response types
 */

// =============================================================================
// ENUMS (sincronizar com prisma/schema.prisma)
// =============================================================================

export type Role = "ADMIN" | "VETERINARIAN" | "RECEPTIONIST" | "MANAGER";

export type ConsultationStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "SENT"
  | "PAID"
  | "CANCELLED";

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "MBWAY"
  | "OTHER";

export type AttachmentType = "IMAGE" | "PDF" | "DOCUMENT";

export type MovementType = "IN" | "OUT" | "ADJUSTMENT";

// =============================================================================
// DOMAIN MODELS (baseados no Prisma schema)
// =============================================================================

export interface Clinic {
  id: string;
  name: string;
  vatNumber?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  jasminApiKey?: string | null;
  jasminAppId?: string | null;
  jasminSecret?: string | null;
  vendusApiKey?: string | null;
  vendusToken?: string | null;
  createdAt: string; // ISO date
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  licenseNumber?: string | null;
  role: Role;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  weight?: number | null;
  microchip?: string | null;
  reproductiveStatus?: string | null;
  aggressionLevel?: string | null;
  coatColor?: string | null;
  status: string;
  allergies?: string | null;
  clinicId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  // Relações populadas
  owner?: Owner;
  vitalSigns?: VitalSign[];
  vaccinations?: Vaccination[];
  dewormings?: Deworming[];
  consultations?: Consultation[];
  prescriptions?: Prescription[];
}

export interface Owner {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  notes?: string | null;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  clinicId: string;
  patientId: string;
  veterinarianId: string;
  date: string;
  status: ConsultationStatus;
  createdAt: string;
  updatedAt: string;
  // Relações
  patient?: Patient;
  veterinarian?: User;
  notes?: ClinicalNote;
  invoice?: Invoice;
}

export interface ClinicalNote {
  id: string;
  consultationId: string;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
}

export interface VitalSign {
  id: string;
  patientId: string;
  clinicId: string;
  weight?: number | null;
  temperature?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  date: string;
  veterinarianId?: string | null;
}

export interface Prescription {
  id: string;
  patientId: string;
  veterinarianId: string;
  clinicId: string;
  validUntil?: string | null;
  status: string;
  createdAt: string;
  // Relações
  patient?: Patient;
  veterinarian?: User;
  items: PrescriptionItem[];
}

export interface PrescriptionItem {
  id?: string;
  prescriptionId?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface Vaccination {
  id: string;
  patientId: string;
  vaccineName: string;
  lotNumber?: string | null;
  appliedAt: string;
  expiresAt?: string | null;
  veterinarianId?: string | null;
  createdAt: string;
}

export interface Deworming {
  id: string;
  patientId: string;
  type: string;
  appliedAt: string;
  expiresAt?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  clinicId: string;
  consultationId?: string | null;
  ownerId: string;
  vendusId?: string | null;
  jasminInvoiceId?: string | null;
  paymentMethod: PaymentMethod;
  total: number;
  status: InvoiceStatus;
  createdAt: string;
  // Relações
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string | null;
  description: string;
  quantity: number;
  price: number;
  vatRate: number;
}

export interface Product {
  id: string;
  clinicId: string;
  name: string;
  price: number;
  vatRate: number;
  stockQuantity: number;
  barcode?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  veterinarianId: string;
  startTime: string;
  endTime: string;
  type?: string | null;
  status: ConsultationStatus;
  consultationId?: string | null;
  createdAt: string;
  // Relações
  patient?: Patient;
}

export interface DiagnosticResult {
  id: string;
  type: "LAB" | "IMAGING";
  patientId: string;
  patientName?: string;
  ownerName?: string;
  summary?: string;
  testName?: string;
  source: string;
  status: "COMPLETED" | "PENDING" | "ALERT";
  createdAt: string;
}

// =============================================================================
// DTOs (Data Transfer Objects para APIs)
// =============================================================================

export interface CreateConsultationDTO {
  patientId: string;
  appointmentId?: string;
  notes: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  vitals?: {
    weight?: number | null;
    temperature?: number | null;
    heartRate?: number | null;
    respiratoryRate?: number | null;
  };
  items?: BillingItem[];
  billNow?: boolean;
  paymentMethod?: PaymentMethod;
}

export interface BillingItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  vatRate: number;
  type?: "PRODUCT" | "SERVICE";
}

export interface CreateInvoiceDTO {
  consultationId?: string;
  ownerId: string;
  paymentMethod: PaymentMethod;
  items: BillingItem[];
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  consultationsToday: number;
  pendingAppointments: number;
  activePatients: number;
  monthlyRevenue: number;
}

// =============================================================================
// INTEGRATION HEALTH TYPES
// =============================================================================

export type IntegrationStatus = "connected" | "configured" | "not_configured" | "offline" | "online";

export interface IntegrationHealth {
  vendus: {
    status: IntegrationStatus;
    label: string;
  };
  jasmin: {
    status: IntegrationStatus;
    label: string;
  };
  inventorySync: {
    status: "active" | "idle";
    label: string;
  };
  hl7: {
    status: "online" | "offline";
    label: string;
  };
  dicom: {
    status: "online" | "offline";
    label: string;
  };
  checkedAt: string;
}

// =============================================================================
// CLINICAL ALERTS
// =============================================================================

export type AlertLevel = "critical" | "warning" | "info";

export interface ClinicalAlert {
  level: AlertLevel;
  message: string;
  action?: string | null;
}

// =============================================================================
// UI / COMPONENT TYPES
// =============================================================================

export interface PageHeaderProps {
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export interface StatsGridItem {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  color?: "blue" | "emerald" | "rose" | "amber" | "purple" | "slate";
  subtext?: string;
}

export interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "default" | "dashed";
}
