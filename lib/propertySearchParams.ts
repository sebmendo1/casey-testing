/**
 * Helpers for search_properties tool args and location parsing.
 */

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

/** Normalize city to Title Case words for matching bundled data. */
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

/** 5-digit US ZIP (first five digits if ZIP+4). */
export function normalizeZip(zip: unknown): string | null {
  const digits = String(zip ?? "").replace(/\D/g, "");
  if (digits.length < 5) return null;
  return digits.slice(0, 5);
}

/** First 5-digit ZIP found in free text (e.g. city line "Frisco 75036"). */
export function extractFiveDigitZipFromString(s: string): string | null {
  const m = s.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

/**
 * Gemini may emit camelCase or snake_case. Merge aliases for search_properties args.
 */
export function normalizeSearchPropertiesArgs(
  args: Record<string, unknown>,
): Record<string, unknown> {
  return {
    city: args.city ?? args.city_name,
    state: args.state,
    zipCode: args.zipCode ?? args.zip_code,
    minPrice: args.minPrice ?? args.min_price,
    maxPrice: args.maxPrice ?? args.max_price,
    bedrooms: args.bedrooms,
  };
}

/**
 * Parse "City, TX" / "City, Texas" / trailing "City TX" when state is missing.
 */
export function splitCityStateFromCombined(cityLine: string): { city: string; state: string | null } {
  const t = cityLine.trim();
  if (!t) return { city: "", state: null };
  const comma = t.match(/^(.+?),\s*(.+)$/);
  if (comma) {
    const st = normalizeStateAbbrev(comma[2].trim());
    if (st) return { city: comma[1].trim(), state: st };
  }
  const tail = t.match(/^(.+?)\s+([A-Z]{2})$/i);
  if (tail) {
    const st = normalizeStateAbbrev(tail[2]);
    if (st) return { city: tail[1].trim(), state: st };
  }
  return { city: t, state: null };
}

/** Resolved location (zip XOR city + state). */
export function resolveSearchLocationArgs(args: Record<string, unknown>): {
  zip: string | null;
  city: string;
  state: string | null;
} {
  const raw = normalizeSearchPropertiesArgs(args);
  let city = String(raw.city ?? "").trim();
  let state = normalizeStateAbbrev(String(raw.state ?? ""));
  let zip = normalizeZip(raw.zipCode);

  if (!zip) {
    const z = extractFiveDigitZipFromString(city);
    if (z) {
      zip = z;
      city = city.replace(/\b\d{5}\b/, "").replace(/,\s*$/, "").trim();
    }
  }

  if (!state && city) {
    const split = splitCityStateFromCombined(city);
    city = split.city;
    if (split.state) state = split.state;
  }

  return { zip, city, state };
}

/** Short status line while property search runs (chat streaming UI). */
export function formatPropertySearchThinkingLabel(args: Record<string, unknown>): string {
  const { zip, city, state } = resolveSearchLocationArgs(args);
  if (zip) return `Searching properties in ZIP ${zip}…`;
  if (city && state) return `Searching properties in ${titleCaseCity(city)}, ${state}…`;
  return "Searching properties…";
}
