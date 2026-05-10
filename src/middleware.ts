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
- [Agenda](/dashboard/calendar) - View and manage appointments
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

  // ── Auth protection ─────────────────────────────────────────────────────
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthPage = pathname.startsWith("/auth");
  const isDashboard = pathname.startsWith("/dashboard");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPortal = pathname.startsWith("/portal") || pathname.startsWith("/api/portal");
  const isRoot = pathname === "/";

  // Always allow NextAuth API routes
  if (isApiAuth) return NextResponse.next();

  // Portal uses its own token auth — never block these routes
  if (isPortal) return NextResponse.next();

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
