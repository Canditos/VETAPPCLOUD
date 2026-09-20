"use client";

import { PageHeader } from "@/components/PageHeader";
import { DewormingGuide } from "@/components/clinical/DewormingGuide";

export default function DesparasitacaoPage() {
  return (
    <div className="space-y-8 w-full p-4 md:p-8">
      <PageHeader
        badge="Apoio à decisão"
        title="Guia de Desparasitação"
        description="Consulta rápida das opções de desparasitação para um animal, com base na espécie e no peso. Mostra via, dose, intervalo, preço/mês e stock da clínica."
      />
      <DewormingGuide />
    </div>
  );
}
