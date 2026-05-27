/**
 * Zod validation schemas for API route inputs.
 * Import and use in POST/PATCH route handlers to reject invalid data early.
 */
import { z } from "zod";

// ─── Pagination ──────────────────────────────────────────────────────────────

/** Parses and caps pagination parameters from URLSearchParams. */
export function parsePagination(searchParams: URLSearchParams, maxLimit = 100) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") || "50") || 50)
  );
  return { page, limit, skip: (page - 1) * limit };
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export const patientCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  species: z.string().min(1, "Espécie é obrigatória").max(50),
  breed: z.string().max(100).optional().nullable(),
  gender: z.enum(["M", "F", "U"]).optional().nullable(),
  birthDate: z.string().datetime({ offset: true }).optional().nullable(),
  weight: z.number().positive().max(999).optional().nullable(),
  microchip: z.string().max(50).optional().nullable(),
  reproductiveStatus: z.string().max(50).optional().nullable(),
  aggressionLevel: z.string().max(50).optional().nullable(),
  coatColor: z.string().max(50).optional().nullable(),
  allergies: z.string().max(500).optional().nullable(),
  ownerId: z.string().uuid().optional(),
  isNewOwner: z.boolean().optional(),
  ownerName: z.string().min(1).max(100).optional(),
  ownerEmail: z.string().email().max(200).optional().nullable(),
  ownerPhone: z.string().max(30).optional().nullable(),
});

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;

// ─── Customer (Owner) ─────────────────────────────────────────────────────────

export const customerCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  vatNumber: z.string().max(20).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

// ─── Appointment ─────────────────────────────────────────────────────────────

export const appointmentCreateSchema = z.object({
  patientId: z.string().uuid("patientId inválido"),
  veterinarianId: z.string().uuid("veterinarianId inválido"),
  startTime: z.string().datetime({ offset: true, message: "startTime inválido" }),
  endTime: z.string().datetime({ offset: true, message: "endTime inválido" }),
  type: z.string().max(50).optional(),
  reason: z.string().max(500).optional().nullable(),
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;

// ─── Team User ───────────────────────────────────────────────────────────────

export const teamUserCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  email: z.string().email("Email inválido").max(200),
  role: z.enum(["ADMIN", "VETERINARIAN", "ASSISTANT", "RECEPTIONIST"]),
});

export type TeamUserCreateInput = z.infer<typeof teamUserCreateSchema>;

// ─── Inventory ───────────────────────────────────────────────────────────────

export const inventoryProductSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  price: z.number().nonnegative().max(999999),
  vatRate: z.number().int().min(0).max(100).optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  barcode: z.string().max(50).optional().nullable(),
  batchNumber: z.string().max(50).optional().nullable(),
  expiryDate: z.string().datetime({ offset: true }).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
});

export const inventoryAdjustSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["IN", "OUT"]),
  stockQuantity: z.number().int().positive(),
});
