/**
 * Posting pay — formatting for the job ad / postings list, and the schema.org
 * baseSalary for Google for Jobs. Pure (client + server safe). The base range is
 * the legally-disclosed good-faith figure; `tips` adds a "+ tips" suffix on top.
 */

export type PayPeriod = "hour" | "year";

export interface PostingPay {
  min: number | null | undefined;
  max: number | null | undefined;
  period: PayPeriod;
  tips: boolean;
}

function money(n: number, period: PayPeriod): string {
  if (period === "year") return `$${Math.round(n).toLocaleString("en-US")}`;
  // Hourly: drop a trailing .00, keep cents otherwise.
  return `$${n.toFixed(2).replace(/\.00$/, "")}`;
}

/** Human label, e.g. "$16–$18 / hour + tips". Null if no range set. */
export function formatPay(p: PostingPay): string | null {
  if (p.min == null || p.max == null) return null;
  const unit = p.period === "year" ? "year" : "hour";
  const range =
    p.min === p.max ? money(p.min, p.period) : `${money(p.min, p.period)}–${money(p.max, p.period)}`;
  return `${range} / ${unit}${p.tips ? " + tips" : ""}`;
}

/** schema.org MonetaryAmount for JobPosting.baseSalary (base range only). */
export function payBaseSalary(p: PostingPay): Record<string, unknown> | null {
  if (p.min == null || p.max == null) return null;
  return {
    "@type": "MonetaryAmount",
    currency: "USD",
    value: {
      "@type": "QuantitativeValue",
      minValue: p.min,
      maxValue: p.max,
      unitText: p.period === "year" ? "YEAR" : "HOUR",
    },
  };
}
