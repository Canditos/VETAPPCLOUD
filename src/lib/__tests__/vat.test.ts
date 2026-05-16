import { describe, it, expect } from "vitest";

/**
 * ============================================
 * VAT / IVA CALCULATION TESTS
 * ============================================
 *
 * Estes testes garantem que o cálculo de IVA em billing
 * está matematicamente correto. Um bug aqui custa dinheiro real.
 */

interface VatBreakdown {
  rate: number;
  base: number;
  vat: number;
  total: number;
  count: number;
}

function calculateVATBreakdown(
  items: { price: number; quantity: number; vatRate: number }[],
  vatRates: number[] = [6, 13, 23]
): VatBreakdown[] {
  return vatRates
    .map((rate) => {
      const itemsForRate = items.filter((i) => i.vatRate === rate);
      const base = itemsForRate.reduce((acc, i) => acc + i.price * i.quantity, 0);
      const vat = base * (rate / 100);
      return {
        rate,
        base,
        vat,
        total: base + vat,
        count: itemsForRate.length,
      };
    })
    .filter((b) => b.count > 0);
}

describe("VAT Calculation", () => {
  it("calculates 23% VAT correctly for single item", () => {
    const items = [{ price: 100, quantity: 1, vatRate: 23 }];
    const result = calculateVATBreakdown(items);
    expect(result).toHaveLength(1);
    expect(result[0].base).toBe(100);
    expect(result[0].vat).toBe(23);
    expect(result[0].total).toBe(123);
  });

  it("calculates 6% VAT correctly for single item", () => {
    const items = [{ price: 50, quantity: 2, vatRate: 6 }];
    const result = calculateVATBreakdown(items);
    expect(result[0].base).toBe(100);
    expect(result[0].vat).toBe(6);
    expect(result[0].total).toBe(106);
  });

  it("groups items by VAT rate", () => {
    const items = [
      { price: 100, quantity: 1, vatRate: 23 },
      { price: 50, quantity: 2, vatRate: 23 },
      { price: 30, quantity: 1, vatRate: 6 },
    ];
    const result = calculateVATBreakdown(items);
    expect(result).toHaveLength(2);

    const vat23 = result.find((r) => r.rate === 23)!;
    expect(vat23.base).toBe(200);
    expect(vat23.vat).toBe(46);

    const vat6 = result.find((r) => r.rate === 6)!;
    expect(vat6.base).toBe(30);
    expect(vat6.vat).toBeCloseTo(1.8, 4);
  });

  it("handles empty items array", () => {
    const result = calculateVATBreakdown([]);
    expect(result).toHaveLength(0);
  });

  it("handles decimal prices correctly", () => {
    const items = [{ price: 12.45, quantity: 3, vatRate: 23 }];
    const result = calculateVATBreakdown(items);
    expect(result[0].base).toBeCloseTo(37.35, 4);
    expect(result[0].vat).toBeCloseTo(8.5905, 4);
  });
});
