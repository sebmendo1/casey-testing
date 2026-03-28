"use client";

import SparkleIcon from "./SparkleIcon";
import PropertyListingTile from "./PropertyListingTile";
import type { PropertySummaryData, PropertyTileData } from "@/lib/types";
import { SkeletonBox } from "./skeletons/SkeletonPrimitives";

interface PropertySummaryCardProps {
  data: PropertySummaryData | Record<string, unknown>;
  loading?: boolean;
}

function dedupeItemsByListingId(items: PropertyTileData[]): PropertyTileData[] {
  const seen = new Set<string>();
  const out: PropertyTileData[] = [];
  for (const item of items) {
    const id = String(item.listingId ?? "").trim() || item.address;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

function normalizePropertySummary(raw: PropertySummaryCardProps["data"]): PropertySummaryData {
  const d = raw as Record<string, unknown>;
  const itemsUnknown = d.items;
  if (Array.isArray(itemsUnknown) && itemsUnknown.length > 0) {
    const base = raw as PropertySummaryData;
    return { ...base, items: dedupeItemsByListingId(base.items) };
  }
  const price = d.price;
  const address = d.address;
  if (typeof price === "string" && typeof address === "string") {
    const tile: PropertyTileData = {
      listingId: String(d.listingId ?? address),
      price,
      address,
      beds: Number(d.beds) || 0,
      baths: Number(d.baths) || 0,
      sqft: Number(d.sqft) || 0,
    };
    return {
      statusTitle: String(d.statusTitle ?? ""),
      heading: String(d.heading ?? ""),
      imageAlt: String(d.imageAlt ?? "Property photo"),
      displayMode: "single",
      items: [tile],
    };
  }
  return {
    statusTitle: String(d.statusTitle ?? ""),
    heading: String(d.heading ?? ""),
    imageAlt: String(d.imageAlt ?? "Property photo"),
    items: [],
  };
}

export default function PropertySummaryCard({ data, loading }: PropertySummaryCardProps) {
  if (loading) {
    // Simplified skeleton for single property: no image placeholder, just text lines
    return (
      <div className="space-y-4">
        {/* Status line skeleton */}
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-[18px] w-[18px] rounded-full" />
          <SkeletonBox className="h-4 w-40" />
        </div>
        {/* Single property card skeleton - no image */}
        <div className="overflow-hidden rounded-[1.25rem] bg-white p-5 shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]">
          <div className="space-y-3">
            <SkeletonBox className="h-4 w-[70%]" />
            <SkeletonBox className="h-4 w-[50%]" />
            <SkeletonBox className="h-4 w-[60%]" />
            <SkeletonBox className="h-4 w-[45%]" />
          </div>
        </div>
      </div>
    );
  }

  const normalized = normalizePropertySummary(data);
  const { statusTitle, heading, items, displayMode } = normalized;
  const mode = displayMode ?? (items.length > 1 ? "list" : "single");

  return (
    <div className="space-y-4">
      {statusTitle ? (
        <div className="flex items-center gap-2">
          <SparkleIcon size={18} />
          <p className="text-[15px] font-semibold leading-tight text-[#002855]">{statusTitle}</p>
        </div>
      ) : null}
      {heading ? (
        <p className="text-[18px] font-semibold leading-[24px] text-[#002855]">{heading}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-[15px] text-[#00285599]">No active listings matched your search.</p>
      ) : mode === "list" ? (
        <ul className="space-y-3" aria-label="Property listings">
          {items.map((item, i) => (
            <li key={`${item.listingId}-${i}`}>
              <PropertyListingTile item={item} variant="compact" />
            </li>
          ))}
        </ul>
      ) : (
        <PropertyListingTile item={items[0]} variant="hero" />
      )}
    </div>
  );
}
