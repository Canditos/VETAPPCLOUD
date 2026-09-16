export function toCents(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function fromCents(c: number): number {
  return Math.round(c) / 100;
}

export function sumMoney(values: unknown[]): number {
  return fromCents(values.reduce((acc: number, v) => acc + toCents(v), 0));
}
