"use client";

import type { CreditAuthorizationData } from "@/lib/types";

interface CreditAuthorizationCardProps {
  data: CreditAuthorizationData;
  onToggle?: (actionLabel: string) => void;
  onOpenAuthorize?: () => void;
}

function InlineCardIcon() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00285514]">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="#002855" strokeWidth="1.5" />
        <path d="M3 10h18" stroke="#002855" strokeWidth="1.5" />
        <circle cx="17" cy="14" r="2.5" fill="#002855" fillOpacity="0.35" />
      </svg>
    </span>
  );
}

export default function CreditAuthorizationCard({ data, onToggle, onOpenAuthorize }: CreditAuthorizationCardProps) {
  const isInline = data.variant === "inline";

  if (isInline) {
    return (
      <button
        type="button"
        data-no-row-select="true"
        onClick={(event) => {
          event.stopPropagation();
          onOpenAuthorize?.();
        }}
        className="flex w-full items-center gap-3 rounded-[1.25rem] border border-[#00285512] bg-[#f0f2f8] px-4 py-4 text-left shadow-[0_6px_18px_rgba(0,40,85,0.05),0_1px_4px_rgba(0,40,85,0.03)] transition-transform active:scale-[0.99]"
      >
        <InlineCardIcon />
        <span className="text-[16px] font-semibold leading-tight text-[#002855]">{data.actionLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      data-no-row-select="true"
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
      {data.detailsLinkText ? (
        <p className="mt-4 text-[16px] leading-[20px] text-[#002855cc] underline underline-offset-2">
          {data.detailsLinkText}
        </p>
      ) : null}
    </button>
  );
}
