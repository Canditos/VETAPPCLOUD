export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/inventory - List products
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const clinicId = (session.user as any).clinicId;

    const products = await prisma.product.findMany({
      where: { clinicId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("[INVENTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/inventory - Add or Update product stock
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;
  const body = await req.json();

  const { id, name, price, stockQuantity, barcode, type } = body;

  try {
    if (id) {
      // Update stock movement manually
      const updated = await prisma.product.update({
        where: { id },
        data: {
          stockQuantity: {
            increment: type === "IN" ? stockQuantity : -stockQuantity,
          },
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: id,
          type: type || "IN",
          quantity: stockQuantity,
          source: "manual",
        },
      });

      return NextResponse.json(updated);
    } else {
      // Create new product
      const product = await prisma.product.create({
        data: {
          clinicId,
          name,
          price,
          stockQuantity,
          barcode,
        },
      });
      return NextResponse.json(product);
    }
  } catch (error) {
    return NextResponse.json({ error: "Inventory update failed" }, { status: 500 });
  }
}
