import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function csrfProtection(req: Request): NextResponse | null {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return null;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const source = origin || (referer ? new URL(referer).origin : null);

  if (!source) {
    // Sem Origin/Referer: pode ser cliente não-browser (cron, integrações) ou
    // um browser cross-site. Usamos Sec-Fetch-Site para distinguir.
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") {
      console.warn(`[CSRF] Rejected ${req.method} ${req.url} (cross-site, sem origin)`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return null;
  }

  const expected = process.env.NEXTAUTH_URL || "https://vet.gatoescondido.com";
  const allowed = [expected.replace(/\/$/, ""), ...ALLOWED_ORIGINS];
  if (allowed.some((a) => source.startsWith(a))) return null;

  console.warn(`[CSRF] Rejected ${req.method} ${req.url} from origin=${origin} referer=${referer}`);
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
