import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 300; 

export async function GET() {
  const clinicId = "c1-demo-clinic";
  const results = { 
    imported: 0, 
    skipped: 0, 
    errors: 0,
    details: [] as string[]
  };

  const inventoryPath = path.join(process.cwd(), "inventory_export.csv");
  
  if (!fs.existsSync(inventoryPath)) {
    return NextResponse.json({ error: "inventory_export.csv not found in project root" }, { status: 404 });
  }

  try {
    const raw = fs.readFileSync(inventoryPath, "latin1");
    const lines = raw.split(/\r?\n/);
    
    // Header: Código;Nome;Categoria;Stock;Valor Unit.;Valor Total
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split(";");
      if (fields.length < 5) {
        results.skipped++;
        continue;
      }

      const code = fields[0]?.trim();
      const name = fields[1]?.trim();
      const category = fields[2]?.trim();
      const stockStr = fields[3]?.trim() || "0";
      const priceStr = fields[4]?.trim() || "0";

      if (!name || name === "Nome") {
        results.skipped++;
        continue;
      }

      // Convert stock (e.g. "2.00" -> 2)
      const stockQuantity = Math.floor(parseFloat(stockStr.replace(",", ".")) || 0);
      
      // Convert price (e.g. "26,54" -> 26.54)
      const price = parseFloat(priceStr.replace(",", ".")) || 0;

      try {
        await prisma.product.upsert({
          where: { 
            // We don't have a unique ID in the CSV besides maybe the name/code combination
            // but for now let's use name + clinicId as a proxy if we had a unique constraint
            // Since we don't have a unique constraint on name, we'll try to find by name first
            id: `inv-${code || i}` 
          },
          update: {
            name,
            category,
            stockQuantity,
            price,
            barcode: code || null,
          },
          create: {
            id: `inv-${code || i}`,
            name,
            category,
            stockQuantity,
            price,
            barcode: code || null,
            clinicId,
          },
        });
        results.imported++;
      } catch (err: any) {
        results.errors++;
        if (results.details.length < 20) {
          results.details.push(`Error at line ${i} [${name}]: ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      message: "Inventory import complete!",
      ...results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
