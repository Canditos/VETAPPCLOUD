import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async ({ req }) => {
  const { searchParams } = new URL(req.url);
  const microchip = searchParams.get("chip");

  if (!microchip) {
    return NextResponse.json({ error: "Microchip is required" }, { status: 400 });
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[SIAC] Verificando microchip: ${microchip}`);
  }

  try {
    // 1. Em produção, usaríamos um scraper real ou API oficial.
    // 2. Para esta demo "automática", vamos simular a resposta do SIAC.
    // Nota: O SIAC real tem CSRF e proteção, por isso um fetch direto do servidor 
    // pode ser bloqueado sem os headers corretos.
    
    await new Promise(resolve => setTimeout(resolve, 2500)); // Simula o tempo de rede do SIAC

    // Lógica de validação simulada: 
    // Se o microchip tiver 15 dígitos (padrão ISO), damos como válido 90% das vezes
    const isValidFormat = /^\d{15}$/.test(microchip);
    
    if (isValidFormat) {
      // Simulamos que encontramos o animal
      return NextResponse.json({
        success: true,
        found: true,
        data: {
          microchip,
          status: "REGISTADO",
          dataRegisto: "12/03/2022",
          entidade: "Hospital Veterinário Gato Escondido",
          especie: "Canídeo",
          raca: "Pastor Alemão"
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        found: false,
        message: "Microchip não encontrado na base de dados SIAC."
      });
    }

  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[SIAC ERROR]", error);
    }
    return NextResponse.json({ error: "Falha na comunicação com o SIAC" }, { status: 500 });
  }
});
