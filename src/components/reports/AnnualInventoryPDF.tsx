import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register a nice font
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2", fontWeight: 700 },
  ],
});

const colors = {
  primary: "#1E40AF",
  secondary: "#3B82F6",
  accent: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  text: "#1E293B",
  muted: "#64748B",
  border: "#E2E8F0",
  bg: "#F8FAFC",
};

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Inter", fontSize: 9, color: colors.text },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30, paddingBottom: 20, borderBottom: `2 solid ${colors.primary}` },
  logo: { fontSize: 22, fontWeight: 700, color: colors.primary },
  logoSub: { fontSize: 8, color: colors.muted, marginTop: 2, letterSpacing: 2 },
  title: { fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 9, color: colors.muted, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: colors.primary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1, paddingBottom: 6, borderBottom: `1 solid ${colors.border}` },
  table: { width: "100%" },
  tableHeader: { flexDirection: "row", backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 4 },
  th: { fontSize: 7, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottom: `1 solid ${colors.border}`, alignItems: "center" },
  trEven: { backgroundColor: colors.bg },
  td: { fontSize: 8 },
  tdRight: { fontSize: 8, textAlign: "right" },
  colName: { width: "30%" },
  colCategory: { width: "15%" },
  colStock: { width: "10%", textAlign: "center" },
  colPrice: { width: "12%", textAlign: "right" },
  colVat: { width: "8%", textAlign: "center" },
  colTotal: { width: "15%", textAlign: "right" },
  colStatus: { width: "10%", textAlign: "center" },
  summaryBox: { flexDirection: "row", gap: 12, marginTop: 16 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: colors.bg, border: `1 solid ${colors.border}` },
  summaryValue: { fontSize: 16, fontWeight: 700, color: colors.primary, marginBottom: 2 },
  summaryLabel: { fontSize: 7, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTop: `1 solid ${colors.border}`, paddingTop: 12, fontSize: 7, color: colors.muted },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7, fontWeight: 700 },
  badgeOk: { backgroundColor: "#D1FAE5", color: "#065F46" },
  badgeLow: { backgroundColor: "#FEF3C7", color: "#92400E" },
  badgeExpired: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  pageNumber: { position: "absolute", bottom: 30, right: 40, fontSize: 7, color: colors.muted },
});

interface Product {
  name: string; category: string | null; stockQuantity: number;
  price: string; vatRate: number; expiryDate: string | null; barcode: string | null;
}

export function AnnualInventoryPDF({ products, clinicName, year }: { products: Product[]; clinicName: string; year: number }) {
  const now = new Date();
  const totalItems = products.length;
  const totalValue = products.reduce((s, p) => s + Number(p.price) * p.stockQuantity, 0);
  const totalStock = products.reduce((s, p) => s + p.stockQuantity, 0);
  const lowStock = products.filter(p => p.stockQuantity <= 5).length;
  const expired = products.filter(p => p.expiryDate && new Date(p.expiryDate) < now).length;

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const StatusBadge = ({ product }: { product: Product }) => {
    const isExpired = product.expiryDate && new Date(product.expiryDate) < now;
    const isLow = product.stockQuantity <= 5;
    if (isExpired) return <Text style={[styles.badge, styles.badgeExpired]}>Expirado</Text>;
    if (isLow) return <Text style={[styles.badge, styles.badgeLow]}>Crítico</Text>;
    return <Text style={[styles.badge, styles.badgeOk]}>OK</Text>;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>🐾 VetConnect</Text>
            <Text style={styles.logoSub}>CLINIC PRO</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.title}>Inventário Anual</Text>
            <Text style={styles.subtitle}>{year}</Text>
          </View>
        </View>

        {/* Clinic + Period */}
        <View style={styles.section}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{clinicName}</Text>
          <Text style={{ fontSize: 8, color: colors.muted }}>
            Relatório gerado em {now.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalItems}</Text>
            <Text style={styles.summaryLabel}>Total Artigos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalStock}</Text>
            <Text style={styles.summaryLabel}>Unidades em Stock</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>€{totalValue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.summaryLabel}>Valor Total</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: lowStock > 0 ? colors.warning : colors.accent }]}>{lowStock}</Text>
            <Text style={styles.summaryLabel}>Stock Crítico</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: expired > 0 ? colors.danger : colors.accent }]}>{expired}</Text>
            <Text style={styles.summaryLabel}>Expirados</Text>
          </View>
        </View>

        {/* By Category */}
        {categories.length > 0 && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Valor por Categoria</Text>
            {categories.map(cat => {
              const catProducts = products.filter(p => p.category === cat);
              const catValue = catProducts.reduce((s, p) => s + Number(p.price) * p.stockQuantity, 0);
              return (
                <View key={cat} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: `1 solid ${colors.border}` }}>
                  <Text style={{ fontSize: 8, fontWeight: 700 }}>{cat}</Text>
                  <Text style={{ fontSize: 8, color: colors.primary, fontWeight: 700 }}>€{catValue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Products Table */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Listagem Completa ({totalItems} artigos)</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colName]}>Designação</Text>
              <Text style={[styles.th, styles.colCategory]}>Categoria</Text>
              <Text style={[styles.th, styles.colStock]}>Stock</Text>
              <Text style={[styles.th, styles.colPrice]}>Preço</Text>
              <Text style={[styles.th, styles.colVat]}>IVA</Text>
              <Text style={[styles.th, styles.colTotal]}>Valor</Text>
              <Text style={[styles.th, styles.colStatus]}>Estado</Text>
            </View>
            {/* Rows */}
            {products.map((p, i) => (
              <View key={p.barcode || i} style={[styles.tr, i % 2 === 0 && styles.trEven]}>
                <Text style={[styles.td, styles.colName]}>{p.name}</Text>
                <Text style={[styles.td, styles.colCategory]}>{p.category || "—"}</Text>
                <Text style={[styles.td, styles.colStock]}>{p.stockQuantity}</Text>
                <Text style={[styles.td, styles.colPrice]}>€{Number(p.price).toFixed(2)}</Text>
                <Text style={[styles.td, styles.colVat]}>{p.vatRate}%</Text>
                <Text style={[styles.td, styles.colTotal]}>€{(Number(p.price) * p.stockQuantity).toFixed(2)}</Text>
                <View style={styles.colStatus}><StatusBadge product={p} /></View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          <Text>VetConnect SaaS — {clinicName}</Text>
          <Text> — Documento gerado automaticamente</Text>
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
