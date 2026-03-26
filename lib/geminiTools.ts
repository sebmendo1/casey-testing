import { Type, type FunctionDeclaration } from "@google/genai";
import type { AffordabilityResultData, PropertySummaryData, PropertyTileData } from "./types";
import {
  computeAffordabilityEstimate,
  formatAffordabilityResultCard,
} from "./affordabilityCalculator";
import {
  type RentCastListing,
  extractListingImageUrls,
  fetchSaleListingById,
  mapWithConcurrency,
  mergeListingRecords,
} from "./rentCastApi";
import {
  formatBedroomsMinParam,
  formatPriceRangeParam,
  normalizeSaleListingsResponse,
  normalizeStateAbbrev,
  normalizeZip,
  titleCaseCity,
} from "./rentCastSearchParams";

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
      "Search for homes currently listed for sale. Pass EITHER a 5-digit US zipCode OR both city and state (state can be two-letter code OR full name like Texas). RentCast city names are case-sensitive—use normal capitalization (e.g. Austin, San Antonio). Returns up to 5 listings with specs and ids.",
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

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function listingToTile(listing: RentCastListing): PropertyTileData {
  const address =
    listing.formattedAddress ??
    [listing.addressLine1, listing.city, listing.state, listing.zipCode]
      .filter(Boolean)
      .join(", ");

  const urls = extractListingImageUrls(listing);
  const id = String(listing.id ?? "").trim() || address;

  return {
    rentCastId: id,
    price: listing.price ? formatUsd(listing.price) : "Price not listed",
    address,
    beds: listing.bedrooms ?? 0,
    baths: listing.bathrooms ?? 0,
    sqft: listing.squareFootage ?? 0,
    imageUrl: urls[0],
    imageUrls: urls.length ? urls : undefined,
    yearBuilt: listing.yearBuilt,
    lotSizeSqft: listing.lotSize,
    propertyType: listing.propertyType,
    daysOnMarket: listing.daysOnMarket,
    hoaFeeMonthly: listing.hoa?.fee,
    mlsNumber: listing.mlsNumber,
    latitude: listing.latitude,
    longitude: listing.longitude,
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
): Promise<{ summary: PropertySummaryData; raw: RentCastListing[] }> {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return {
      summary: buildPropertySummaryBlock([]),
      raw: [],
    };
  }

  const zip = normalizeZip(args.zipCode);
  const cityRaw = String(args.city ?? "").trim();
  const stateAbbrev = normalizeStateAbbrev(String(args.state ?? ""));

  const params = new URLSearchParams();
  params.set("status", "Active");
  params.set("limit", "5");

  if (zip) {
    params.set("zipCode", zip);
  } else if (cityRaw && stateAbbrev) {
    params.set("city", titleCaseCity(cityRaw));
    params.set("state", stateAbbrev);
  } else {
    console.error("RentCast search: need a valid 5-digit zipCode or city + state", {
      city: cityRaw,
      state: args.state,
      zipCode: args.zipCode,
    });
    return {
      summary: buildPropertySummaryBlock([]),
      raw: [],
    };
  }

  const priceRange = formatPriceRangeParam(args.minPrice, args.maxPrice);
  if (priceRange) params.set("price", priceRange);

  const bedroomsRange = formatBedroomsMinParam(args.bedrooms);
  if (bedroomsRange) params.set("bedrooms", bedroomsRange);

  const url = `https://api.rentcast.io/v1/listings/sale?${params.toString()}`;

  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey, Accept: "application/json" },
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`RentCast error ${res.status}: ${errBody}`);
    return {
      summary: buildPropertySummaryBlock([]),
      raw: [],
    };
  }

  const rawJson: unknown = await res.json();
  const data = normalizeSaleListingsResponse(rawJson);
  const slice = data.slice(0, 5);

  const enriched = await mapWithConcurrency(slice, 3, async (row) => {
    const id = row.id?.trim();
    if (!id) return mergeListingRecords(row, null);
    const detail = await fetchSaleListingById(apiKey, id);
    return mergeListingRecords(row, detail);
  });

  const items = enriched.map(listingToTile);
  return {
    summary: buildPropertySummaryBlock(items),
    raw: enriched,
  };
}
