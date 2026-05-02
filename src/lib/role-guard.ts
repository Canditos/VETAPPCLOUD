import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export type Role = "ADMIN" | "VETERINARIAN" | "ASSISTANT" | "RECEPTIONIST";

/**
 * Server-side guard to restrict access based on roles.
 * Use this in Page components.
 */
export async function roleGuard(allowedRoles: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const userRole = (session.user as any).role as Role;

  if (!allowedRoles.includes(userRole)) {
    // If not allowed, redirect to dashboard or access denied
    redirect("/dashboard?error=access_denied");
  }

  return session;
}
