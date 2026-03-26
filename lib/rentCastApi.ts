/**
 * RentCast property listing helpers.
 *
 * Photo URLs: The public Property Listings schema documents address, specs, MLS, etc.,
 * but does not guarantee image fields. Real API responses may include `photos`, `images`,
 * or similar — we normalize any string URLs we find. When none exist, UI uses a placeholder.
 */

export interface RentCastHoa {
  fee?: number;
}

export interface RentCastAgent {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface RentCastOffice {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
}

/** Raw sale listing from RentCast search or GET /listings/sale/{id} */
export interface RentCastListing {
  id?: string;
  formattedAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  daysOnMarket?: number;
  mlsNumber?: string;
  hoa?: RentCastHoa;
  listingAgent?: RentCastAgent;
  listingOffice?: RentCastOffice;
  /** Not in published schema but may appear in responses */
  photos?: unknown;
  images?: unknown;
  imageUrls?: unknown;
  media?: unknown;
  [key: string]: unknown;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0 && /^https?:\/\//i.test(v.trim());
}

function pushUrl(out: string[], v: unknown) {
  if (isNonEmptyString(v)) out.push(v.trim());
}

function walkForUrls(value: unknown, out: string[], depth: number) {
  if (depth > 8) return;
  if (value == null) return;
  if (isNonEmptyString(value)) {
    pushUrl(out, value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isNonEmptyString(item)) pushUrl(out, item);
      else if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        pushUrl(out, o.url);
        pushUrl(out, o.href);
        pushUrl(out, o.src);
        walkForUrls(o, out, depth + 1);
      }
    }
    return;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      walkForUrls(v, out, depth + 1);
    }
  }
}

/** Collect image URLs from a listing object (flexible keys). */
export function extractListingImageUrls(listing: unknown): string[] {
  if (!listing || typeof listing !== "object") return [];
  const r = listing as Record<string, unknown>;
  const out: string[] = [];
  const keys = ["photos", "images", "imageUrls", "media", "listingPhotos", "propertyPhotos"];
  for (const k of keys) {
    walkForUrls(r[k], out, 0);
  }
  return [...new Set(out)];
}

export function mergeListingRecords(
  searchRow: RentCastListing,
  detail?: RentCastListing | null,
): RentCastListing {
  if (!detail) return { ...searchRow };
  return {
    ...searchRow,
    ...detail,
    id: detail.id ?? searchRow.id,
  };
}

export type FetchSaleListingResult =
  | { ok: true; listing: RentCastListing }
  | { ok: false; status: number };

export async function fetchSaleListingResult(
  apiKey: string,
  id: string,
): Promise<FetchSaleListingResult> {
  const path = encodeURIComponent(id);
  const url = `https://api.rentcast.io/v1/listings/sale/${path}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey, Accept: "application/json" },
  });
  if (res.status === 404) {
    return { ok: false, status: 404 };
  }
  if (!res.ok) {
    console.error(`RentCast detail ${res.status}: ${await res.text()}`);
    return { ok: false, status: res.status };
  }
  const listing = (await res.json()) as RentCastListing;
  return { ok: true, listing };
}

/** For search enrichment: ignore 404/502, return merged row only on success. */
export async function fetchSaleListingById(
  apiKey: string,
  id: string,
): Promise<RentCastListing | null> {
  const result = await fetchSaleListingResult(apiKey, id);
  return result.ok ? result.listing : null;
}

/** Bounded parallel map for detail fetches */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
