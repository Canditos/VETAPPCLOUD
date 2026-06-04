import { z } from "zod";

// ── Patient ──────────────────────────────────────────────────────────────────
export const CreatePatientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  species: z.string().min(1, "Espécie é obrigatória"),
  breed: z.string().optional().default(""),
  gender: z.string().optional().default(""),
  birthDate: z.string().optional().nullable().default(null),
  weight: z.coerce.number().positive().optional().nullable().default(null),
  ownerId: z.string().optional().default(""),
  isNewOwner: z.boolean().optional().default(false),
  ownerName: z.string().optional().default(""),
  ownerEmail: z.string().optional().default(""),
  ownerPhone: z.string().optional().default(""),
  microchip: z.string().optional().nullable().default(null),
  reproductiveStatus: z.string().optional().default(""),
  aggressionLevel: z.string().optional().default(""),
  coatColor: z.string().optional().default(""),
  allergies: z.string().optional().default(""),
});

export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;

// ── Appointment ──────────────────────────────────────────────────────────────
export const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1, "Paciente é obrigatório"),
  veterinarianId: z.string().min(1, "Veterinário é obrigatório"),
  startTime: z.string().min(1, "Início é obrigatório"),
  endTime: z.string().min(1, "Fim é obrigatório"),
  type: z.string().optional().default(""),
  reason: z.string().optional().default(""),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

export const UpdateAppointmentSchema = z.object({
  patientId: z.string().optional(),
  veterinarianId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  type: z.string().optional(),
  reason: z.string().optional(),
  status: z.string().optional(),
});

export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;

// ── Pagination ───────────────────────────────────────────────────────────────
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional().default(""),
  species: z.string().optional().default(""),
});
