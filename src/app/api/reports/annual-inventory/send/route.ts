export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import nodemailer from "nodemailer";
import { AnnualInventoryPDF } from "@/components/reports/AnnualInventoryPDF";

export const POST = withAuth(async ({ req, tenantPrisma, clinicId }) => {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true, email: true } });
    const user = await prisma.user.findFirst({ where: { clinicId }, select: { name: true } });
    const products = await tenantPrisma.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const year = new Date().getFullYear();
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
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${clinic?.name ?? "VetConnect"}" <${process.env.SMTP_FROM || "noreply@vetconnect.pt"}>`,
      to: email,
      subject: `Inventário Anual ${year} — ${clinic?.name ?? ""}`,
      text: `Olá ${user?.name ?? "Equipa"},\n\nSegue em anexo o inventário anual de ${year}.\n\nEste documento foi gerado automaticamente pelo VetConnect SaaS.\n\nTotal de artigos: ${products.length}\nValor total: €${products.reduce((s: number, p: any) => s + Number(p.price) * p.stockQuantity, 0).toFixed(2)}`,
      attachments: [{ filename: `inventario-anual-${year}.pdf`, content: pdfBuffer }],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ANNUAL_INVENTORY_SEND]", error);
    return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
  }
});
