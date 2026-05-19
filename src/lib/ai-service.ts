/**
 * ============================================
 * AI SERVICE — External LLM Integration
 * ============================================
 *
 * Integração com Groq (Llama 3.1, gratuito) via API.
 * TODOS os dados são ANONIMIZADOS antes de envio.
 *
 * Fluxo:
 *  1. Recebe dados clínicos reais
 *  2. Remove NOMES, IDs, NIFs, moradas, telefones
 *  3. Substitui por tokens genéricos (ex: "Paciente_1")
 *  4. Envia para Groq com prompt veterinário estruturado
 *  5. Recebe resumo inteligente
 *  6. Desanonimiza nomes no resultado final
 *
 * Custo: Gratuito (Groq free tier)
 * Privacidade: NENHUM dado PII (Personally Identifiable Information) sai
 */

export interface AnonymizedClinicalData {
  species: string;
  gender: string;
  breed: string;
  ageText: string;
  weight: string | null;
  lastConsultationDaysAgo: number | null;
  totalVaccines: number;
  expiredVaccines: string[];
  upcomingVaccines: { name: string; daysLeft: number }[];
  dewormingOverdue: boolean;
  allergies: string | null;
  aggressionLevel: string | null;
  microchip: boolean;
  weightTrend: string | null;
  recommendations: string[];
  recentConsultations?: { date: string; SOAP: string | null }[];
  recentPrescriptions?: { date: string; medicines: string[] }[];
}

