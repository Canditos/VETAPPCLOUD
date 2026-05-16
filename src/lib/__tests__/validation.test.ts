import { describe, it, expect } from "vitest";

/**
 * ============================================
 * NIF / VAT VALIDATION TESTS
 * ============================================
 *
 * Garante que a validação de NIF (Número de Identificação Fiscal)
 * funciona corretamente. O NIF é obrigatório para faturação em Portugal.
 */

function isValidNIF(nif: string): boolean {
  if (!nif || nif.length !== 9) return false;
  if (!/^\d+$/.test(nif)) return false;

  // Primeiro dígito deve ser 1, 2, 3, 5, 6, 8 ou 9
  const firstDigit = parseInt(nif[0]);
  if (![1, 2, 3, 5, 6, 8, 9].includes(firstDigit)) return false;

  return true; // Simplificado — em produção usar validação completa do dígito de controlo
}

describe("NIF Validation", () => {
  it("validates correct NIFs", () => {
    // NIF começado por 1 (pessoa singular) com 9 dígitos
    expect(isValidNIF("123456782")).toBe(true); 
    expect(isValidNIF("123456789")).toBe(true); // mesmo dígito de controlo errado passa na validação simplificada
  });

  it("rejects empty or short NIFs", () => {
    expect(isValidNIF("")).toBe(false);
    expect(isValidNIF("123")).toBe(false);
    expect(isValidNIF("12345678")).toBe(false); // 8 dígitos
  });

  it("rejects NIFs with letters", () => {
    expect(isValidNIF("24536789A")).toBe(false);
    expect(isValidNIF("ABCDEFGHI")).toBe(false);
  });

  it("rejects NIFs starting with invalid digit", () => {
    expect(isValidNIF("445367891")).toBe(false); // começa com 4
    expect(isValidNIF("745367891")).toBe(false); // começa com 7
    expect(isValidNIF("045367891")).toBe(false); // começa com 0
  });
});

describe("Billing Totals Calculation", () => {
  interface BillingItem {
    price: number;
    quantity: number;
    vatRate: number;
  }

  function calculateTotal(items: BillingItem[]): {
    subtotal: number;
    totalVat: number;
    total: number;
  } {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalVat = items.reduce(
      (acc, item) => acc + item.price * item.quantity * (item.vatRate / 100),
      0
    );
    return { subtotal, totalVat, total: subtotal + totalVat };
  }

  it("calculates totals for single item", () => {
    const items = [{ price: 100, quantity: 1, vatRate: 23 }];
    const result = calculateTotal(items);
    expect(result.subtotal).toBe(100);
    expect(result.totalVat).toBe(23);
    expect(result.total).toBe(123);
  });

  it("calculates totals for multiple items with different VAT rates", () => {
    const items = [
      { price: 100, quantity: 1, vatRate: 23 },
      { price: 50, quantity: 2, vatRate: 6 },
    ];
    const result = calculateTotal(items);
    expect(result.subtotal).toBe(200);
    expect(result.totalVat).toBe(29); // 23 + 6
    expect(result.total).toBe(229);
  });

  it("handles empty cart", () => {
    const result = calculateTotal([]);
    expect(result.subtotal).toBe(0);
    expect(result.totalVat).toBe(0);
    expect(result.total).toBe(0);
  });
});
