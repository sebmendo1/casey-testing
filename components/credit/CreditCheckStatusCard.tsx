"use client";

import type { CreditStatusData } from "@/lib/types";

export default function CreditCheckStatusCard({ data }: { data: CreditStatusData }) {
  return (
    <div className="rounded-[1.25rem] border border-[#00285514] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(0,40,85,0.06),0_1px_4px_rgba(0,40,85,0.04)]">
      <p className="text-[16px] font-semibold text-[#002855]">{data.title}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#28a74526]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 13l4 4L19 7"
              stroke="#28a745"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-[15px] font-semibold text-[#28a745]">{data.statusLabel}</span>
      </div>
      <p className="mt-2 text-[14px] leading-snug text-[#00285599]">{data.subtext}</p>
    </div>
  );
}
