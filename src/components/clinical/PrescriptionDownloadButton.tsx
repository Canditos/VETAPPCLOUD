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
      className="flex-1"
    >
      {({ loading }) => (
        <Button 
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              A Gerar...
            </>
          ) : (
            <>
              <Printer size={16} strokeWidth={3} />
              Imprimir PDF
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
