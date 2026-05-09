import React from 'react';
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink, Image, Font } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 20,
  },
  clinicInfo: {
    flexDirection: 'column',
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 8,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 40,
  },
  col: {
    flex: 1,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#f8fafc',
  },
  description: { flex: 3 },
  qty: { flex: 1, textAlign: 'center' },
  price: { flex: 1, textAlign: 'right' },
  total: { flex: 1, textAlign: 'right', fontWeight: 'bold' },
  summary: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: 200,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    borderTop: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTop: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
  }
});

interface InvoicePDFProps {
  invoice: any;
  clinic: any;
  owner: any;
  patient?: any;
}

const MyDocument = ({ invoice, clinic, owner, patient }: InvoicePDFProps) => {
  const clinicData = clinic || {
    name: "Clínica Veterinária",
    address: "---",
    phone: "---",
    email: "---",
    vatNumber: "---"
  };

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.clinicInfo}>
          <Text style={styles.clinicName}>{clinicData.name}</Text>
          <Text>{clinicData.address}</Text>
          <Text>{clinicData.phone} | {clinicData.email}</Text>
          <Text>NIF: {clinicData.vatNumber}</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>FATURA</Text>
          <Text style={{ textAlign: 'right', marginTop: 4 }}>#{invoice.vendusId || invoice.jasminInvoiceId || 'PROVISÓRIA'}</Text>
          <Text style={{ textAlign: 'right', color: '#94a3b8' }}>{new Date().toLocaleDateString('pt-PT')}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Faturar a:</Text>
          <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{owner?.name || 'Consumidor Final'}</Text>
          <Text>{owner?.address || 'Sem morada'}</Text>
          <Text>NIF: {owner?.vatNumber || '999999990'}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Paciente:</Text>
          <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{patient?.name || '---'}</Text>
          <Text>{patient?.species} | {patient?.breed}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.description}>Descrição</Text>
          <Text style={styles.qty}>Qtd</Text>
          <Text style={styles.price}>Preço Unit.</Text>
          <Text style={styles.total}>Total</Text>
        </View>
        {invoice.items?.map((item: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.qty}>{item.quantity}</Text>
            <Text style={styles.price}>€{Number(item.price).toFixed(2)}</Text>
            <Text style={styles.total}>€{(item.quantity * Number(item.price)).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>€{Number(invoice.total).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>IVA (Incluído)</Text>
            <Text>€{(Number(invoice.total) * 0.23).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotal]}>
            <Text>TOTAL</Text>
            <Text>€{Number(invoice.total).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Processado por VetConnect SaaS. Este documento não serve de fatura legal perante a Autoridade Tributária 
        se não contiver o selo de certificação do software de faturação integrado (Vendus).
      </Text>
    </Page>
  </Document>
  );
};

export const InvoiceDownloadBtn = ({ invoice, clinic, owner, patient }: InvoicePDFProps) => {
  return (
    <PDFDownloadLink 
      document={<MyDocument invoice={invoice} clinic={clinic} owner={owner} patient={patient} />} 
      fileName={`fatura_${invoice.jasminInvoiceId || 'temp'}.pdf`}
      style={{
        textDecoration: 'none',
        color: '#2563eb',
        fontWeight: 'bold',
        fontSize: '12px'
      }}
    >
      {({ loading }) => (loading ? 'A gerar...' : 'Descarregar PDF')}
    </PDFDownloadLink>
  );
};
