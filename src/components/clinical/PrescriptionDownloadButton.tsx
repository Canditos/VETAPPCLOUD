"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { PrescriptionPDF } from "./PrescriptionPDF";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";

interface PrescriptionDownloadButtonProps {
  prescription: any;
  clinic: any;
}

export function PrescriptionDownloadButton({ prescription, clinic }: PrescriptionDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={<PrescriptionPDF prescription={prescription} clinic={clinic} />}
      fileName={`Prescricao_${prescription.id.slice(-8)}.pdf`}
    >
      {({ loading }) => (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 rounded-lg hover:bg-white/10 text-white"
          disabled={loading}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
