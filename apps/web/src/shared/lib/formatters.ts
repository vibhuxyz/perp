import Decimal from "decimal.js";

const grouped = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(value: Decimal.Value | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return grouped.format(new Decimal(value).toNumber());
}

export function formatSize(value: Decimal.Value | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return new Decimal(value).toString();
}

export function formatSigned(value: Decimal.Value): string {
  const decimal = new Decimal(value);
  const sign = decimal.isNegative() ? "" : "+";

  return `${sign}${grouped.format(decimal.toNumber())}`;
}

export function pnlTone(value: Decimal.Value): "profit" | "loss" | "flat" {
  const decimal = new Decimal(value);

  if (decimal.isZero()) return "flat";

  return decimal.isNegative() ? "loss" : "profit";
}
