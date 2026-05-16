/**
 * ============================================
 * FEATURE FLAGS
 * ============================================
 *
 * Centraliza funcionalidades que podem estar
 * ativas ou inativas. Útil para:
 * - Desligar features em manutenção
 * - Rollout gradual
 * - Evitar UI de funcionalidades não implementadas
 */

export const FEATURES = {
  /** Faturação via Vendus (principal) */
  vendusBilling: true,

  /** Faturação via Jasmin (legacy, desligado por defeito) */
  jasminBilling: false,

  /** Envio automático de faturas por email */
  vendusAutoEmail: true,

  /** Sincronização de stock em tempo real */
  inventorySync: true,

  /** Integração HL7 com laboratórios */
  hl7Integration: false, // requer HL7_BRIDGE_URL

  /** Integração DICOM com PACS */
  dicomIntegration: false, // requer DICOM_PACS_URL

  /** Notificações SMS via Twilio/SMS gateway */
  smsNotifications: false,

  /** Portal do Tutor (owner self-service) */
  ownerPortal: true,

  /** Orçamentos clínicos */
  budgets: false,

  /** Planos de saúde para pacientes */
  healthPlans: false,

  /** Hospitalização e mapa de canis */
  hospitalization: true,

  /** Business Intelligence / Analytics avançado */
  biAnalytics: false,

  /** Exportação de relatórios contabilísticos */
  accountingExports: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * Verifica se uma funcionalidade está ativa.
 * @param key - Nome da funcionalidade
 * @returns boolean
 *
 * @example
 * if (isFeatureEnabled("smsNotifications")) {
 *   return <Button>Enviar SMS</Button>;
 * }
 * return null;
 */
export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