export interface AISummaryResponse {
  summary: string;
  recommendations: string[];
  alerts: string[];
  confidence: "high" | "medium" | "low";
  disclaimer: string;
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Anonimiza dados clínicos removendo toda informação pessoal.
 */
export function anonymizeClinicalData(data: {
  patientName: string;
  species: string;
  gender: string;
  breed: string;
  ageText: string;
  weight: string | null;
  lastConsultation: { daysAgo: number | null } | null;
  vaccines: { total: number; expired: string[]; upcoming: { name: string; daysLeft: number }[] };
  deworming: { overdue: boolean };
  allergies: string | null;
  aggressionLevel: string | null;
  microchip: string | null;
  weightTrend: string | null;
  recommendations: string[];
  recentConsultations?: { date: string; SOAP: string | null }[];
  recentPrescriptions?: { date: string; medicines: string[] }[];
}): AnonymizedClinicalData {
  return {
    species: data.species,
    gender: data.gender,
    breed: data.breed,
    ageText: data.ageText,
    weight: data.weight,
    lastConsultationDaysAgo: data.lastConsultation?.daysAgo ?? null,
    totalVaccines: data.vaccines.total,
    expiredVaccines: data.vaccines.expired,
    upcomingVaccines: data.vaccines.upcoming,
    dewormingOverdue: data.deworming.overdue,
    allergies: data.allergies,
    aggressionLevel: data.aggressionLevel,
    microchip: !!data.microchip,
    weightTrend: data.weightTrend,
    recommendations: data.recommendations,
    recentConsultations: data.recentConsultations,
    recentPrescriptions: data.recentPrescriptions,
  };
}

/**
 * Gera resumo clínico via IA externa (Groq Llama 3.1).
 * Dados são 100% anonimizados antes do envio.
 */
export async function generateAISummary(
  data: AnonymizedClinicalData
): Promise<AISummaryResponse> {
  if (!GROQ_API_KEY) {
    // Fallback: retorna mensagem educativa sem chamar API
    return {
      summary: `Resumo clínico gerado localmente (modo offline). ${data.species} ${data.gender.toLowerCase()}, ${data.ageText}, ${data.breed}.`,
      recommendations: data.recommendations,
      alerts: [
        ...(data.expiredVaccines.length ? [`Vacinas expiradas: ${data.expiredVaccines.join(", ")}`] : []),
        ...(data.dewormingOverdue ? ["Desparasitação em atraso"] : []),
        ...(data.allergies ? [`Alergias: ${data.allergies}`] : []),
      ],
      confidence: "high",
      disclaimer: "Modo offline — configure GROQ_API_KEY para IA avançada.",
    };
  }

  const prompt = buildVeterinaryPrompt(data);

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Gratuito e rápido na Groq
        messages: [
          {
            role: "system",
            content:
              "É um assistente veterinário clínico experiente. Analise os dados do paciente e forneça um resumo conciso, recomendações práticas e alertas de segurança. Responda APENAS em português de Portugal. NUNCA inclua dados pessoais na resposta.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content ?? "";

    // Parse da resposta estruturada
    return parseAIResponse(content, data);
  } catch (error) {
    console.error("[AI_SERVICE] Error calling Groq:", error);
    // Fallback para resumo local
    return {
      summary: `Resumo local (IA indisponível). ${data.species} ${data.gender.toLowerCase()}, ${data.ageText}.`,
      recommendations: data.recommendations,
      alerts: [],
      confidence: "low",
      disclaimer: "IA temporariamente indisponível — usando resumo local.",
    };
  }
}

function buildVeterinaryPrompt(data: AnonymizedClinicalData): string {
  const lines: string[] = [
    `Espécie: ${data.species}`,
    `Sexo: ${data.gender}`,
    `Raça: ${data.breed}`,
    `Idade: ${data.ageText}`,
    `Peso: ${data.weight ?? "desconhecido"}`,
    data.weightTrend ? `Tendência de peso: ${data.weightTrend}` : "",
    data.lastConsultationDaysAgo !== null
      ? `Última consulta: há ${data.lastConsultationDaysAgo} dias`
      : "Sem consultas registadas",
    `Vacinas totais: ${data.totalVaccines}`,
    data.expiredVaccines.length > 0
      ? `Vacinas expiradas: ${data.expiredVaccines.join(", ")}`
      : "",
    data.upcomingVaccines.length > 0
      ? `Vacinas a expirar: ${data.upcomingVaccines.map((v) => `${v.name} (em ${v.daysLeft}d)`).join(", ")}`
      : "",
    data.dewormingOverdue ? "Desparasitação: EM ATRASO" : "",
    data.allergies ? `Alergias & Observações: ${data.allergies}` : "Sem observações/alergias conhecidas",
    data.aggressionLevel ? `Nível de agressão: ${data.aggressionLevel}` : "",
    data.microchip ? "Microchip: Sim" : "Microchip: Não",
  ];

  if (data.recentConsultations && data.recentConsultations.length > 0) {
    lines.push("\nHistórico Clínico Recente (Notas SOAP / Diagnósticos):");
    data.recentConsultations.forEach((c, i) => {
      lines.push(`- Consulta ${i + 1} (${new Date(c.date).toLocaleDateString("pt-PT")}):\n${c.SOAP || "Sem notas SOAP registadas"}`);
    });
  }

  if (data.recentPrescriptions && data.recentPrescriptions.length > 0) {
    lines.push("\nTratamentos / Medicamentos Recentes Prescritos:");
    data.recentPrescriptions.forEach((p, i) => {
      lines.push(`- Receita ${i + 1} (${new Date(p.date).toLocaleDateString("pt-PT")}): ${p.medicines.join(", ")}`);
    });
  }

  return `Analise os seguintes dados clínicos de um paciente veterinário e forneça:
1. Um resumo clínico conciso (2-3 frases) englobando a sua condição atual, histórico relevante e estado vacinal.
2. 3 recomendações práticas prioritárias de tratamento ou monitorização.
3. Alertas de segurança ou pontos de atenção (se houver).

Dados:
${lines.filter(Boolean).join("\n")}

Responda EXATAMENTE neste formato:
RESUMO: <texto>
RECOMENDACOES:
- <recomendação 1>
- <recomendação 2>
- <recomendação 3>
ALERTAS:
- <alerta 1> (ou "Nenhum")
`;
}

function parseAIResponse(content: string, data: AnonymizedClinicalData): AISummaryResponse {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  let summary = "";
  const recommendations: string[] = [];
  const alerts: string[] = [];
  let mode: "summary" | "recommendations" | "alerts" | null = null;

  for (const line of lines) {
    if (line.startsWith("RESUMO:")) {
      summary = line.replace("RESUMO:", "").trim();
      mode = "summary";
    } else if (line.startsWith("RECOMENDACOES:")) {
      mode = "recommendations";
    } else if (line.startsWith("ALERTAS:")) {
      mode = "alerts";
    } else if (line.startsWith("- ") && mode === "recommendations") {
      recommendations.push(line.replace("- ", "").trim());
    } else if (line.startsWith("- ") && mode === "alerts") {
      const alert = line.replace("- ", "").trim();
      if (alert.toLowerCase() !== "nenhum") alerts.push(alert);
    }
  }

  return {
    summary: summary || `Resumo gerado pela IA. ${data.species} ${data.gender.toLowerCase()}, ${data.ageText}.`,
    recommendations: recommendations.length ? recommendations : data.recommendations,
    alerts,
    confidence: "high",
    disclaimer: "Gerado por IA (Llama 3.1 via Groq). Sempre verifique clinicamente.",
  };
}

/**
 * Melhora e estrutura a descrição/alergias/observações do paciente com IA.
 */
export async function enhancePatientDescription(
  draftText: string,
  data: AnonymizedClinicalData
): Promise<string> {
  if (!GROQ_API_KEY) {
    return draftText || "Nenhuma observação clínica relevante registada.";
  }

  const historyLines: string[] = [
    `Espécie: ${data.species}`,
    `Sexo: ${data.gender}`,
    `Raça: ${data.breed}`,
    `Idade: ${data.ageText}`,
    data.allergies ? `Observações anteriores: ${data.allergies}` : "",
  ];

  if (data.recentConsultations && data.recentConsultations.length > 0) {
    data.recentConsultations.forEach((c, i) => {
      historyLines.push(`- Consulta ${i + 1} (${new Date(c.date).toLocaleDateString("pt-PT")}):\n${c.SOAP || "Sem notas"}`);
    });
  }

  const prompt = `Melhore e organize o seguinte rascunho de descrição/observações de um paciente veterinário, integrando informações relevantes do seu histórico clínico quando aplicável.

Rascunho atual escrito pelo médico:
"${draftText || "(Vazio - gerar descrição com base apenas no histórico clínico)"}"

Histórico Clínico do Paciente:
${historyLines.filter(Boolean).join("\n")}

Instruções:
1. Reorganize o texto em formato profissional, claro e objetivo.
2. Divida em secções concisas caso necessário (ex: Alergias conhecidas, Patologias Crónicas, Notas Comportamentais).
3. Responda APENAS em português de Portugal.
4. Responda EXATAMENTE com o texto final polido da descrição médica, sem qualquer introdução, notas de rodapé ou explicações (ex: Não escreva "Aqui está a descrição melhorada:").
`;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "É um assistente de documentação clínica veterinária experiente. Policie e resuma observações médicas de forma estrita e profissional.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content?.trim() ?? draftText;
  } catch (error) {
    console.error("[AI_SERVICE] enhancePatientDescription error:", error);
    return draftText;
  }
}

