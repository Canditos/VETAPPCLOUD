import prisma from "@/lib/prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VIEW";

export interface AuditEntry {
  clinicId: string;
  userId?: string | null;
  userName?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: unknown;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        clinicId: entry.clinicId,
        userId: entry.userId ?? null,
        userName: entry.userName ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        metadata: (entry.metadata ?? undefined) as never,
      },
    });
  } catch (error) {
    console.error("[AUDIT_FAILED]", entry.entity, entry.action, error);
  }
}
