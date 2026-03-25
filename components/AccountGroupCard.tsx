"use client";

import type { AccountGroupData } from "@/lib/types";

interface AccountGroupCardProps {
  data: AccountGroupData;
}

export default function AccountGroupCard({ data }: AccountGroupCardProps) {
  return (
    <div className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00285514] text-[#002855]" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 7H20M4 12H20M4 17H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <p className="text-[18px] font-semibold leading-tight text-[#002855]">{data.institution}</p>
      </div>
      <div className="px-4 pb-4">
        {data.rows.map((row, index) => (
          <div key={row.name}>
            <div className="flex items-center justify-between py-3">
              <p className="text-[16px] leading-[20px] text-[#002855cc]">{row.name}</p>
              <p className="text-[16px] leading-[20px] text-[#002855cc]">{row.value}</p>
            </div>
            {index !== data.rows.length - 1 && <div className="h-px w-full bg-[#0028551f]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
