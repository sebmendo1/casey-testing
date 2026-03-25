"use client";

/** iOS-style status bar chrome for native app feel */
export default function StatusBar() {
  return (
    <div
      className="flex shrink-0 items-center justify-between px-6 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-[15px] font-semibold tracking-tight text-[#002855]"
      aria-hidden
    >
      <span className="tabular-nums">9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-0.5 pb-0.5">
          <span className="h-1 w-0.5 rounded-sm bg-[#002855]" />
          <span className="h-1.5 w-0.5 rounded-sm bg-[#002855]" />
          <span className="h-2 w-0.5 rounded-sm bg-[#002855]" />
          <span className="h-2.5 w-0.5 rounded-sm bg-[#002855]" />
        </div>
        <svg width="16" height="12" viewBox="0 0 24 24" fill="none" className="text-[#002855]">
          <path
            d="M12 3L20 8V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V8L12 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex items-center gap-0.5 rounded border-[1.5px] border-[#002855] px-1 py-0.5">
          <div className="h-2 w-4 rounded-[1px] bg-[#002855]" />
        </div>
      </div>
    </div>
  );
}
