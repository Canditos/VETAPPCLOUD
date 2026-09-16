/**
 * ============================================
 * DEWORMING GUIDE — Cabula clínica
 * ============================================
 *
 * Catálogo de referência de antiparasitários usados em Portugal,
 * usado pela "cabula" de apoio à decisão (vet + receção).
 *
 * Fonte clínica: RCM/folhetos informativos (DGAV medvet, MSD, Elanco,
 * Zoetis, Boehringer). Os valores de dose/proteção são indicativos e
 * NÃO substituem a avaliação do médico veterinário nem o RCM do produto.
 *
 * `stockTokens` serve para fazer match com os produtos do inventário
 * da clínica (nome normalizado) e aí mostrar preço/stock reais.
 */

export type DewormerTarget = "INTERNAL" | "EXTERNAL" | "BOTH";
export type DewormerRoute = "Oral" | "Spot-on" | "Injectable";

export interface DewormerRef {
  key: string;
  name: string;
  activeIngredient: string;
  target: DewormerTarget;
  species: Array<"Cão" | "Gato">;
  weightMinKg: number;
  weightMaxKg: number;
  minAgeWeeks?: number;
  route: DewormerRoute;
  doseText: string;
  /** Duração de proteção, em meses (base do preço/mês). */
  protectionMonths: number;
  frequencyLabel: string;
  warnings?: string;
  stockTokens: string[];
}

