/**
 * ============================================
 * DEWORMING GUIDE — Cabula clínica
 * ============================================
 *
 * Catálogo de referência de antiparasitários usados em Portugal,
 * usado pela "cabula" de apoio à decisão (vet + receção).
 *
 * Fonte clínica: RCM/folhetos informativos oficiais (DGAV medvet,
 * EMA, MSD, Elanco, Boehringer, Zoetis). Doses indicativas — NÃO
 * substituem a avaliação do médico veterinário nem o RCM do produto.
 *
 * Cada produto tem uma tabela de doses POR PESO (`bands`), para que a
 * cabula mostre a dose exata para o animal em causa (espécie + peso).
 *
 * `stockTokens` serve para fazer match com os produtos do inventário
 * da clínica (nome normalizado) e aí mostrar preço/stock reais.
 */

export type DewormerTarget = "INTERNAL" | "EXTERNAL" | "BOTH";
export type DewormerRoute = "Oral" | "Spot-on" | "Injectable";

export interface DoseBand {
  /** Limite inferior (kg, inclusivo). */
  minKg: number;
  /** Limite superior (kg, inclusivo). */
  maxKg: number;
  /** Dose prática para esta faixa (ex: "1 comprimido", "0,8 ml"). */
  dose: string;
  /** Apresentação / rótulo (ex: "Comprimido 250 mg", "Pipeta 0,8 ml"). */
  presentation?: string;
}

export interface DewormerRef {
  key: string;
  name: string;
  activeIngredient: string;
  target: DewormerTarget;
  species: Array<"Cão" | "Gato">;
  minAgeWeeks?: number;
  route: DewormerRoute;
  /** Como aplicar — método, com/sem alimento, cuidados. */
  howToApply: string;
  /** Duração de proteção, em meses (base do preço/mês). */
  protectionMonths: number;
  frequencyLabel: string;
  /** Notas clínicas / contraindicações (separadas da dose). */
  warnings?: string;
  /** Tabela de doses por faixa de peso. */
  bands: DoseBand[];
  stockTokens: string[];
}

