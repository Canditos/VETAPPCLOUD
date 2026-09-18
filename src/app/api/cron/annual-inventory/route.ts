export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import nodemailer from "nodemailer";
import { AnnualInventoryPDF } from "@/components/reports/AnnualInventoryPDF";

async function handleAnnualInventoryCron(req: Request) {
  const { searchParams } = new URL(req.url);
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = bearerToken || searchParams.get("secret");

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = searchParams.get("force") === "true";
  const now = new Date();
  const isLastDay = now.getMonth() === 11 && now.getDate() === 31;
  if (!isLastDay && !force) {
    return NextResponse.json({ message: "Not Dec 31 — skipped (use ?force=true to test)" });
  }

  try {
    const targetClinicId = searchParams.get("clinicId");
    const clinics = await prisma.clinic.findMany({
      where: targetClinicId ? { id: targetClinicId } : undefined,
      select: { id: true, name: true, email: true },
    });

    const results: any[] = [];
    const year = now.getFullYear();

    for (const clinic of clinics) {
      const users = await prisma.user.findMany({
        where: { clinicId: clinic.id },
        select: { email: true, name: true },
        take: 1,
      });

      const products = await prisma.product.findMany({
        where: { clinicId: clinic.id },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });

      if (products.length === 0) {
        results.push({ clinic: clinic.name, status: "skipped", reason: "no products" });
        continue;
      }

      const stream = await renderToStream(
        React.createElement(AnnualInventoryPDF, {
          products: products.map((p: any) => ({
            name: p.name,
            category: p.category,
            stockQuantity: p.stockQuantity,
            price: p.price.toString(),
            vatRate: p.vatRate,
            expiryDate: p.expiryDate?.toISOString() ?? null,
            barcode: p.barcode,
          })),
          clinicName: clinic.name || "Clínica",
          year,
        })
      );

      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const pdfBuffer = Buffer.concat(chunks);

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const targetEmail = clinic.email || users[0]?.email;
      if (targetEmail) {
        await transporter.sendMail({
          from: `"${clinic.name ?? "VetConnect"}" <${process.env.SMTP_FROM || "noreply@vetconnect.pt"}>`,
          to: targetEmail,
          subject: `📊 Inventário Anual ${year} — ${clinic.name ?? ""}`,
          text: `Relatório anual de inventário gerado automaticamente.\n\nTotal: ${products.length} artigos\nValor: €${products.reduce((s: number, p: any) => s + Number(p.price) * p.stockQuantity, 0).toFixed(2)}\n\nVetConnect SaaS`,
          attachments: [{ filename: `inventario-anual-${year}.pdf`, content: pdfBuffer }],
        });
        results.push({ clinic: clinic.name, status: "sent", sentTo: targetEmail });
      } else {
        results.push({ clinic: clinic.name, status: "skipped", reason: "no recipient email" });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error("[CRON_INVENTORY]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Crash" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleAnnualInventoryCron(req);
}

export async function POST(req: Request) {
  return handleAnnualInventoryCron(req);
}
