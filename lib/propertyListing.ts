/**
 * Normalized listing shape for UI + API (backed by bundled Zillow-style rows).
 * Image fields may appear under several keys — see extractListingImageUrls.
 */

export interface PropertyListingHoa {
  fee?: number;
}

export interface PropertyListingAgent {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface PropertyListingOffice {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface PropertyListing {
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
  hoa?: PropertyListingHoa;
  listingAgent?: PropertyListingAgent;
  listingOffice?: PropertyListingOffice;
  listingUrl?: string;
  description?: string;
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
