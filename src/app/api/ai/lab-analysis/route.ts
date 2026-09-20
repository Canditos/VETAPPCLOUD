export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

interface LabParam {
  name: string;
  value: number;
  unit: string;
  refMin?: number;
  refMax?: number;
  isAbnormal?: boolean;
}

export const POST = withAuth(async ({ tenantPrisma, clinicId, req }) => {
  try {
    const body = await req.json();
    const { patientId, labResults: directResults } = body;

    if (!patientId) {
      return NextResponse.json({ error: "patientId é obrigatório" }, { status: 400 });
    }

    // 1. Obter paciente
    const patient = await tenantPrisma.patient.findFirst({
      where: { id: patientId, clinicId },
      select: {
        id: true,
        name: true,
        species: true,
        gender: true,
        breed: true,
        birthDate: true,
        weight: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    // 2. Obter análises do paciente se não passadas no corpo
    let labResults = directResults;
    if (!labResults || !Array.isArray(labResults) || labResults.length === 0) {
      labResults = await tenantPrisma.labResult.findMany({
        where: { patientId, clinicId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    }

    if (!labResults || labResults.length === 0) {
      return NextResponse.json({
        severity: "NORMAL",
        summary: "Ainda não existem análises laboratoriais registadas para este animal. Assim que importar exames HL7 ou registar parâmetros, a IA fornecerá a interpretação automática.",
        abnormalParameters: [],
        differentialDiagnoses: ["Sem dados analíticos para avaliação"],
        recommendations: ["Requisitar Hemograma ou Bioquímica de rotina conforme o quadro clínico."],
        suggestedFollowUp: "Agendar colheita se houver suspeita clínica.",
        analyzedExamsCount: 0,
        analyzedAt: new Date().toISOString(),
      });
    }

    // 3. Extrair e consolidar parâmetros mais recentes
    const paramMap = new Map<string, {
      name: string;
      value: number;
      unit: string;
      refMin?: number;
      refMax?: number;
      isAbnormal?: boolean;
      status: "HIGH" | "LOW" | "NORMAL";
      examDate: string;
      source: string;
    }>();

    labResults.forEach((res: any) => {
      const pList: LabParam[] = res.dataJson?.parameters || [];
      pList.forEach((p) => {
        if (!paramMap.has(p.name)) {
          let status: "HIGH" | "LOW" | "NORMAL" = "NORMAL";
          if (p.refMax !== undefined && p.value > p.refMax) status = "HIGH";
          else if (p.refMin !== undefined && p.value < p.refMin) status = "LOW";
          else if (p.isAbnormal) status = "HIGH";

          paramMap.set(p.name, {
            name: p.name,
            value: p.value,
            unit: p.unit || "",
            refMin: p.refMin,
            refMax: p.refMax,
            isAbnormal: status !== "NORMAL" || !!p.isAbnormal,
            status,
            examDate: res.createdAt ? new Date(res.createdAt).toISOString() : new Date().toISOString(),
            source: res.source || "Laboratório",
          });
        }
      });
    });

    const allParams = Array.from(paramMap.values());
    const abnormalList = allParams.filter((p) => p.isAbnormal);

    // Calcular idade do animal
    const now = new Date();
    let ageStr = "Idade não informada";
    if (patient.birthDate) {
      const years = Math.floor((now.getTime() - new Date(patient.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      const months = Math.floor(((now.getTime() - new Date(patient.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4)) % 12);
      ageStr = `${years} anos e ${months} meses`;
    }

    const speciesPt = patient.species?.toLowerCase().includes("gato") || patient.species?.toLowerCase().includes("fel") ? "Felino (Gato)" : "Canino (Cão)";
    const genderPt = patient.gender === "M" || patient.gender?.toLowerCase().includes("m") ? "Macho" : "Fêmea";

    // 4. Configuração de IA
    const automationSettings = await tenantPrisma.automationSettings.findUnique({
      where: { clinicId },
    });

    const apiKey = automationSettings?.aiApiKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = automationSettings?.aiBaseUrl || (process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY ? "https://api.openai.com/v1/chat/completions" : "https://api.groq.com/openai/v1/chat/completions");
    const model = automationSettings?.aiModel || (process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY ? "gpt-4o-mini" : "llama-3.1-8b-instant");

    // Se temos chave de IA configurada, invocar LLM
    if (apiKey) {
      try {
        const promptLines = allParams.map((p) => {
          const refStr = p.refMin !== undefined && p.refMax !== undefined ? `[Ref: ${p.refMin} - ${p.refMax} ${p.unit}]` : `[${p.unit}]`;
          const flag = p.status === "HIGH" ? "↑ ELEVADO" : p.status === "LOW" ? "↓ DIMINUÍDO" : "NORMAL";
          return `- ${p.name}: ${p.value} ${p.unit} ${refStr} -> ${flag}`;
        }).join("\n");

        const prompt = `Analise os seguintes resultados analíticos de um paciente veterinário:
ESPÉCIE: ${speciesPt}
SEXO: ${genderPt}
RAÇA: ${patient.breed || "Comum"}
IDADE: ${ageStr}
PESO: ${patient.weight ? `${patient.weight} kg` : "Não registado"}

PARÂMETROS ANALISADOS:
${promptLines}

Responda OBRIGATORIAMENTE em JSON válido com a seguinte estrutura:
{
  "severity": "NORMAL" | "ATTENTION" | "ALERT" | "CRITICAL",
  "summary": "Resumo clínico detalhado de 2 a 3 parágrafos sobre o estado analítico geral do animal, comentando série eritróide, leucocitária, plaquetária e/ou função orgânica.",
  "abnormalParameters": [
    {
      "name": "Nome",
      "value": 0,
      "unit": "unidade",
      "ref": "min - max",
      "status": "HIGH" | "LOW",
      "clinicalMeaning": "Explicação fisiopatológica concisa e direta para a espécie."
    }
  ],
  "differentialDiagnoses": [
    "Diagnóstico diferencial ou suspeita 1",
    "Diagnóstico diferencial ou suspeita 2"
  ],
  "recommendations": [
    "Recomendação prática 1 (exame complementar, fármaco ou monitorização)",
    "Recomendação prática 2"
  ],
  "suggestedFollowUp": "Indicação temporal de repetição do painel analítico."
}`;

        const aiResponse = await fetch(baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: "É um médico veterinário especialista em Patologia Clínica e Diagnóstico Laboratorial. Forneça uma análise clínica precisa, em português de Portugal. Responda APENAS em JSON estrito sem markdown ao redor.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 1000,
          }),
        });

        if (aiResponse.ok) {
          const aiJson = await aiResponse.json();
          let rawContent = aiJson.choices?.[0]?.message?.content || "";
          rawContent = rawContent.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
          
          try {
            const parsed = JSON.parse(rawContent);
            return NextResponse.json({
              ...parsed,
              source: "LLM",
              model,
              analyzedExamsCount: labResults.length,
              totalParametersCount: allParams.length,
              analyzedAt: new Date().toISOString(),
            });
          } catch (parseErr) {
            console.warn("[AI_LAB_PARSE_FALLBACK] Could not parse AI JSON output, using rule-based fallback");
          }
        }
      } catch (llmErr) {
        console.error("[AI_LAB_LLM_ERROR]", llmErr);
      }
    }

    // 5. Fallback Algorítmico Clínico Especializado (Garante resposta 100% fiável mesmo sem API ou offline)
    const hasAbnormals = abnormalList.length > 0;
    let severity: "NORMAL" | "ATTENTION" | "ALERT" | "CRITICAL" = "NORMAL";
    
    if (abnormalList.length >= 4) severity = "CRITICAL";
    else if (abnormalList.length >= 2) severity = "ALERT";
    else if (abnormalList.length === 1) severity = "ATTENTION";

    const formattedAbnormals = abnormalList.map((p) => {
      let meaning = "";
      const lower = p.name.toLowerCase();

      if (lower.includes("eritróc") || lower.includes("rbc") || lower.includes("hct") || lower.includes("hematóc") || lower.includes("hgb")) {
        meaning = p.status === "LOW"
          ? "Sinal de anemia (avaliar regeneração, reticulócitos e despiste de hemoparasitas ou perdas ocultas)."
          : "Sinal de hemoconcentração (desidratação) ou policitemia relativa.";
      } else if (lower.includes("leucóc") || lower.includes("wbc") || lower.includes("neutr")) {
        meaning = p.status === "HIGH"
          ? "Leucocitose indicativa de resposta inflamatória, infeciosa ou stress sistémico."
          : "Leucopenia sugestiva de consumo agudo, supressão medular ou infeção viral grave.";
      } else if (lower.includes("plaq") || lower.includes("plt")) {
        meaning = p.status === "LOW"
          ? "Trombocitopenia — risco de diátese hemorrágica. Reavaliar em esfregaço (despiste de agregados) e pesquisar vetores (ex: Ehrlichia/Leishmania)."
          : "Trombocitose reativa associada a inflamação sistémica ou resposta medular.";
      } else if (lower.includes("ureia") || lower.includes("creatin") || lower.includes("bun") || lower.includes("sdma")) {
        meaning = p.status === "HIGH"
          ? "Azotemia presente — avaliar densidade urinária para distinguir origem pré-renal (desidratação) de lesão renal intrínseca."
          : "Valores diminuídos sem significado patológico maior (massa muscular reduzida ou hiperhidratação).";
      } else if (lower.includes("alt") || lower.includes("gpt") || lower.includes("alp") || lower.includes("fa") || lower.includes("bilirr")) {
        meaning = p.status === "HIGH"
          ? "Alteração enzimática hepatobiliar sugestiva de lesão celular hepática ou colestase."
          : "Dentro do padrão fisiológico.";
      } else if (lower.includes("glic")) {
        meaning = p.status === "HIGH"
          ? "Hiperglicemia — ponderar stress agudo (frequente em felinos) vs Diabetes Mellitus (confirmar com frutosamina)."
          : "Hipoglicemia — risco neurológico imediato; investigar sépsis, insulinoma ou jejum prolongado.";
      } else {
        meaning = p.status === "HIGH" ? "Valor acima dos limites de referência estabelecidos." : "Valor abaixo dos limites de referência estabelecidos.";
      }

      const refStr = p.refMin !== undefined && p.refMax !== undefined ? `${p.refMin} - ${p.refMax}` : "—";

      return {
        name: p.name,
        value: p.value,
        unit: p.unit,
        ref: refStr,
        status: p.status,
        clinicalMeaning: meaning,
      };
    });

    const diffs: string[] = [];
    const recs: string[] = [];

    if (abnormalList.some(p => p.name.toLowerCase().includes("rbc") && p.status === "LOW" || p.name.toLowerCase().includes("hct") && p.status === "LOW")) {
      diffs.push("Síndrome anémica a esclarecer (Anemia hemolítica vs hemorragia oculta vs doença inflamatória crónica)");
      recs.push("Contagem de Reticulócitos e esfregaço sanguíneo para avaliar índice de regeneração eritróide.");
    }
    if (abnormalList.some(p => p.name.toLowerCase().includes("wbc") && p.status === "HIGH" || p.name.toLowerCase().includes("neutr") && p.status === "HIGH")) {
      diffs.push("Leucocitose com desvio sugestiva de foco infecioso bacteriano ou inflamação tecidual ativa");
      recs.push("Exame físico minucioso à procura de focos infeciosos (boca, trato urinário, pele, pulmões).");
    }
    if (abnormalList.some(p => p.name.toLowerCase().includes("creatin") && p.status === "HIGH" || p.name.toLowerCase().includes("ureia") && p.status === "HIGH")) {
      diffs.push("Disfunção Renal / Azotemia (Estadiamento IRIS a confirmar)");
      recs.push("Urina Tipo II com medição de Densidade Urinária (DU) e rácio UPC (Proteína/Creatinina Urinária).");
      recs.push("Ecografia abdominal renal e medição de Pressão Arterial Sistólica por Doppler.");
    }
    if (abnormalList.some(p => p.name.toLowerCase().includes("plt") && p.status === "LOW")) {
      diffs.push("Trombocitopenia (Trombocitopenia Imunomediada vs Infeções transmitidas por vetores)");
      recs.push("Pesquisa de hemoparasitas / serologias para agentes transmitidos por carraças e flebótomos.");
    }

    if (diffs.length === 0) {
      if (hasAbnormals) {
        diffs.push("Desvios analíticos isolados sem padrão sindrómico óbvio.");
        recs.push("Monitorização clínica dos parâmetros alterados e repetição analítica em 2-4 semanas.");
      } else {
        diffs.push("Perfil analítico normal — Homeostase sistémica preservada.");
        recs.push("Manter plano profilático habitual (vacinação, desparasitação periódica e nutrição equilibrada).");
      }
    }

    let summary = "";
    if (!hasAbnormals) {
      summary = `A avaliação dos ${allParams.length} parâmetros analíticos do paciente (${speciesPt}, ${patient.breed || "Comum"}, ${ageStr}) revela estabilidade clínica, com todos os marcadores dentro dos intervalos de referência fisiológicos da espécie. Não se observam evidências laboratoriais de anemia, processo infecioso/leucocitário ativo nem disfunção renal ou hepática evidente.`;
    } else {
      summary = `A análise laboratorial do paciente (${speciesPt}, ${patient.breed || "Comum"}, ${ageStr}) identificou ${abnormalList.length} parâmetro(s) com desvios em relação aos valores de referência normais. Recomenda-se correlação com o quadro clínico atual, sinais vitais e historial recente do animal para confirmação diagnóstica.`;
    }

    return NextResponse.json({
      severity,
      summary,
      abnormalParameters: formattedAbnormals,
      differentialDiagnoses: diffs,
      recommendations: recs,
      suggestedFollowUp: hasAbnormals ? "Repetição analítica aconselhada em 2 a 4 semanas para avaliar evolução." : "Controlo anual de rotina.",
      source: "RULE_ENGINE",
      analyzedExamsCount: labResults.length,
      totalParametersCount: allParams.length,
      analyzedAt: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error("[API_LAB_ANALYSIS_ERROR]", err);
    return NextResponse.json({ error: err.message || "Erro ao processar análise com IA" }, { status: 500 });
  }
});
