"use client";

import type { CreditAuthorizationData } from "@/lib/types";

interface CreditAuthorizationCardProps {
  data: CreditAuthorizationData;
  onToggle?: (actionLabel: string) => void;
}

export default function CreditAuthorizationCard({ data, onToggle }: CreditAuthorizationCardProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle?.(data.actionLabel);
      }}
      className="w-full rounded-[1.35rem] bg-white px-4 py-4 text-left shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)] transition-transform active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-md border ${
            data.checked ? "border-[#002855] bg-[#002855] text-white" : "border-[#00285566] text-transparent"
          }`}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="text-[16px] font-semibold leading-[1.3] text-[#002855]">{data.label}</p>
      </div>
      <p className="mt-4 text-[16px] leading-[20px] text-[#002855cc] underline underline-offset-2">
        {data.detailsLinkText}
      </p>
    </button>
  );
}