export const DEWORMING_GUIDE: DewormerRef[] = [
  /* ─────────────────────────── INTERNOS ─────────────────────────── */
  {
    key: "milbemax-cao-pequeno-1-5",
    name: "Milbemax Cães Pequenos (2,5/25 mg)",
    activeIngredient: "Milbemicina oxima + Praziquantel",
    target: "INTERNAL",
    species: ["Cão"],
    weightMinKg: 1,
    weightMaxKg: 5,
    route: "Oral",
    doseText: "1 comprimido (dose única, com ou após alimento)",
    protectionMonths: 1,
    frequencyLabel: "Mensal (dirofilariose) / Trimestral (rotina)",
    warnings: "Não usar em gatos. Cadelas em lactação: tratar com as crias.",
    stockTokens: ["milbemax"],
  },
  {
    key: "milbemax-cao-pequeno-5-10",
    name: "Milbemax Cães Pequenos (2,5/25 mg)",
    activeIngredient: "Milbemicina oxima + Praziquantel",
    target: "INTERNAL",
    species: ["Cão"],
    weightMinKg: 5,
    weightMaxKg: 10,
    route: "Oral",
    doseText: "2 comprimidos (dose única, com ou após alimento)",
    protectionMonths: 1,
    frequencyLabel: "Mensal (dirofilariose) / Trimestral (rotina)",
    warnings: "Não usar em gatos.",
    stockTokens: ["milbemax"],
  },
  {
    key: "milbemax-cao-5-25",
    name: "Milbemax Cães (12,5/125 mg)",
    activeIngredient: "Milbemicina oxima + Praziquantel",
    target: "INTERNAL",
    species: ["Cão"],
    weightMinKg: 5,
    weightMaxKg: 25,
    route: "Oral",
    doseText: "1 comprimido (dose única, com ou após alimento)",
    protectionMonths: 1,
    frequencyLabel: "Mensal (dirofilariose) / Trimestral (rotina)",
    warnings: "Não usar em gatos.",
    stockTokens: ["milbemax"],
  },
  {
    key: "milbemax-cao-25-50",
    name: "Milbemax Cães (12,5/125 mg)",
    activeIngredient: "Milbemicina oxima + Praziquantel",
    target: "INTERNAL",
    species: ["Cão"],
    weightMinKg: 25,
    weightMaxKg: 50,
    route: "Oral",
    doseText: "2 comprimidos (dose única, com ou após alimento)",
    protectionMonths: 1,
    frequencyLabel: "Mensal (dirofilariose) / Trimestral (rotina)",
    warnings: "Não usar em gatos.",
    stockTokens: ["milbemax"],
  },
  {
    key: "milbemax-gato",
    name: "Milbemax Gatos (16/40 mg)",
    activeIngredient: "Milbemicina oxima + Praziquantel",
    target: "INTERNAL",
    species: ["Gato"],
    weightMinKg: 0.5,
    weightMaxKg: 8,
    route: "Oral",
    doseText: "0,5–2 kg: ½ comprimido · >2–8 kg: 1 comprimido (dose única)",
    protectionMonths: 1,
    frequencyLabel: "Mensal (dirofilariose) / Trimestral (rotina)",
    stockTokens: ["milbemax"],
  },
  {
    key: "drontal-plus-cao-10kg",
    name: "Drontal Plus (660 mg)",
    activeIngredient: "Febantel + Pirantel + Praziquantel",
    target: "INTERNAL",
    species: ["Cão"],
    weightMinKg: 5,
    weightMaxKg: 10,
    route: "Oral",
    doseText: "1 comprimido (dose única)",
    protectionMonths: 1,
    frequencyLabel: "Trimestral (rotina)",
    warnings: "Não administrar a gatos. Giárdia: 1x/dia durante 3 dias.",
    stockTokens: ["drontal"],
  },
  {
    key: "drontal-plus-cao-xl",
    name: "Drontal Plus XL (2310 mg)",
    activeIngredient: "Febantel + Pirantel + Praziquantel",
    target: "INTERNAL",
    species: ["Cão"],
    weightMinKg: 17.5,
    weightMaxKg: 35,
    route: "Oral",
    doseText: "1 comprimido (dose única). 7–17,5 kg: ½ comprimido",
    protectionMonths: 1,
    frequencyLabel: "Trimestral (rotina)",
    warnings: "Não administrar a gatos.",
    stockTokens: ["drontal"],
  },
  {
    key: "drontal-cat-gato",
    name: "Drontal Cat",
    activeIngredient: "Pirantel + Praziquantel",
    target: "INTERNAL",
    species: ["Gato"],
    weightMinKg: 1,
    weightMaxKg: 6,
    route: "Oral",
    doseText: "1 comprimido por cada 4 kg (dose única)",
    protectionMonths: 1,
    frequencyLabel: "Trimestral (rotina)",
    stockTokens: ["drontal"],
  },
  {
    key: "panacur-cao",
    name: "Panacur (Fenbendazol)",
    activeIngredient: "Fenbendazol",
    target: "INTERNAL",
    species: ["Cão", "Gato"],
    weightMinKg: 1,
    weightMaxKg: 60,
    route: "Oral",
    doseText: "1 comprimido por 10 kg (50 mg/kg), 3 dias consecutivos",
    protectionMonths: 1,
    frequencyLabel: "Repetir 3 dias",
    warnings: "Útil em cachorros e ninhadas. Confirmar protocolo.",
    stockTokens: ["panacur"],
  },

  /* ─────────────────────────── EXTERNOS / MISTOS ─────────────────────────── */
  {
    key: "bravecto-cao-2-4-5",
    name: "Bravecto 112,5 mg (muito pequeno)",
    activeIngredient: "Fluralaner",
    target: "EXTERNAL",
    species: ["Cão"],
    weightMinKg: 2,
    weightMaxKg: 4.5,
    minAgeWeeks: 8,
    route: "Oral",
    doseText: "1 comprimido mastigável (durante ou perto da refeição)",
    protectionMonths: 3,
    frequencyLabel: "A cada 12 semanas",
    warnings: "Não partir o comprimido. Não usar em gatos.",
    stockTokens: ["bravecto"],
  },
  {
    key: "bravecto-cao-4-5-10",
    name: "Bravecto 250 mg (pequeno)",
    activeIngredient: "Fluralaner",
    target: "EXTERNAL",
    species: ["Cão"],
    weightMinKg: 4.5,
    weightMaxKg: 10,
    minAgeWeeks: 8,
    route: "Oral",
    doseText: "1 comprimido mastigável (durante ou perto da refeição)",
    protectionMonths: 3,
    frequencyLabel: "A cada 12 semanas",
    warnings: "Não partir o comprimido. Não usar em gatos.",
    stockTokens: ["bravecto"],
  },
  {
    key: "bravecto-cao-10-20",
    name: "Bravecto 500 mg (médio)",
    activeIngredient: "Fluralaner",
    target: "EXTERNAL",
    species: ["Cão"],
    weightMinKg: 10,
    weightMaxKg: 20,
    minAgeWeeks: 8,
    route: "Oral",
    doseText: "1 comprimido mastigável (durante ou perto da refeição)",
    protectionMonths: 3,
    frequencyLabel: "A cada 12 semanas",
    warnings: "Não partir o comprimido. Não usar em gatos.",
    stockTokens: ["bravecto"],
  },
  {
    key: "bravecto-cao-20-40",
    name: "Bravecto 1000 mg (grande)",
    activeIngredient: "Fluralaner",
    target: "EXTERNAL",
    species: ["Cão"],
    weightMinKg: 20,
    weightMaxKg: 40,
    minAgeWeeks: 8,
    route: "Oral",
    doseText: "1 comprimido mastigável (durante ou perto da refeição)",
    protectionMonths: 3,
    frequencyLabel: "A cada 12 semanas",
    warnings: "Não partir o comprimido. Não usar em gatos.",
    stockTokens: ["bravecto"],
  },
  {
    key: "bravecto-cao-40-56",
    name: "Bravecto 1400 mg (muito grande)",
    activeIngredient: "Fluralaner",
    target: "EXTERNAL",
    species: ["Cão"],
    weightMinKg: 40,
    weightMaxKg: 80,
    minAgeWeeks: 8,
    route: "Oral",
    doseText: "1 comprimido mastigável (>56 kg: combinação de 2 comprimidos)",
    protectionMonths: 3,
    frequencyLabel: "A cada 12 semanas",
    warnings: "Não partir o comprimido. Não usar em gatos.",
    stockTokens: ["bravecto"],
  },
  {
    key: "bravecto-plus-gato",
    name: "Bravecto Plus Gato (spot-on)",
    activeIngredient: "Fluralaner + Moxidectina",
    target: "BOTH",
    species: ["Gato"],
    weightMinKg: 1.2,
    weightMaxKg: 12.5,
    route: "Spot-on",
    doseText: "Aplicar na base do crânio (1,2–2,8 · >2,8–6,25 · >6,25–12,5 kg)",
    protectionMonths: 3,
    frequencyLabel: "A cada 12 semanas",
    warnings: "Uso exclusivamente tópico.",
    stockTokens: ["bravecto"],
  },
  {
    key: "nexgard-cao",
    name: "NexGard",
    activeIngredient: "Afoxolaner",
    target: "EXTERNAL",
    species: ["Cão"],
    weightMinKg: 2,
    weightMaxKg: 60,
    minAgeWeeks: 8,
    route: "Oral",
    doseText: "1 comprimido mastigável mensal (bandas 2–4 · 4–10 · 10–25 · 25–60 kg)",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Não usar em gatos. Versão Spectra cobre também vermes/dirofilariose.",
    stockTokens: ["nexgard"],
  },
  {
    key: "nexgard-spectra-cao",
    name: "NexGard Spectra",
    activeIngredient: "Afoxolaner + Milbemicina oxima",
    target: "BOTH",
    species: ["Cão"],
    weightMinKg: 2,
    weightMaxKg: 60,
    minAgeWeeks: 8,
    route: "Oral",
    doseText: "1 comprimido mastigável mensal (2–3,5 · 3,5–7,5 · 7,5–15 · 15–30 · 30–60 kg)",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Cobre pulgas, carraças, vermes intestinais e dirofilariose.",
    stockTokens: ["nexgard"],
  },
  {
    key: "simparica-cao",
    name: "Simparica",
    activeIngredient: "Sarolaner",
    target: "EXTERNAL",
    species: ["Cão"],
    weightMinKg: 1.25,
    weightMaxKg: 60,
    minAgeWeeks: 8,
    route: "Oral",
    doseText: "1 comprimido mensal (1,25–2,5 · 2,5–5 · 5–10 · 10–20 · 20–40 · 40–60 kg)",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Ação também sobre sarnas. Não usar em gatos.",
    stockTokens: ["simparica"],
  },
  {
    key: "simparica-trio-cao",
    name: "Simparica Trio",
    activeIngredient: "Sarolaner + Moxidectina + Pirantel",
    target: "BOTH",
    species: ["Cão"],
    weightMinKg: 1.25,
    weightMaxKg: 60,
    minAgeWeeks: 8,
    route: "Oral",
    doseText: "1 comprimido a cada 35 dias (mesmas bandas do Simparica)",
    protectionMonths: 1,
    frequencyLabel: "Mensal (35 dias)",
    warnings: "Cobre pulgas, carraças, vermes, dirofilariose e sarnas.",
    stockTokens: ["simparica"],
  },
  {
    key: "frontline-combo-gato",
    name: "Frontline Combo Gato (spot-on)",
    activeIngredient: "Fipronil + (S)-Metopreno",
    target: "EXTERNAL",
    species: ["Gato"],
    weightMinKg: 1,
    weightMaxKg: 8,
    minAgeWeeks: 8,
    route: "Spot-on",
    doseText: "1 pipeta de 0,5 ml na nuca, mensal",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Não usar em coelhos nem em gatinhos <8 semanas / <1 kg.",
    stockTokens: ["frontline"],
  },
  {
    key: "frontline-combo-cao",
    name: "Frontline Combo Cão (spot-on)",
    activeIngredient: "Fipronil + (S)-Metopreno",
    target: "EXTERNAL",
    species: ["Cão"],
    weightMinKg: 2,
    weightMaxKg: 60,
    minAgeWeeks: 8,
    route: "Spot-on",
    doseText: "1 pipeta na nuca, mensal (bandas 2–10 · 10–20 · 20–40 · 40–60 kg)",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    stockTokens: ["frontline"],
  },
  {
    key: "advantage-gato",
    name: "Advantage Gato (spot-on)",
    activeIngredient: "Imidaclopride",
    target: "EXTERNAL",
    species: ["Gato"],
    weightMinKg: 0.8,
    weightMaxKg: 8,
    route: "Spot-on",
    doseText: "<4 kg: 0,4 ml · ≥4 kg: 0,8 ml (aplicação na nuca)",
    protectionMonths: 1,
    frequencyLabel: "Mensal (3–4 semanas)",
    warnings: "Apenas uso externo. Não administrar por via oral.",
    stockTokens: ["advantage"],
  },
  {
    key: "advantage-cao",
    name: "Advantage Cão (spot-on)",
    activeIngredient: "Imidaclopride",
    target: "EXTERNAL",
    species: ["Cão"],
    weightMinKg: 1,
    weightMaxKg: 40,
    route: "Spot-on",
    doseText: "1 pipeta na nuca, mensal (por faixa de peso)",
    protectionMonths: 1,
    frequencyLabel: "Mensal (4 semanas)",
    warnings: "Apenas uso externo.",
    stockTokens: ["advantage"],
  },
  {
    key: "advocate-gato",
    name: "Advocate Gato (spot-on)",
    activeIngredient: "Imidaclopride + Moxidectina",
    target: "BOTH",
    species: ["Gato"],
    weightMinKg: 0.8,
    weightMaxKg: 8,
    minAgeWeeks: 9,
    route: "Spot-on",
    doseText: "<4 kg: 0,4 ml · 4–8 kg: 0,8 ml, mensal",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Cobre pulgas, vermes, sarnas e dirofilariose. Uso tópico.",
    stockTokens: ["advocate"],
  },
  {
    key: "advocate-cao",
    name: "Advocate Cão (spot-on)",
    activeIngredient: "Imidaclopride + Moxidectina",
    target: "BOTH",
    species: ["Cão"],
    weightMinKg: 1,
    weightMaxKg: 40,
    minAgeWeeks: 7,
    route: "Spot-on",
    doseText: "1 pipeta na nuca, mensal (por faixa de peso)",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Cobre pulgas, vermes, sarnas e dirofilariose. Uso tópico.",
    stockTokens: ["advocate"],
  },
];

