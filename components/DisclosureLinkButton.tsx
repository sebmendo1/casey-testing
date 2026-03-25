"use client";

import type { ReactNode } from "react";

/** Styled-as-link button — avoids fake `href="#"` navigation and focus jumps. */
export default function DisclosureLinkButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`inline cursor-pointer border-0 bg-transparent p-0 font-inherit text-[#002855] underline underline-offset-2 decoration-[#002855]/40 transition-colors hover:text-[#002855] hover:decoration-[#002855] ${className}`}
    >
      {children}
    </button>
  );
}