export const DEWORMING_GUIDE: DewormerRef[] = [
  /* ─────────────────────────── INTERNOS ─────────────────────────── */
  {
    key: "milbemax-cao-pequeno",
    name: "Milbemax Cães Pequenos (2,5/25 mg)",
    activeIngredient: "Milbemicina oxima + Praziquantel",
    target: "INTERNAL",
    species: ["Cão"],
    route: "Oral",
    howToApply: "Comprimido por via oral, dose única, com ou após a alimentação.",
    protectionMonths: 1,
    frequencyLabel: "Mensal (dirofilariose) · Trimestral (rotina)",
    warnings: "Não usar em gatos. Cadelas em lactação: tratar ao mesmo tempo que as crias.",
    bands: [
      { minKg: 0.5, maxKg: 1, dose: "½ comprimido", presentation: "Comprimido oblongo" },
      { minKg: 1, maxKg: 5, dose: "1 comprimido", presentation: "Comprimido oblongo" },
      { minKg: 5, maxKg: 10, dose: "2 comprimidos", presentation: "Comprimido oblongo" },
    ],
    stockTokens: ["milbemax"],
  },
  {
    key: "milbemax-cao",
    name: "Milbemax Cães (12,5/125 mg)",
    activeIngredient: "Milbemicina oxima + Praziquantel",
    target: "INTERNAL",
    species: ["Cão"],
    route: "Oral",
    howToApply: "Comprimido por via oral, dose única, com ou após a alimentação.",
    protectionMonths: 1,
    frequencyLabel: "Mensal (dirofilariose) · Trimestral (rotina)",
    warnings: "Não usar em gatos.",
    bands: [
      { minKg: 5, maxKg: 25, dose: "1 comprimido", presentation: "Comprimido redondo" },
      { minKg: 25, maxKg: 50, dose: "2 comprimidos", presentation: "Comprimido redondo" },
      { minKg: 50, maxKg: 75, dose: "3 comprimidos", presentation: "Comprimido redondo" },
    ],
    stockTokens: ["milbemax"],
  },
  {
    key: "milbemax-gato",
    name: "Milbemax Gatos (16/40 mg)",
    activeIngredient: "Milbemicina oxima + Praziquantel",
    target: "INTERNAL",
    species: ["Gato"],
    route: "Oral",
    howToApply: "Comprimido por via oral, dose única, com ou após a alimentação.",
    protectionMonths: 1,
    frequencyLabel: "Mensal (dirofilariose) · Trimestral (rotina)",
    bands: [
      { minKg: 0.5, maxKg: 2, dose: "½ comprimido" },
      { minKg: 2, maxKg: 8, dose: "1 comprimido" },
    ],
    stockTokens: ["milbemax"],
  },
  {
    key: "drontal-plus-660",
    name: "Drontal Plus (660 mg)",
    activeIngredient: "Febantel + Pirantel + Praziquantel",
    target: "INTERNAL",
    species: ["Cão"],
    route: "Oral",
    howToApply: "Comprimido por via oral, dose única. Pode ser misturado na comida.",
    protectionMonths: 1,
    frequencyLabel: "Trimestral (rotina)",
    warnings: "Não administrar a gatos. Contra giardíase: 1x/dia durante 3 dias.",
    bands: [
      { minKg: 0.5, maxKg: 2, dose: "¼ comprimido" },
      { minKg: 2, maxKg: 5, dose: "½ comprimido" },
      { minKg: 5, maxKg: 10, dose: "1 comprimido" },
    ],
    stockTokens: ["drontal"],
  },
  {
    key: "drontal-plus-xl",
    name: "Drontal Plus XL (2310 mg)",
    activeIngredient: "Febantel + Pirantel + Praziquantel",
    target: "INTERNAL",
    species: ["Cão"],
    route: "Oral",
    howToApply: "Comprimido por via oral, dose única.",
    protectionMonths: 1,
    frequencyLabel: "Trimestral (rotina)",
    warnings: "Não administrar a gatos.",
    bands: [
      { minKg: 7, maxKg: 17.5, dose: "½ comprimido" },
      { minKg: 17.5, maxKg: 35, dose: "1 comprimido" },
    ],
    stockTokens: ["drontal"],
  },
  {
    key: "drontal-cat",
    name: "Drontal Cat",
    activeIngredient: "Pirantel + Praziquantel",
    target: "INTERNAL",
    species: ["Gato"],
    route: "Oral",
    howToApply: "Comprimido por via oral, dose única.",
    protectionMonths: 1,
    frequencyLabel: "Trimestral (rotina)",
    bands: [
      { minKg: 1, maxKg: 4, dose: "1 comprimido" },
      { minKg: 4, maxKg: 6, dose: "1½ comprimido" },
    ],
    stockTokens: ["drontal"],
  },
  {
    key: "panacur",
    name: "Panacur (Fenbendazol)",
    activeIngredient: "Fenbendazol",
    target: "INTERNAL",
    species: ["Cão", "Gato"],
    route: "Oral",
    howToApply: "Comprimido por via oral, durante 3 dias consecutivos.",
    protectionMonths: 1,
    frequencyLabel: "3 dias seguidos",
    warnings: "Dose contínua (não por faixa). Útil em cachorros e ninhadas.",
    bands: [{ minKg: 1, maxKg: 60, dose: "1 comprimido por cada 10 kg (50 mg/kg)" }],
    stockTokens: ["panacur"],
  },

  /* ─────────────────────────── EXTERNOS / MISTOS ─────────────────────────── */
  {
    key: "bravecto-cao",
    name: "Bravecto Cão (comprimido)",
    activeIngredient: "Fluralaner",
    target: "EXTERNAL",
    species: ["Cão"],
    minAgeWeeks: 8,
    route: "Oral",
    howToApply:
      "Comprimido mastigável, durante ou perto da refeição. NÃO partir nem dividir.",
    protectionMonths: 3,
    frequencyLabel: "A cada 12 semanas (3 meses)",
    warnings: "Não usar em gatos.",
    bands: [
      { minKg: 2, maxKg: 4.5, dose: "1 comprimido", presentation: "112,5 mg" },
      { minKg: 4.5, maxKg: 10, dose: "1 comprimido", presentation: "250 mg" },
      { minKg: 10, maxKg: 20, dose: "1 comprimido", presentation: "500 mg" },
      { minKg: 20, maxKg: 40, dose: "1 comprimido", presentation: "1000 mg" },
      { minKg: 40, maxKg: 56, dose: "1 comprimido", presentation: "1400 mg" },
    ],
    stockTokens: ["bravecto"],
  },
  {
    key: "bravecto-plus-gato",
    name: "Bravecto Plus Gato (spot-on)",
    activeIngredient: "Fluralaner + Moxidectina",
    target: "BOTH",
    species: ["Gato"],
    route: "Spot-on",
    howToApply: "Aplicar na pele, na base do crânio. Uso exclusivamente tópico.",
    protectionMonths: 3,
    frequencyLabel: "A cada 12 semanas (3 meses)",
    warnings: "Nunca usar a apresentação de cão em gatos.",
    bands: [
      { minKg: 1.2, maxKg: 2.8, dose: "1 pipeta", presentation: "112,5 mg" },
      { minKg: 2.8, maxKg: 6.25, dose: "1 pipeta", presentation: "250 mg" },
      { minKg: 6.25, maxKg: 12.5, dose: "1 pipeta", presentation: "500 mg" },
    ],
    stockTokens: ["bravecto"],
  },
  {
    key: "nexgard",
    name: "NexGard",
    activeIngredient: "Afoxolaner",
    target: "EXTERNAL",
    species: ["Cão"],
    minAgeWeeks: 8,
    route: "Oral",
    howToApply: "Comprimido mastigável, mensal. Pode ser dado com a comida.",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Não usar em gatos. A versão Spectra cobre também vermes/dirofilariose.",
    bands: [
      { minKg: 2, maxKg: 4, dose: "1 comprimido" },
      { minKg: 4, maxKg: 10, dose: "1 comprimido" },
      { minKg: 10, maxKg: 25, dose: "1 comprimido" },
      { minKg: 25, maxKg: 60, dose: "1 comprimido" },
    ],
    stockTokens: ["nexgard"],
  },
  {
    key: "nexgard-spectra",
    name: "NexGard Spectra",
    activeIngredient: "Afoxolaner + Milbemicina oxima",
    target: "BOTH",
    species: ["Cão"],
    minAgeWeeks: 8,
    route: "Oral",
    howToApply:
      "Comprimido mastigável, mensal. Pode ser dado com a comida. NÃO partir.",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings:
      "Cobre pulgas, carraças, vermes intestinais e dirofilariose. Não usar em gatos.",
    bands: [
      { minKg: 1.35, maxKg: 3.5, dose: "1 comprimido", presentation: "9 mg / 2 mg" },
      { minKg: 3.5, maxKg: 7.5, dose: "1 comprimido", presentation: "19 mg / 4 mg" },
      { minKg: 7.5, maxKg: 15, dose: "1 comprimido", presentation: "38 mg / 8 mg" },
      { minKg: 15, maxKg: 30, dose: "1 comprimido", presentation: "75 mg / 15 mg" },
      { minKg: 30, maxKg: 60, dose: "1 comprimido", presentation: "150 mg / 30 mg" },
    ],
    stockTokens: ["nexgard"],
  },
  {
    key: "simparica",
    name: "Simparica",
    activeIngredient: "Sarolaner",
    target: "EXTERNAL",
    species: ["Cão"],
    minAgeWeeks: 8,
    route: "Oral",
    howToApply: "Comprimido mastigável, mensal.",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Ação também sobre sarnas. Não usar em gatos.",
    bands: [
      { minKg: 1.25, maxKg: 2.5, dose: "1 comprimido" },
      { minKg: 2.5, maxKg: 5, dose: "1 comprimido" },
      { minKg: 5, maxKg: 10, dose: "1 comprimido" },
      { minKg: 10, maxKg: 20, dose: "1 comprimido" },
      { minKg: 20, maxKg: 40, dose: "1 comprimido" },
      { minKg: 40, maxKg: 60, dose: "1 comprimido" },
    ],
    stockTokens: ["simparica"],
  },
  {
    key: "simparica-trio",
    name: "Simparica Trio",
    activeIngredient: "Sarolaner + Moxidectina + Pirantel",
    target: "BOTH",
    species: ["Cão"],
    minAgeWeeks: 8,
    route: "Oral",
    howToApply: "Comprimido mastigável, a cada 35 dias.",
    protectionMonths: 1,
    frequencyLabel: "Mensal (35 dias)",
    warnings: "Cobre pulgas, carraças, vermes, dirofilariose e sarnas. Não usar em gatos.",
    bands: [
      { minKg: 1.25, maxKg: 2.5, dose: "1 comprimido" },
      { minKg: 2.5, maxKg: 5, dose: "1 comprimido" },
      { minKg: 5, maxKg: 10, dose: "1 comprimido" },
      { minKg: 10, maxKg: 20, dose: "1 comprimido" },
      { minKg: 20, maxKg: 40, dose: "1 comprimido" },
      { minKg: 40, maxKg: 60, dose: "1 comprimido" },
    ],
    stockTokens: ["simparica"],
  },
  {
    key: "frontline-combo-cao",
    name: "Frontline Combo Cão (spot-on)",
    activeIngredient: "Fipronil + (S)-Metopreno",
    target: "EXTERNAL",
    species: ["Cão"],
    minAgeWeeks: 8,
    route: "Spot-on",
    howToApply: "1 pipeta na nuca, sobre pele não lesada. Evitar contacto com olhos.",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Não usar em coelhos.",
    bands: [
      { minKg: 2, maxKg: 10, dose: "1 pipeta", presentation: "0,67 ml" },
      { minKg: 10, maxKg: 20, dose: "1 pipeta", presentation: "1,34 ml" },
      { minKg: 20, maxKg: 40, dose: "1 pipeta", presentation: "2,68 ml" },
      { minKg: 40, maxKg: 60, dose: "1 pipeta", presentation: "4,02 ml" },
    ],
    stockTokens: ["frontline"],
  },
  {
    key: "frontline-combo-gato",
    name: "Frontline Combo Gato (spot-on)",
    activeIngredient: "Fipronil + (S)-Metopreno",
    target: "EXTERNAL",
    species: ["Gato"],
    minAgeWeeks: 8,
    route: "Spot-on",
    howToApply: "1 pipeta de 0,5 ml na nuca, mensal.",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Não usar em gatinhos <8 semanas / <1 kg, nem em coelhos.",
    bands: [{ minKg: 1, maxKg: 8, dose: "1 pipeta", presentation: "0,5 ml" }],
    stockTokens: ["frontline"],
  },
  {
    key: "advantage-gato",
    name: "Advantage Gato (spot-on)",
    activeIngredient: "Imidaclopride",
    target: "EXTERNAL",
    species: ["Gato"],
    route: "Spot-on",
    howToApply: "Aplicar na nuca. Apenas uso externo — nunca por via oral.",
    protectionMonths: 1,
    frequencyLabel: "Mensal (3–4 semanas)",
    warnings: "Não deixar os animais lamberem-se após aplicação.",
    bands: [
      { minKg: 0.8, maxKg: 4, dose: "0,4 ml", presentation: "Advantage 40" },
      { minKg: 4, maxKg: 8, dose: "0,8 ml", presentation: "Advantage 80" },
    ],
    stockTokens: ["advantage"],
  },
  {
    key: "advantage-cao",
    name: "Advantage Cão (spot-on)",
    activeIngredient: "Imidaclopride",
    target: "EXTERNAL",
    species: ["Cão"],
    route: "Spot-on",
    howToApply: "Aplicar na linha média das costas. Apenas uso externo.",
    protectionMonths: 1,
    frequencyLabel: "Mensal (4 semanas)",
    bands: [
      { minKg: 1, maxKg: 4, dose: "0,4 ml", presentation: "Advantage 40" },
      { minKg: 4, maxKg: 10, dose: "1,0 ml", presentation: "Advantage 100" },
      { minKg: 10, maxKg: 25, dose: "2,5 ml", presentation: "Advantage 250" },
      { minKg: 25, maxKg: 40, dose: "4,0 ml", presentation: "Advantage 400" },
    ],
    stockTokens: ["advantage"],
  },
  {
    key: "advocate-gato",
    name: "Advocate Gato (spot-on)",
    activeIngredient: "Imidaclopride + Moxidectina",
    target: "BOTH",
    species: ["Gato"],
    minAgeWeeks: 9,
    route: "Spot-on",
    howToApply: "1 pipeta aplicada na nuca, mensal.",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Cobre pulgas, vermes, sarnas e dirofilariose. Uso tópico.",
    bands: [
      { minKg: 0.8, maxKg: 4, dose: "0,4 ml", presentation: "Pipeta ≤4 kg" },
      { minKg: 4, maxKg: 8, dose: "0,8 ml", presentation: "Pipeta 4–8 kg" },
    ],
    stockTokens: ["advocate"],
  },
  {
    key: "advocate-cao",
    name: "Advocate Cão (spot-on)",
    activeIngredient: "Imidaclopride + Moxidectina",
    target: "BOTH",
    species: ["Cão"],
    minAgeWeeks: 7,
    route: "Spot-on",
    howToApply: "1 pipeta aplicada na linha média das costas, mensal.",
    protectionMonths: 1,
    frequencyLabel: "Mensal",
    warnings: "Cobre pulgas, vermes, sarnas e dirofilariose. Uso tópico.",
    bands: [
      { minKg: 1, maxKg: 4, dose: "0,4 ml", presentation: "Pipeta ≤4 kg" },
      { minKg: 4, maxKg: 10, dose: "1,0 ml", presentation: "Pipeta >4–10 kg" },
      { minKg: 10, maxKg: 25, dose: "2,5 ml", presentation: "Pipeta >10–25 kg" },
      { minKg: 25, maxKg: 40, dose: "4,0 ml", presentation: "Pipeta >25–40 kg" },
    ],
    stockTokens: ["advocate"],
  },
];

