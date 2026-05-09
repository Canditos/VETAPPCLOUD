"use client";

import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { format } from "date-fns";

// Register fonts if needed (optional)

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    borderBottom: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 20,
  },
  clinicInfo: {
    flexDirection: "column",
  },
  clinicName: {
    fontSize: 18,
    fontWeight: "black",
    color: "#0f172a",
    marginBottom: 4,
  },
  clinicDetails: {
    fontSize: 8,
    color: "#64748b",
    lineHeight: 1.4,
  },
  prescriptionTitle: {
    fontSize: 24,
    fontWeight: "black",
    textAlign: "right",
    color: "#2563eb",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 10,
    letterSpacing: 1,
  },
  patientBox: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  patientInfo: {
    flexDirection: "column",
  },
  patientLabel: {
    fontSize: 7,
    color: "#94a3b8",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  patientValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e293b",
  },
  itemsTable: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: 2,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
    marginBottom: 10,
  },
  colMedicine: { width: "40%" },
  colDosage: { width: "20%" },
  colFreq: { width: "20%" },
  colDuration: { width: "20%" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottom: 1,
    borderBottomColor: "#f1f5f9",
  },
  medicineName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
  },
  dosageText: {
    fontSize: 9,
    color: "#475569",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: 200,
    borderTop: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 8,
    textAlign: "center",
  },
  signatureLabel: {
    fontSize: 8,
    color: "#64748b",
  }
});

interface PrescriptionPDFProps {
  prescription: any;
  clinic: any;
}

export const PrescriptionPDF = ({ prescription, clinic }: PrescriptionPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.clinicInfo}>
          <Text style={styles.clinicName}>{clinic?.name || "VetConnect Clinic"}</Text>
          <Text style={styles.clinicDetails}>NIF: {clinic?.nif || "--- --- ---"}</Text>
          <Text style={styles.clinicDetails}>{clinic?.address || "Endereço não configurado"}</Text>
          <Text style={styles.clinicDetails}>Tel: {clinic?.phone || "---"}</Text>
        </View>
        <View>
          <Text style={styles.prescriptionTitle}>RECEITA MÉDICA</Text>
          <Text style={{ textAlign: "right", fontSize: 8, color: "#94a3b8", marginTop: 5 }}>
            Nº {prescription.id.slice(-8).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Patient & Date */}
      <View style={styles.section}>
        <View style={styles.patientBox}>
          <View style={styles.patientInfo}>
            <Text style={styles.patientLabel}>Paciente</Text>
            <Text style={styles.patientValue}>{prescription.patient?.name}</Text>
            <Text style={{ fontSize: 8, color: "#64748b" }}>{prescription.patient?.species}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientLabel}>Tutor</Text>
            <Text style={styles.patientValue}>{prescription.patient?.owner?.name || "Proprietário"}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientLabel}>Data de Emissão</Text>
            <Text style={styles.patientValue}>{format(new Date(prescription.createdAt), "dd/MM/yyyy")}</Text>
          </View>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.itemsTable}>
        <View style={styles.tableHeader}>
          <Text style={[styles.sectionTitle, styles.colMedicine]}>Medicamento</Text>
          <Text style={[styles.sectionTitle, styles.colDosage]}>Dose</Text>
          <Text style={[styles.sectionTitle, styles.colFreq]}>Freq.</Text>
          <Text style={[styles.sectionTitle, styles.colDuration]}>Duração</Text>
        </View>

        {prescription.items?.map((item: any, idx: number) => (
          <View key={idx} style={styles.tableRow}>
            <View style={styles.colMedicine}>
              <Text style={styles.medicineName}>{item.medicineName}</Text>
              {item.notes && <Text style={{ fontSize: 7, color: "#94a3b8", marginTop: 2 }}>{item.notes}</Text>}
            </View>
            <Text style={[styles.dosageText, styles.colDosage]}>{item.dosage}</Text>
            <Text style={[styles.dosageText, styles.colFreq]}>{item.frequency}</Text>
            <Text style={[styles.dosageText, styles.colDuration]}>{item.duration}</Text>
          </View>
        ))}
      </View>

      {/* Valid Until */}
      {prescription.validUntil && (
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 8, color: "#ef4444", fontWeight: "bold" }}>
            VÁLIDO ATÉ: {format(new Date(prescription.validUntil), "dd/MM/yyyy")}
          </Text>
        </View>
      )}

      {/* Footer / Signature */}
      <View style={styles.footer}>
        <View style={{ width: "60%" }}>
          <Text style={{ fontSize: 7, color: "#94a3b8", lineHeight: 1.5 }}>
            Esta receita foi gerada eletronicamente pelo sistema VetConnect.{"\n"}
            O médico veterinário assume total responsabilidade pela prescrição acima descrita.
          </Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 2 }}>
            Dr. {prescription.veterinarian?.name}
          </Text>
          <Text style={styles.signatureLabel}>Cédula Profissional nº _______</Text>
          <Text style={styles.signatureLabel}>Médico Veterinário</Text>
        </View>
      </View>
    </Page>
  </Document>
);
