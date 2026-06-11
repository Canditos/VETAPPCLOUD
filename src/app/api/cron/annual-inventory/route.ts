export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import nodemailer from "nodemailer";
import { AnnualInventoryPDF } from "@/components/reports/AnnualInventoryPDF";

// Cron endpoint: auto-sends inventory report on Dec 31
export const POST = withAuth(async ({ tenantPrisma, clinicId }) => {
  try {
    const now = new Date();
    const isLastDay = now.getMonth() === 11 && now.getDate() === 31;
    if (!isLastDay) {
      return NextResponse.json({ message: "Not Dec 31 — skipped" });
    }

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true, email: true } });
    const users = await prisma.user.findMany({ where: { clinicId }, select: { email: true, name: true }, take: 1 });
    const products = await tenantPrisma.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const year = now.getFullYear();
    const stream = await renderToStream(
      React.createElement(AnnualInventoryPDF, {
        products: products.map((p: any) => ({
          name: p.name, category: p.category, stockQuantity: p.stockQuantity,
          price: p.price.toString(), vatRate: p.vatRate,
          expiryDate: p.expiryDate?.toISOString() ?? null,
          barcode: p.barcode,
        })),
        clinicName: clinic?.name ?? "Clínica",
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

    const targetEmail = clinic?.email || users[0]?.email;
    if (targetEmail) {
      await transporter.sendMail({
        from: `"${clinic?.name ?? "VetConnect"}" <${process.env.SMTP_FROM || "noreply@vetconnect.pt"}>`,
        to: targetEmail,
        subject: `📊 Inventário Anual ${year} — ${clinic?.name ?? ""}`,
        text: `Relatório anual de inventário gerado automaticamente.\n\nTotal: ${products.length} artigos\nValor: €${products.reduce((s: number, p: any) => s + Number(p.price) * p.stockQuantity, 0).toFixed(2)}\n\nVetConnect SaaS`,
        attachments: [{ filename: `inventario-anual-${year}.pdf`, content: pdfBuffer }],
      });
    }

    return NextResponse.json({ success: true, sentTo: targetEmail });
  } catch (error) {
    console.error("[CRON_INVENTORY]", error);
    return NextResponse.json({ error: "Crash" }, { status: 500 });
  }
});
