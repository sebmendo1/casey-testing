"use client";

import { useState } from "react";
import type { TrustCardData } from "@/lib/types";

interface TrustCardProps {
  data: TrustCardData;
}

export default function TrustCard({ data }: TrustCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border-l-4 border-[#002855] bg-white shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)] animate-scale-in">
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00285514]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#002855" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-bold text-[#002855]">{data.title}</span>
        </div>
        <p className="text-2xl font-bold text-[#002855]">{data.primaryValue}</p>
        <div className="my-3 border-t border-[#0028551f]" />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#00285599]">
            Why this number
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-[#002855]">
            {data.reasoning.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-2 text-sm text-[#002855cc] hover:underline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          How is this calculated?
        </button>
        {expanded && (
          <p className="mt-2 text-sm text-[#00285599]">
            We use standard debt-to-income ratios and current market rates. Your actual approval may vary based on credit, property type, and full documentation.
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className="w-full rounded-xl bg-[#002855] py-3 text-base font-semibold text-white shadow-[0_4px_10px_rgba(0,40,85,0.14)] transition-opacity active:opacity-90"
          >
            {data.primaryAction}
          </button>
          <button
            type="button"
            className="w-full rounded-xl border-2 border-[#002855] py-3 text-base font-semibold text-[#002855] transition-opacity active:opacity-90"
          >
            {data.secondaryAction}
          </button>
        </div>
        {data.finePrint && (
          <p className="mt-3 text-xs text-[#00285599]">{data.finePrint}</p>
        )}
      </div>
    </div>
  );
}
