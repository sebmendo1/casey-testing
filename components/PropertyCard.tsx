"use client";

import type { PropertyCardData } from "@/lib/types";

interface PropertyCardProps {
  data: PropertyCardData;
}

export default function PropertyCard({ data }: PropertyCardProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)] opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
      <p className="font-semibold text-[#002855]">{data.address}</p>
      <p className="mt-1 text-xl font-bold text-[#002855]">{data.price}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#002855b3]">
        <span>{data.beds} beds</span>
        <span>•</span>
        <span>{data.baths} baths</span>
        {data.sqft && (
          <>
            <span>•</span>
            <span>{data.sqft} sq ft</span>
          </>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-[#002855cc]">
        Est. {data.estimatedMonthly}
      </p>
    </div>
  );
}
