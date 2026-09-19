export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";

export const GET = withAuthParams<{ barcode: string }>(async (ctx, { barcode }) => {
  try {
    if (!barcode || barcode.length < 3) {
      return NextResponse.json({ error: "Barcode too short" }, { status: 400 });
    }

    const product = await ctx.tenantPrisma.product.findFirst({
      where: { barcode },
    });

    return NextResponse.json(product || { error: "Not found" }, {
      status: product ? 200 : 404,
    });
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
