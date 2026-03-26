"use client";

import SparkleIcon from "./SparkleIcon";
import PropertyListingTile from "./PropertyListingTile";
import type { PropertySummaryData, PropertyTileData } from "@/lib/types";

interface PropertySummaryCardProps {
  data: PropertySummaryData | Record<string, unknown>;
}

function normalizePropertySummary(raw: PropertySummaryCardProps["data"]): PropertySummaryData {
  const d = raw as Record<string, unknown>;
  const itemsUnknown = d.items;
  if (Array.isArray(itemsUnknown) && itemsUnknown.length > 0) {
    return raw as PropertySummaryData;
  }
  const price = d.price;
  const address = d.address;
  if (typeof price === "string" && typeof address === "string") {
    const tile: PropertyTileData = {
      rentCastId: String(d.rentCastId ?? address),
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

export default function PropertySummaryCard({ data }: PropertySummaryCardProps) {
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
            <li key={`${item.rentCastId}-${i}`}>
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
