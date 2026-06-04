import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Agent markdown handler ──────────────────────────────────────────────
  const acceptHeader = request.headers.get("accept");
  if (acceptHeader === "text/markdown") {
    const markdown = `
# VetConnect SaaS - Agent API Catalog
Welcome to the VetConnect Agent Interface.

## Available Resources
- [Dashboard](/dashboard) - Overview of clinical operations
- [Patients](/dashboard/patients) - Manage animal health records
- [Agenda](/dashboard/appointments) - View and manage appointments
- [Customers](/dashboard/customers) - Manage client data

## API Documentation
Documentation is available at [/docs/api](/docs/api).

---
*VetConnect SaaS - Premium Veterinary Management*
    `;
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Markdown-Tokens": "supported",
      },
    });
  }

  const isAuthPage = pathname.startsWith("/auth");
  const isDashboard = pathname.startsWith("/dashboard");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPortalDashboard = pathname.startsWith("/portal/dashboard");
  const isPortalLogin = pathname === "/portal";
  const isPortalApi = pathname.startsWith("/api/portal");
  const isRoot = pathname === "/";

  if (process.env.NODE_ENV === "production") {
    const debugPrefixes = ["/api/debug", "/api/dev/run-tests", "/api/test-db"];

    const isDebugApi = debugPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (isDebugApi) {
      return new NextResponse(JSON.stringify({ error: "Not available in production" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // Handle Portal routes first (no getToken needed)
  if (isPortalDashboard || isPortalLogin || isPortalApi) {
    if (isPortalApi) return NextResponse.next();

    const portalSession = request.cookies.get("vet_portal_session")?.value;
    
    if (isPortalDashboard && !portalSession) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    
    if (isPortalLogin && portalSession) {
      return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // ── Dashboard Auth protection ───────────────────────────────────────────
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Always allow NextAuth API routes, but apply strict per-IP rate limiting in production
  if (isApiAuth) {
    if (process.env.NODE_ENV === "production") {
      const key =
        (request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          request.headers.get("x-real-ip") ||
          "unknown") + ":auth";
      // Cache-bust the auth-rate-limit bucket to avoid stale limits on the Next.js warm instance.
      // This is a lightweight in-memory guard; moving to Redis for multi-instance environments.
      const now = Date.now();
      const windowMs = 60_000;
      const limit = 10;
      const store: any = (global as any).__authRateStore || ((global as any).__authRateStore = new Map());
      const bucket = store.get(key);
      const count = bucket && now <= bucket.resetAt ? bucket.count + 1 : 1;
      store.set(key, { count, resetAt: now + windowMs });
      if (count > limit) {
        return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: { "content-type": "application/json" },
        });
      }
    }

    return NextResponse.next();
  }

  // If user is NOT logged in
  if (!token) {
    // Allow access to auth pages (login)
    if (isAuthPage) {
      return NextResponse.next();
    }

    // Redirect everything else (root, dashboard, etc.) to login
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If user IS logged in
  if (token) {
    // Redirect auth pages and root to dashboard (already logged in)
    if (isAuthPage || isRoot) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/auth/:path*",
    "/portal/:path*",
    "/api/portal/:path*",
  ],
};
