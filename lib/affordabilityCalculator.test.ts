import { describe, expect, it } from "vitest";
import { ASSUMED_RATE_ANNUAL, computeAffordabilityEstimate, parseMoneyOrPercent, TERM_YEARS } from "./affordabilityCalculator";

describe("computeAffordabilityEstimate", () => {
  it("returns zeros when income is zero", () => {
    const r = computeAffordabilityEstimate({
      annualIncome: 0,
      monthlyDebts: 0,
      downPayment: { mode: "percent", value: 20 },
    });
    expect(r.maxLoanAmount).toBe(0);
    expect(r.estimatedMonthlyPI).toBe(0);
    expect(r.maxHomePrice).toBe(0);
  });

  it("uses back-end DTI when debts reduce housing room below front-end cap", () => {
    const grossMonthly = 10_000;
    const annual = grossMonthly * 12;
    const debts = 2500;
    const capFront = 0.28 * grossMonthly;
    const capBack = 0.36 * grossMonthly - debts;
    expect(capBack).toBeLessThan(capFront);
    const r = computeAffordabilityEstimate({
      annualIncome: annual,
      monthlyDebts: debts,
      downPayment: { mode: "percent", value: 0 },
    });
    expect(r.estimatedMonthlyPI).toBeCloseTo(Math.max(0, capBack), 5);
    expect(r.maxLoanAmount).toBeGreaterThan(0);
  });

  it("raises max home price when down payment percent is higher (same loan, price = loan / (1 − pct))", () => {
    const r20 = computeAffordabilityEstimate({
      annualIncome: 120_000,
      monthlyDebts: 0,
      downPayment: { mode: "percent", value: 20 },
    });
    const r10 = computeAffordabilityEstimate({
      annualIncome: 120_000,
      monthlyDebts: 0,
      downPayment: { mode: "percent", value: 10 },
    });
    expect(r20.maxLoanAmount).toBeCloseTo(r10.maxLoanAmount, 1);
    expect(r20.maxHomePrice).toBeGreaterThan(r10.maxHomePrice);
  });

  it("adds flat dollar down to loan for max price", () => {
    const r = computeAffordabilityEstimate({
      annualIncome: 120_000,
      monthlyDebts: 0,
      downPayment: { mode: "dollar", value: 50_000 },
    });
    expect(r.maxHomePrice).toBeCloseTo(r.maxLoanAmount + 50_000, -1);
  });

  it("keeps PI consistent with amortization at assumed rate and term", () => {
    const r = computeAffordabilityEstimate({
      annualIncome: 240_000,
      monthlyDebts: 0,
      downPayment: { mode: "percent", value: 0 },
    });
    const n = TERM_YEARS * 12;
    const monthlyRate = ASSUMED_RATE_ANNUAL / 12;
    const L = r.maxLoanAmount;
    const expectedPi =
      L <= 0
        ? 0
        : (L * (monthlyRate * (1 + monthlyRate) ** n)) / ((1 + monthlyRate) ** n - 1);
    expect(r.estimatedMonthlyPI).toBeCloseTo(expectedPi, 4);
  });
});

describe("parseMoneyOrPercent", () => {
  it("parses currency and percent", () => {
    expect(parseMoneyOrPercent("$85,000")).toEqual({ ok: true, value: 85_000, isPercent: false });
    expect(parseMoneyOrPercent("20%")).toEqual({ ok: true, value: 20, isPercent: true });
    expect(parseMoneyOrPercent("")).toEqual({ ok: false });
    expect(parseMoneyOrPercent("abc")).toEqual({ ok: false });
  });
});
