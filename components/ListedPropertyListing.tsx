"use client";

import Link from "next/link";
import type { PropertyTileData } from "@/lib/types";

/** Human-friendly bath count (e.g. 2.5 stays 2.5, 2 stays 2). */
export function formatBathroomsDisplay(baths: number): string {
  if (!Number.isFinite(baths)) return "0";
  if (Number.isInteger(baths)) return String(baths);
  return baths.toFixed(1).replace(/\.0$/, "");
}

function listingHref(id: string) {
  return `/listing/${encodeURIComponent(id)}`;
}

function specsPipeLine(item: PropertyTileData): string {
  return `${item.beds} beds | ${formatBathroomsDisplay(item.baths)} baths | ${item.sqft.toLocaleString()} sqft`;
}

interface ListedPropertyListingProps {
  item: PropertyTileData;
}

/**
 * Horizontal mock-aligned row: square thumbnail, then price → specs (pipes) → address.
 * Matches multi-property search list design.
 */
export default function ListedPropertyListing({ item }: ListedPropertyListingProps) {
  const href = listingHref(item.rentCastId);

  return (
    <Link
      href={href}
      className="flex gap-4 rounded-[1.75rem] bg-white p-4 shadow-[0_6px_20px_rgba(0,40,85,0.08),0_1px_4px_rgba(0,40,85,0.04)] transition hover:shadow-[0_8px_24px_rgba(0,40,85,0.1)]"
    >
      <div className="flex size-[96px] shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#002855_0%,#00285599_45%,#00285514_100%)]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="text-[22px] font-semibold leading-tight text-[#002855]">{item.price}</p>
        <p className="text-[14px] leading-[1.35] text-[#00285599]">{specsPipeLine(item)}</p>
        <p className="line-clamp-2 text-[14px] leading-snug text-[#00285599]">{item.address}</p>
      </div>
    </Link>
  );
}
