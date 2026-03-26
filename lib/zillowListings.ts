import type { PropertyListing } from "./propertyListing";
import type { PropertyTileData } from "./types";
import {
  normalizeSearchPropertiesArgs,
  resolveSearchLocationArgs,
  titleCaseCity,
} from "./propertySearchParams";
import zillowData from "../data/zillowListings.json";

/**
 * Bundled rows aligned with [Zillow sample dataset](https://github.com/luminati-io/Zillow-dataset-samples)
 * fields (zpid, url, streetAddress, city, state, zipcode, price, livingArea, lotSize, latitude, longitude, homeType, homeStatus, …).
 */
export interface ZillowListingRow {
  zpid: string;
  url?: string;
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
  price: number;
  homeStatus?: string;
  homeType?: string;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  lotSize?: number;
  yearBuilt?: number;
  daysOnMarket?: number;
  latitude?: number;
  longitude?: number;
  mlsNumber?: string;
  hoaFeeMonthly?: number;
  imageUrl?: string;
  imageUrls?: string[];
  description?: string;
}

const listings = zillowData as ZillowListingRow[];

export function getZillowListings(): ZillowListingRow[] {
  return listings;
}

export function getListingByZpid(zpid: string): ZillowListingRow | undefined {
  const t = zpid.trim();
  return listings.find((r) => r.zpid === t);
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function zillowRowToPropertyListing(row: ZillowListingRow): PropertyListing {
  const photos =
    row.imageUrls?.length ? row.imageUrls : row.imageUrl ? [row.imageUrl] : undefined;
  const formattedAddress = `${row.streetAddress}, ${row.city}, ${row.state} ${row.zipcode}`;
  return {
    id: row.zpid,
    formattedAddress,
    addressLine1: row.streetAddress,
    city: row.city,
    state: row.state,
    zipCode: row.zipcode,
    price: row.price,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    squareFootage: row.livingArea,
    lotSize: row.lotSize,
    yearBuilt: row.yearBuilt,
    propertyType: row.homeType,
    daysOnMarket: row.daysOnMarket,
    mlsNumber: row.mlsNumber,
    latitude: row.latitude,
    longitude: row.longitude,
    hoa: row.hoaFeeMonthly != null ? { fee: row.hoaFeeMonthly } : undefined,
    listingUrl: row.url,
    description: row.description,
    photos,
  };
}

export function zillowRowToTile(row: ZillowListingRow): PropertyTileData {
  const address = `${row.streetAddress}, ${row.city}, ${row.state} ${row.zipcode}`;
  const urls = row.imageUrls?.length ? row.imageUrls : row.imageUrl ? [row.imageUrl] : [];
  return {
    listingId: row.zpid,
    price: formatUsd(row.price),
    address,
    beds: row.bedrooms ?? 0,
    baths: row.bathrooms ?? 0,
    sqft: row.livingArea ?? 0,
    imageUrl: urls[0],
    imageUrls: urls.length ? urls : undefined,
    yearBuilt: row.yearBuilt,
    lotSizeSqft: row.lotSize,
    propertyType: row.homeType,
    daysOnMarket: row.daysOnMarket,
    hoaFeeMonthly: row.hoaFeeMonthly,
    mlsNumber: row.mlsNumber,
    latitude: row.latitude,
    longitude: row.longitude,
    listingUrl: row.url,
  };
}

export function filterListingsForSearch(args: Record<string, unknown>): PropertyTileData[] {
  const raw = normalizeSearchPropertiesArgs(args);
  const { zip, city: cityRaw, state: stateAbbrev } = resolveSearchLocationArgs(args);

  let rows = [...listings];

  if (zip) {
    rows = rows.filter((r) => r.zipcode === zip);
  } else if (cityRaw && stateAbbrev) {
    const cityNorm = titleCaseCity(cityRaw);
    rows = rows.filter(
      (r) => r.city.toLowerCase() === cityNorm.toLowerCase() && r.state === stateAbbrev,
    );
  } else {
    return [];
  }

  const minP = raw.minPrice != null && raw.minPrice !== "" ? Number(raw.minPrice) : NaN;
  const maxP = raw.maxPrice != null && raw.maxPrice !== "" ? Number(raw.maxPrice) : NaN;
  if (Number.isFinite(minP)) {
    rows = rows.filter((r) => r.price >= minP);
  }
  if (Number.isFinite(maxP)) {
    rows = rows.filter((r) => r.price <= maxP);
  }

  const minBeds = raw.bedrooms != null && raw.bedrooms !== "" ? Number(raw.bedrooms) : NaN;
  if (Number.isFinite(minBeds) && minBeds >= 0) {
    rows = rows.filter((r) => (r.bedrooms ?? 0) >= minBeds);
  }

  return rows.slice(0, 5).map(zillowRowToTile);
}