/* ─────────────────────────── Helpers ─────────────────────────── */

export function refWeightRange(ref: DewormerRef): { minKg: number; maxKg: number } {
  const mins = ref.bands.map((b) => b.minKg);
  const maxs = ref.bands.map((b) => b.maxKg);
  return { minKg: Math.min(...mins), maxKg: Math.max(...maxs) };
}

/** Devolve a banda aplicável ao peso indicado (ou null). */
export function resolveBand(ref: DewormerRef, weightKg: number | null): DoseBand | null {
  if (weightKg == null) return null;
  return ref.bands.find((b) => weightKg >= b.minKg && weightKg <= b.maxKg) ?? null;
}

export interface GuideMatchInput {
  species?: string | null;
  weightKg?: number | null;
  ageMonths?: number | null;
}

export interface GuideMatch extends DewormerRef {
  weightMinKg: number;
  weightMaxKg: number;
  /** Banda aplicável ao peso indicado. */
  applicableBand: DoseBand | null;
  /** true quando o peso cai dentro de alguma banda do produto. */
  weightMatch: boolean;
  /** true quando o animal está abaixo da idade mínima. */
  ageWarning: boolean;
  /** Índice da banda aplicável (para destacar na tabela). */
  applicableBandIndex: number;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * Devolve as opções de desparasitação aplicáveis aos dados do animal.
 * Filtra por espécie e marca o ajuste de peso/idade (sem excluir).
 */
export function matchDewormingGuide(input: GuideMatchInput): GuideMatch[] {
  const species = input.species?.trim() || null;
  const weightKg =
    typeof input.weightKg === "number" && !Number.isNaN(input.weightKg) ? input.weightKg : null;
  const ageWeeks =
    typeof input.ageMonths === "number" && !Number.isNaN(input.ageMonths)
      ? input.ageMonths * 4.345
      : null;

  return DEWORMING_GUIDE.filter((ref) => {
    if (species && !ref.species.includes(species as "Cão" | "Gato")) return false;
    return true;
  })
    .map((ref) => {
      const { minKg, maxKg } = refWeightRange(ref);
      const applicableBand = resolveBand(ref, weightKg);
      const applicableBandIndex = applicableBand ? ref.bands.indexOf(applicableBand) : -1;
      const weightMatch = weightKg == null ? true : weightKg >= minKg && weightKg <= maxKg;
      const ageWarning =
        ref.minAgeWeeks != null && ageWeeks != null ? ageWeeks < ref.minAgeWeeks : false;
      return {
        ...ref,
        weightMinKg: minKg,
        weightMaxKg: maxKg,
        applicableBand,
        applicableBandIndex,
        weightMatch,
        ageWarning,
      };
    })
    .sort((a, b) => {
      // 1) ajusta ao peso  2) interna antes de externa  3) nome
      if (a.weightMatch !== b.weightMatch) return a.weightMatch ? -1 : 1;
      const order: Record<DewormerTarget, number> = { INTERNAL: 0, BOTH: 1, EXTERNAL: 2 };
      if (order[a.target] !== order[b.target]) return order[a.target] - order[b.target];
      return a.name.localeCompare(b.name, "pt");
    });
}

/** Encontra o produto do inventário correspondente a uma referência. */
export function findStockProduct<T extends { name: string }>(
  ref: DewormerRef,
  products: T[]
): T | undefined {
  return products.find((p) => {
    const n = normalize(p.name);
    return ref.stockTokens.some((t) => n.includes(t));
  });
}