export interface GuideMatchInput {
  species?: string | null;
  weightKg?: number | null;
  ageMonths?: number | null;
}

export interface GuideMatch extends DewormerRef {
  /** true quando o peso informado cai dentro da faixa do produto. */
  weightMatch: boolean;
  /** true quando a idade mínima não é respeitada (se conhecida). */
  ageWarning: boolean;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * Devolve as opções de desparasitação aplicáveis aos dados do animal.
 * Filtra por espécie e idade; marca (sem excluir) o ajuste de peso.
 */
export function matchDewormingGuide(input: GuideMatchInput): GuideMatch[] {
  const species = input.species?.trim() || null;
  const weightKg = typeof input.weightKg === "number" && !Number.isNaN(input.weightKg) ? input.weightKg : null;
  const ageWeeks = typeof input.ageMonths === "number" && !Number.isNaN(input.ageMonths) ? input.ageMonths * 4.345 : null;

  return DEWORMING_GUIDE.filter((ref) => {
    if (species && !ref.species.includes(species as "Cão" | "Gato")) return false;
    return true;
  })
    .map((ref) => {
      const weightMatch = weightKg == null ? true : weightKg >= ref.weightMinKg && weightKg <= ref.weightMaxKg;
      const ageWarning = ref.minAgeWeeks != null && ageWeeks != null ? ageWeeks < ref.minAgeWeeks : false;
      return { ...ref, weightMatch, ageWarning };
    })
    .sort((a, b) => {
      // 1) ajusta ao peso primeiro  2) interna antes de externa  3) nome
      if (a.weightMatch !== b.weightMatch) return a.weightMatch ? -1 : 1;
      const order: Record<DewormerTarget, number> = { INTERNAL: 0, BOTH: 1, EXTERNAL: 2 };
      if (order[a.target] !== order[b.target]) return order[a.target] - order[b.target];
      return a.name.localeCompare(b.name, "pt");
    });
}

/** Encontra o produto do inventário correspondente a uma referência. */
export function findStockProduct<T extends { name: string }>(ref: DewormerRef, products: T[]): T | undefined {
  return products.find((p) => {
    const n = normalize(p.name);
    return ref.stockTokens.some((t) => n.includes(t));
  });
}
