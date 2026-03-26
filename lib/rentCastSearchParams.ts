/**
 * RentCast `/listings/sale` query helpers.
 * @see https://developers.rentcast.io/reference/sale-listings
 * @see https://developers.rentcast.io/reference/search-queries
 */

import type { RentCastListing } from "./rentCastApi";

/** Lowercase full state name → 2-letter abbreviation */
const STATE_NAME_TO_ABBREV: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  "district of columbia": "DC",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

/** City is case-sensitive in RentCast; normalize to Title Case words. */
export function titleCaseCity(city: string): string {
  return city
    .trim()
    .split(/\s+/)
    .map((w) => {
      if (!w) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function normalizeStateAbbrev(state: string): string | null {
  const t = state.trim();
  if (!t) return null;
  if (/^[a-z]{2}$/i.test(t)) return t.toUpperCase();
  const key = t.toLowerCase();
  return STATE_NAME_TO_ABBREV[key] ?? null;
}

/** 5-digit US ZIP */
export function normalizeZip(zip: unknown): string | null {
  const digits = String(zip ?? "").replace(/\D/g, "");
  if (digits.length !== 5) return null;
  return digits;
}

/**
 * RentCast uses `price=min:max`, not priceMin/priceMax.
 * Omit side with `*` when only min or max is set.
 */
export function formatPriceRangeParam(
  minPrice: unknown,
  maxPrice: unknown,
): string | null {
  const min = minPrice != null && minPrice !== "" ? Number(minPrice) : NaN;
  const max = maxPrice != null && maxPrice !== "" ? Number(maxPrice) : NaN;
  const hasMin = Number.isFinite(min) && min >= 0;
  const hasMax = Number.isFinite(max) && max >= 0;
  if (!hasMin && !hasMax) return null;
  if (hasMin && hasMax) return `${Math.round(min)}:${Math.round(max)}`;
  if (hasMin) return `${Math.round(min)}:*`;
  if (hasMax) return `*:${Math.round(max)}`;
  return null;
}

/** Minimum bedrooms → `bedrooms=n:*` */
export function formatBedroomsMinParam(bedrooms: unknown): string | null {
  const n = Number(bedrooms);
  if (!Number.isFinite(n) || n < 0) return null;
  return `${Math.round(n)}:*`;
}

/** Parse JSON body: API returns a raw array; some proxies may wrap it. */
export function normalizeSaleListingsResponse(json: unknown): RentCastListing[] {
  if (Array.isArray(json)) return json as RentCastListing[];
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as RentCastListing[];
    if (Array.isArray(o.results)) return o.results as RentCastListing[];
    if (Array.isArray(o.listings)) return o.listings as RentCastListing[];
  }
  return [];
}

/** Short status line while RentCast search runs (chat streaming UI). */
export function formatPropertySearchThinkingLabel(args: Record<string, unknown>): string {
  const zip = normalizeZip(args.zipCode);
  const cityRaw = String(args.city ?? "").trim();
  const state = normalizeStateAbbrev(String(args.state ?? ""));
  if (zip) return `Searching properties in ZIP ${zip}…`;
  if (cityRaw && state) return `Searching properties in ${titleCaseCity(cityRaw)}, ${state}…`;
  return "Searching properties…";
}
