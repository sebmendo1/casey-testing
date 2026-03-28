"use client";

import Link from "next/link";
import ListedPropertyListing, { formatBathroomsDisplay } from "./ListedPropertyListing";
import type { PropertyTileData } from "@/lib/types";
import { SkeletonBox, SkeletonText } from "./skeletons/SkeletonPrimitives";

interface PropertyListingTileProps {
  item: PropertyTileData;
  variant: "hero" | "compact";
  loading?: boolean;
}

function listingHref(id: string) {
  return `/listing/${encodeURIComponent(id)}`;
}

export default function PropertyListingTile({ item, variant, loading }: PropertyListingTileProps) {
  if (loading) {
    if (variant === "compact") {
      return (
        <div className="flex gap-4 rounded-[1.75rem] bg-white p-4 shadow-[0_6px_20px_rgba(0,40,85,0.08),0_1px_4px_rgba(0,40,85,0.04)]">
          <SkeletonBox className="size-[96px] shrink-0 rounded-2xl" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
            <SkeletonBox className="h-6 w-24" />
            <SkeletonText lines={2} widths={["w-3/4", "w-full"]} />
          </div>
        </div>
      );
    }
    // Hero skeleton: simple text lines, no image placeholder
    return (
      <div className="overflow-hidden rounded-[1.25rem] bg-white p-5 shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]">
        <div className="space-y-3">
          <SkeletonBox className="h-4 w-[70%]" />
          <SkeletonBox className="h-4 w-[50%]" />
          <SkeletonBox className="h-4 w-[60%]" />
          <SkeletonBox className="h-4 w-[45%]" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return <ListedPropertyListing item={item} />;
  }

  // Specs line: beds | baths | sqft
  const specsLine = `${item.beds} beds  |  ${formatBathroomsDisplay(item.baths)} baths  |  ${item.sqft.toLocaleString()} sqft`;

  const href = item.listingId ? listingHref(item.listingId) : null;

  const cardContent = (
    <>
      {/* Hero image - full width, rounded top corners */}
      <div className="aspect-[4/3] w-full overflow-hidden rounded-t-[1.25rem] bg-[linear-gradient(160deg,#002855_0%,#00285599_45%,#00285514_100%)]">
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

      {/* Content area */}
      <div className="px-5 py-4">
        {/* Price - large bold */}
        <p className="text-[28px] font-bold text-[#002855]">{item.price}</p>
        {/* Address */}
        <p className="mt-1 text-[15px] text-[#002855]">{item.address}</p>
        {/* Specs line - muted */}
        <p className="mt-1 text-[14px] text-[#00285599]">{specsLine}</p>
      </div>
    </>
  );

  return href ? (
    <Link
      href={href}
      className="block overflow-hidden rounded-[1.25rem] bg-white shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]"
    >
      {cardContent}
    </Link>
  ) : (
    <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]">
      {cardContent}
    </div>
  );
}
