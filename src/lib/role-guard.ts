import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/roles";

/**
 * Server-side guard to restrict access based on roles.
 * Use this in Page components.
 */
export async function roleGuard(allowedRoles: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const userRole = (session.user as { role?: Role }).role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    // If not allowed, redirect to dashboard or access denied
    redirect("/dashboard?error=access_denied");
  }

  return session;
}
