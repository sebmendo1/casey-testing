import type { AffordabilityDownPayment, AffordabilityResultData } from "./types";

/**
 * Rule-of-thumb affordability (not a loan commitment).
 *
 * - Uses 28% front-end and 36% back-end DTI on gross monthly income.
 *   Affordable principal & interest = min(28% of gross monthly, 36% of gross monthly − non-housing monthly debts).
 * - P&I only: taxes, insurance, HOA, and PMI are not modeled (disclosed in UI).
 * - Fixed assumed fully amortizing loan: ASSUMED_RATE_ANNUAL, TERM_YEARS.
 * - Down payment: either a percent of purchase price or a flat dollar amount toward price = loan + down.
 */

export const ASSUMED_RATE_ANNUAL = 0.065;
export const TERM_YEARS = 30;
export const FRONT_END_DTI = 0.28;
export const BACK_END_DTI = 0.36;

export interface AffordabilityInput {
  annualIncome: number;
  monthlyDebts: number;
  downPayment: AffordabilityDownPayment;
}

export interface AffordabilityComputeResult {
  maxHomePrice: number;
  maxLoanAmount: number;
  estimatedMonthlyPI: number;
  assumptions: {
    rateAnnual: number;
    termYears: number;
    frontEndDti: number;
    backEndDti: number;
  };
}

function monthlyPIForLoan(loanAmount: number, annualRate: number, termYears: number): number {
  if (loanAmount <= 0) return 0;
  const n = termYears * 12;
  const r = annualRate / 12;
  if (r <= 0) return loanAmount / n;
  const factor = r * (1 + r) ** n;
  const denom = (1 + r) ** n - 1;
  return loanAmount * (factor / denom);
}

/** Loan principal from fixed monthly P&I payment (standard amortization). */
function loanFromMonthlyPI(monthlyPI: number, annualRate: number, termYears: number): number {
  if (monthlyPI <= 0) return 0;
  const n = termYears * 12;
  const r = annualRate / 12;
  if (r <= 0) return monthlyPI * n;
  const factor = (1 + r) ** n;
  return (monthlyPI * (factor - 1)) / (r * factor);
}

function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function computeAffordabilityEstimate(input: AffordabilityInput): AffordabilityComputeResult {
  const grossMonthly = input.annualIncome / 12;
  const capFront = FRONT_END_DTI * grossMonthly;
  const capBack = BACK_END_DTI * grossMonthly - input.monthlyDebts;
  const affordableMonthlyPI = Math.max(0, Math.min(capFront, capBack));

  const maxLoanAmount = loanFromMonthlyPI(
    affordableMonthlyPI,
    ASSUMED_RATE_ANNUAL,
    TERM_YEARS
  );

  let maxHomePrice: number;
  if (input.downPayment.mode === "percent") {
    const p = Math.min(Math.max(input.downPayment.value, 0), 100) / 100;
    if (p >= 1) {
      maxHomePrice = maxLoanAmount;
    } else {
      maxHomePrice = maxLoanAmount / (1 - p);
    }
  } else {
    maxHomePrice = maxLoanAmount + Math.max(0, input.downPayment.value);
  }

  const estimatedMonthlyPI = monthlyPIForLoan(maxLoanAmount, ASSUMED_RATE_ANNUAL, TERM_YEARS);

  return {
    maxHomePrice,
    maxLoanAmount,
    estimatedMonthlyPI,
    assumptions: {
      rateAnnual: ASSUMED_RATE_ANNUAL,
      termYears: TERM_YEARS,
      frontEndDti: FRONT_END_DTI,
      backEndDti: BACK_END_DTI,
    },
  };
}

export function formatAffordabilityResultCard(compute: AffordabilityComputeResult): AffordabilityResultData {
  const ratePct = (compute.assumptions.rateAnnual * 100).toFixed(1);
  return {
    headline: "Your estimated buying power",
    maxHomePriceLabel: formatUsd(compute.maxHomePrice),
    monthlyPaymentLabel: `${formatUsd(compute.estimatedMonthlyPI)}/mo`,
    maxLoanLabel: formatUsd(compute.maxLoanAmount),
    disclaimer: `Estimate only—not a loan offer. Uses ${ratePct}% APR and ${compute.assumptions.termYears}-year term for principal & interest; ${Math.round(compute.assumptions.frontEndDti * 100)}% / ${Math.round(compute.assumptions.backEndDti * 100)}% DTI rules. Taxes, insurance, HOA, and PMI are not included. Actual rates and approval depend on your full application.`,
  };
}

/** Parse user text for a non-negative number (currency, commas, optional %). */
export function parseMoneyOrPercent(text: string): { ok: true; value: number; isPercent: boolean } | { ok: false } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false };
  const isPercent = trimmed.endsWith("%");
  const raw = trimmed.replace(/,/g, "").replace(/^\$/, "").replace(/%$/, "").trim();
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return { ok: false };
  return { ok: true, value: n, isPercent };
}
