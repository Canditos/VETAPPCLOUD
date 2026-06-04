import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  default: {},
  getTenantClient: vi.fn(() => ({ patient: {}, owner: {}, appointment: {} })),
}));

import { getServerSession } from "next-auth/next";
import { withAuth, withAuthParams } from "@/lib/api-wrapper";

describe("api-wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    (getServerSession as any).mockResolvedValue(null);

    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const response = await handler(new Request("http://localhost/api/test") as any);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when clinicId is missing", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "u1" } });

    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const response = await handler(new Request("http://localhost/api/test") as any);

    expect(response.status).toBe(401);
  });

  it("passes clinic context to handler", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "u1", clinicId: "c1", email: "user@x.com" },
    });

    const handler = withAuth(async ({ clinicId, userId }) => {
      return NextResponse.json({ clinicId, userId });
    });

    const response = await handler(new Request("http://localhost/api/test") as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.clinicId).toBe("c1");
    expect(body.userId).toBe("u1");
  });

  it("passes resolved params with withAuthParams", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "u1", clinicId: "c1", email: "user@x.com" },
    });

    const handler = withAuthParams<{ id: string }>(async (_ctx, params) => {
      return NextResponse.json({ id: params.id });
    });

    const response = await handler(new Request("http://localhost/api/test") as any, {
      params: Promise.resolve({ id: "abc" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("abc");
  });
});
