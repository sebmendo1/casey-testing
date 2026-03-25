"use client";

import { useEffect, useRef } from "react";

interface CreditSuccessSheetProps {
  open: boolean;
  onContinue: () => void;
}

export default function CreditSuccessSheet({ open, onContinue }: CreditSuccessSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevActiveRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusPanel = () => {
      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusable ?? root).focus();
    };
    queueMicrotask(focusPanel);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onContinue();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevActiveRef.current?.focus?.();
    };
  }, [open, onContinue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 sm:items-center sm:p-6"
      data-no-row-select="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credit-success-title"
    >
      <button type="button" tabIndex={-1} className="absolute inset-0 cursor-default" onClick={onContinue} aria-label="Dismiss" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="overlay-panel-enter relative mx-auto w-full chat-shell rounded-t-[1.5rem] bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 shadow-[0_-8px_40px_rgba(0,40,85,0.12)] outline-none sm:rounded-[1.5rem] sm:pb-8"
      >
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "color-mix(in srgb, var(--success-green) 15%, transparent)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 13l4 4L19 7"
              stroke="var(--success-green)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 id="credit-success-title" className="mt-5 text-center text-[20px] font-semibold text-[color:var(--text-primary)]">
          Soft credit check authorized
        </h2>
        <p className="mt-4 text-center text-[14px] leading-[1.55] text-[color:var(--text-muted)]">
          We&apos;ll inform you of your results through email as soon as we complete your application
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-8 w-full rounded-full bg-[#002855] py-3.5 text-[16px] font-semibold text-white"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
