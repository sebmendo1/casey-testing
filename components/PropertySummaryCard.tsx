"use client";

import SparkleIcon from "./SparkleIcon";
import type { PropertySummaryData } from "@/lib/types";

interface PropertySummaryCardProps {
  data: PropertySummaryData;
}

export default function PropertySummaryCard({ data }: PropertySummaryCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SparkleIcon size={18} />
        <p className="text-[15px] font-semibold leading-tight text-[#002855]">{data.statusTitle}</p>
      </div>
      <p className="text-[18px] font-semibold leading-[24px] text-[#002855]">{data.heading}</p>

      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]">
        <div
          className="h-[230px] w-full bg-[linear-gradient(160deg,#002855_0%,#00285599_45%,#00285514_100%)]"
          role="img"
          aria-label={data.imageAlt}
        />
        <div className="space-y-3 p-4">
          <p className="text-[46px] font-semibold leading-tight text-[#002855]">{data.price}</p>
          <p className="text-[18px] leading-[24px] text-[#002855]">{data.address}</p>
          <p className="text-[16px] leading-[20px] text-[#002855b3]">
            {data.beds} beds | {data.baths} baths | {data.sqft} sqft
          </p>
        </div>
      </div>
    </div>
  );
}
