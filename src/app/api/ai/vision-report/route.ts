import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

export const POST = withAuth(async ({ req, clinicId }) => {
  try {
    const body = await req.json();
    const { imageBase64, patientContext, prompt } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "Imagem não fornecida" }, { status: 400 });
    }

    // Load AI settings from the database
    const settings = await prisma.automationSettings.findUnique({
      where: { clinicId }
    });

    if (!settings || !settings.aiApiKey) {
      return NextResponse.json({ error: "Configuração de IA ou Chave de API em falta" }, { status: 400 });
    }

    // Use aiVisionModel if defined, fallback to aiModel, then to qwen3.7-max
    const model = settings.aiVisionModel || settings.aiModel || "qwen3.7-max";
    const baseUrl = settings.aiBaseUrl || "https://opencode.ai/zen/go/v1";

    // Build the default prompt if not provided
    const systemPrompt = "És um radiologista veterinário altamente experiente. Analisa cuidadosamente a imagem clínica/Raio-X anexa. Descreve anomalias, lesões ou alterações estruturais com precisão técnica e sugere possíveis diagnósticos diferenciais fundamentados.";
    
    const userMessage = prompt || `Histórico Clínico do Paciente:\n${patientContext || 'Não fornecido'}\n\nPor favor, analisa a imagem enviada com base neste contexto e gera um pré-relatório detalhado.`;

    // Make the API request using OpenAI's compatible vision payload
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.aiApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userMessage
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64 // Should be in format "data:image/jpeg;base64,...."
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("AI API Error:", errBody);
      return NextResponse.json({ error: "Falha ao contactar o fornecedor de IA", details: errBody }, { status: response.status });
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "Não foi possível gerar um relatório.";

    return NextResponse.json({ success: true, report });

  } catch (error) {
    console.error("Error generating vision report:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
});
