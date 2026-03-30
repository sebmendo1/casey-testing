"use client";

import type { ApplicationSummaryData } from "@/lib/types";
import { SkeletonBox } from "./skeletons/SkeletonPrimitives";

interface ApplicationSummaryCardProps {
  data: ApplicationSummaryData;
  loading?: boolean;
  onConfirm?: () => void;
}

export default function ApplicationSummaryCard({ data, loading, onConfirm }: ApplicationSummaryCardProps) {
  if (loading) {
    return (
      <div className="rounded-[1.35rem] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]">
        <SkeletonBox className="h-5 w-40" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start justify-between gap-3 border-b border-[#0028551f] pb-2 last:border-0 last:pb-0">
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.35rem] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]">
      <p className="text-[18px] font-semibold leading-tight text-[#002855]">{data.title}</p>
      <div className="mt-4 space-y-3">
        {data.fields.map((field) => (
          <div key={field.label} className="flex items-start justify-between gap-3 border-b border-[#0028551f] pb-2 last:border-0 last:pb-0">
            <p className="text-[13px] font-medium uppercase tracking-wide text-[#00285599]">{field.label}</p>
            <p className="max-w-[60%] text-right text-[15px] leading-snug text-[#002855]">{field.value}</p>
          </div>
        ))}
      </div>
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="mt-6 w-full rounded-xl bg-[#0052FF] py-3.5 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0047E0] active:bg-[#003DBF]"
        >
          Confirm and submit
        </button>
      )}
    </div>
  );
}
