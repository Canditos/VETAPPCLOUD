import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function getPortalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vet_portal_session")?.value;

  if (!token) return null;

  try {
    if (!process.env.NEXTAUTH_SECRET) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { ownerId: string; clinicId: string };
  } catch (error) {
    return null;
  }
}
