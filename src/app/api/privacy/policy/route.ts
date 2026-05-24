import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const DEFAULT_POLICY = `POLÍTICA DE PRIVACIDADE

A presente Política de Privacidade descreve como a Clínica Veterinária [Nome da Clínica] recolhe, trata e protege os dados pessoais dos seus clientes e dos seus animais de companhia, em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).

1. Responsável pelo Tratamento
Clínica Veterinária [Nome da Clínica]
Contacto: [email da clínica]

2. Dados Recolhidos
- Identificação: nome, morada, telefone, email, NIF
- Dados do animal: nome, espécie, raça, data de nascimento, histórico clínico
- Comunicações: mensagens trocadas através do portal

3. Finalidades do Tratamento
- Prestação de serviços veterinários (interesse legítimo)
- Faturação e gestão administrativa (obrigação legal)
- Comunicações relacionadas com a prestação de cuidados de saúde do animal
- Lembretes de consultas e vacinas (interesse legítimo)
- Marketing (apenas com consentimento explícito)

4. Base Legal
- Execução de contrato: prestação de serviços veterinários
- Interesse legítimo: lembretes de vacinas, gestão da relação com o cliente
- Obrigação legal: faturação, obrigações fiscais
- Consentimento: marketing, newsletters

5. Partilha de Dados
Os seus dados não serão partilhados com terceiros, exceto quando necessário para cumprir obrigações legais.

6. Prazo de Conservação
Os dados são conservados pelo período de 20 anos após o último ato clínico, conforme legislação aplicável.

7. Direitos do Titular
- Acesso, retificação e apagamento dos dados
- Limitação e oposição ao tratamento
- Portabilidade dos dados
- Retirar consentimento a qualquer momento
- Apresentar reclamação à CNPD

8. Segurança
Implementamos medidas técnicas e organizativas adequadas para proteger os seus dados contra acesso não autorizado, perda ou destruição.

Versão: v1 - Maio 2026`;

export async function GET() {
  return NextResponse.json({
    version: "v1",
    text: DEFAULT_POLICY,
    updatedAt: "2026-05-01",
  });
}
