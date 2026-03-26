import { Type, type FunctionDeclaration } from "@google/genai";
import type { AffordabilityResultData, PropertySummaryData, PropertyTileData } from "./types";
import {
  computeAffordabilityEstimate,
  formatAffordabilityResultCard,
} from "./affordabilityCalculator";
import type { PropertyListing } from "./propertyListing";
import { filterListingsForSearch } from "./zillowListings";

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "compute_affordability",
    description:
      "Calculate estimated home buying power from annual income, monthly non-housing debts, and a down payment (percent or dollar).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        annualIncome: {
          type: Type.NUMBER,
          description: "Gross annual income in USD",
        },
        monthlyDebts: {
          type: Type.NUMBER,
          description:
            "Total minimum monthly non-housing debt payments in USD (car loans, credit cards, student loans, etc.)",
        },
        downPaymentValue: {
          type: Type.NUMBER,
          description: "Down payment amount — a dollar figure or a percentage",
        },
        downPaymentMode: {
          type: Type.STRING,
          description:
            'Whether downPaymentValue is a percentage of purchase price or a flat dollar amount. Must be "percent" or "dollar".',
        },
      },
      required: [
        "annualIncome",
        "monthlyDebts",
        "downPaymentValue",
        "downPaymentMode",
      ],
    },
  },
  {
    name: "search_properties",
    description:
      "Search bundled Zillow-style property listings (demo data). Pass EITHER a 5-digit US zipCode OR both city and state (state can be two-letter code OR full name like Texas). Use normal capitalization for city names (e.g. Austin, San Antonio). Returns up to 5 listings with specs and listing ids (zpid).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        city: {
          type: Type.STRING,
          description:
            "City name (e.g. Austin). Required with state if zipCode is not provided.",
        },
        state: {
          type: Type.STRING,
          description:
            "US state: two-letter code (TX) or full name (Texas). Required with city if zipCode is not provided.",
        },
        zipCode: {
          type: Type.STRING,
          description:
            "5-digit US ZIP. If provided, search is narrowed to this ZIP (city/state optional).",
        },
        minPrice: {
          type: Type.NUMBER,
          description: "Optional minimum listing price filter",
        },
        maxPrice: {
          type: Type.NUMBER,
          description: "Optional maximum listing price filter",
        },
        bedrooms: {
          type: Type.NUMBER,
          description: "Optional minimum number of bedrooms",
        },
      },
      required: [],
    },
  },
];

export interface AffordabilityToolResult {
  formatted: AffordabilityResultData;
  raw: {
    maxHomePrice: number;
    maxLoanAmount: number;
    estimatedMonthlyPI: number;
  };
}

export function handleComputeAffordability(args: Record<string, unknown>): AffordabilityToolResult {
  const annualIncome = Number(args.annualIncome) || 0;
  const monthlyDebts = Number(args.monthlyDebts) || 0;
  const downPaymentValue = Number(args.downPaymentValue) || 0;
  const mode = args.downPaymentMode === "percent" ? "percent" : "dollar";

  const compute = computeAffordabilityEstimate({
    annualIncome,
    monthlyDebts,
    downPayment: {
      mode: mode as "percent" | "dollar",
      value: mode === "percent" ? Math.min(downPaymentValue, 100) : downPaymentValue,
    },
  });

  return {
    formatted: formatAffordabilityResultCard(compute),
    raw: {
      maxHomePrice: compute.maxHomePrice,
      maxLoanAmount: compute.maxLoanAmount,
      estimatedMonthlyPI: compute.estimatedMonthlyPI,
    },
  };
}

function buildPropertySummaryBlock(items: PropertyTileData[]): PropertySummaryData {
  const displayMode: "single" | "list" = items.length > 1 ? "list" : "single";
  return {
    statusTitle: "Property search complete",
    heading: items.length > 1 ? "Here are some properties I found" : "Here’s a home we found",
    imageAlt: "Property photo",
    displayMode,
    items,
  };
}

export async function handleSearchProperties(
  args: Record<string, unknown>,
): Promise<{ summary: PropertySummaryData; raw: PropertyListing[] }> {
  const items = filterListingsForSearch(args);
  return {
    summary: buildPropertySummaryBlock(items),
    raw: [],
  };
}
