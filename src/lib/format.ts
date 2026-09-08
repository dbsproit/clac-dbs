// Formatting helpers shared across the app.

export const usd = (n: number, digits = 2): string =>
  (isFinite(n) ? n : 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const num = (n: number, digits = 0): string =>
  (isFinite(n) ? n : 0).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const pct = (n: number, digits = 1): string =>
  `${(isFinite(n) ? n : 0).toFixed(digits)}%`;

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
