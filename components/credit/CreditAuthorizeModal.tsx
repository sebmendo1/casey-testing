"use client";

import { useState, useEffect, useRef } from "react";

interface CreditAuthorizeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

function CardIcon() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00285514]">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="#002855" strokeWidth="1.5" />
        <path d="M3 10h18" stroke="#002855" strokeWidth="1.5" />
        <circle cx="17" cy="14" r="3" fill="var(--success-green)" />
        <path d="M15.5 14l1 1 2-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function CreditAuthorizeModal({ open, onClose, onSubmit }: CreditAuthorizeModalProps) {
  const [checked, setChecked] = useState(false);
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
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevActiveRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 sm:items-center sm:p-6"
      data-no-row-select="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credit-auth-title"
    >
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="overlay-panel-enter relative mx-auto w-full chat-shell rounded-t-[1.5rem] bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_-8px_40px_rgba(0,40,85,0.12)] outline-none sm:rounded-[1.5rem] sm:pb-8"
      >
        <CardIcon />
        <h2 id="credit-auth-title" className="mt-5 text-center text-[20px] font-semibold text-[color:var(--text-primary)]">
          Authorize soft credit check
        </h2>
        <div className="mt-5 space-y-4 text-[14px] leading-[1.55] text-[color:var(--text-secondary)]">
          <p>
            To provide you with the best home loan options, we need to perform a soft credit inquiry. This is a routine check
            that allows us to view your credit history to pre-qualify you for our services.
          </p>
          <p>
            Unlike a hard credit check, this process will not affect your credit score and will not be visible to other
            lenders. By proceeding, you are providing &apos;written instruction&apos; under the Fair Credit Reporting Act (FCRA)
            for Casey AI to obtain a copy of your credit report from one or more consumer reporting agencies.
          </p>
        </div>
        <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-xl border border-[#0028551f] bg-[#FAFBFF] p-4">
          <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => setChecked(!checked)}
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors ${
              checked ? "border-[color:var(--success-green)] bg-[color:var(--success-green)]" : "border-[#00285540] bg-white"
            }`}
          >
            {checked && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-[15px] font-semibold leading-snug text-[color:var(--text-primary)]">
            I authorize Casey to verify my credit,
          </span>
        </label>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            disabled={!checked}
            onClick={() => {
              onSubmit();
              setChecked(false);
            }}
            className="w-full rounded-full bg-[#002855] py-3.5 text-[16px] font-semibold text-white disabled:opacity-40"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-[#e8f0fe] py-3.5 text-[16px] font-semibold text-[#002855]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
