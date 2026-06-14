import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

export const POST = withAuth(async ({ req, clinicId }) => {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "O rascunho (prompt) é obrigatório." }, { status: 400 });
    }

    const settings = await prisma.automationSettings.findUnique({
      where: { clinicId }
    });

    if (!settings || !settings.aiApiKey) {
      return NextResponse.json({ error: "Chave de API (OpenAI/Opencode) não configurada nas Definições." }, { status: 400 });
    }

    const baseUrl = settings.aiBaseUrl || "https://api.openai.com/v1";
    const model = settings.aiModel || "gpt-4o-mini";

    const systemPrompt = `Você é um assistente especializado em redação de mensagens SMS e Email para uma clínica veterinária.
Seu objetivo é transformar um rascunho ou ideia do usuário em um template profissional, claro e amigável.
Você DEVE utilizar as seguintes variáveis onde fizer sentido:
{{nome}} - Nome do dono do animal
{{animal}} - Nome do animal
{{data}} - Data de uma consulta/vacina
{{hora}} - Hora de uma consulta/vacina

Escreva APENAS o corpo da mensagem. Seja conciso e adequado para SMS (máximo de 160 caracteres se possível, mas aceitável um pouco mais). Não inclua saudações genéricas se não fizer sentido. Tente fazer um tom simpático e profissional.`;

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.aiApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Escreve um template para: ${prompt}` }
        ],
        temperature: 0.7,
        max_tokens: 300,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API Error:", errText);
      return NextResponse.json({ error: "Falha ao comunicar com a API de Inteligência Artificial." }, { status: 500 });
    }

    const data = await response.json();
    const generatedMessage = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ result: generatedMessage.trim() });
  } catch (error) {
    console.error("Error generating AI template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
