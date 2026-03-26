"use client";

import type { AffordabilityResultData } from "@/lib/types";

export default function AffordabilityResultCard({ data }: { data: AffordabilityResultData }) {
  return (
    <div
      className="rounded-[1.25rem] border border-[#00285512] bg-white px-5 py-5 shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]"
      data-no-row-select="true"
    >
      <p className="text-[13px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">{data.headline}</p>
      <p className="mt-2 text-[28px] font-bold leading-tight text-[color:var(--text-primary)]">{data.maxHomePriceLabel}</p>
      <p className="mt-1 text-[14px] text-[color:var(--text-secondary)]">Estimated max home price</p>
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#0028550f] pt-4">
        <div>
          <p className="text-[12px] font-medium text-[color:var(--text-muted)]">Est. monthly P&amp;I</p>
          <p className="mt-0.5 text-[16px] font-semibold text-[color:var(--text-primary)]">{data.monthlyPaymentLabel}</p>
        </div>
        <div>
          <p className="text-[12px] font-medium text-[color:var(--text-muted)]">Est. max loan</p>
          <p className="mt-0.5 text-[16px] font-semibold text-[color:var(--text-primary)]">{data.maxLoanLabel}</p>
        </div>
      </div>
      <p className="mt-4 text-[12px] leading-[1.55] text-[color:var(--text-muted)]">{data.disclaimer}</p>
    </div>
  );
}
