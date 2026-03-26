"use client";

import Link from "next/link";
import ListedPropertyListing, { formatBathroomsDisplay } from "./ListedPropertyListing";
import type { PropertyTileData } from "@/lib/types";

interface PropertyListingTileProps {
  item: PropertyTileData;
  variant: "hero" | "compact";
}

function listingHref(id: string) {
  return `/listing/${encodeURIComponent(id)}`;
}

export default function PropertyListingTile({ item, variant }: PropertyListingTileProps) {
  if (variant === "compact") {
    return <ListedPropertyListing item={item} />;
  }

  const specLine = [
    `${item.beds} beds | ${formatBathroomsDisplay(item.baths)} baths | ${item.sqft.toLocaleString()} sqft`,
    item.yearBuilt != null ? `Built ${item.yearBuilt}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const thumb = (
    <div className="h-[230px] w-full shrink-0 overflow-hidden bg-[linear-gradient(160deg,#002855_0%,#00285599_45%,#00285514_100%)]">
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
  );

  const body = (
    <div className="space-y-1">
      <p className="text-[46px] font-semibold leading-tight text-[#002855]">{item.price}</p>
      <p className="text-[16px] leading-5 text-[#00285599]">{specLine}</p>
      <p className="text-[18px] leading-[24px] text-[#002855]">{item.address}</p>
      {item.rentCastId ? (
        <p className="mt-3 text-[15px] font-semibold text-[#0052cc]">View full listing →</p>
      ) : null}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]">
      {item.rentCastId ? (
        <Link href={listingHref(item.rentCastId)} className="block">
          {thumb}
        </Link>
      ) : (
        thumb
      )}
      <div className="space-y-1 p-4">
        {item.rentCastId ? (
          <Link href={listingHref(item.rentCastId)} className="block">
            {body}
          </Link>
        ) : (
          body
        )}
      </div>
    </div>
  );
}
