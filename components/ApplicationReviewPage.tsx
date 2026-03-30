"use client";

import type { HomebuyingSession } from "@/lib/types";
import { buildApplicationSummary } from "@/lib/conversations";

interface ApplicationReviewPageProps {
  open: boolean;
  session: HomebuyingSession;
  onBack: () => void;
  onSubmit: () => void;
}

export default function ApplicationReviewPage({
  open,
  session,
  onBack,
  onSubmit,
}: ApplicationReviewPageProps) {
  if (!open) return null;

  const fields = buildApplicationSummary(session);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#FAFBFF]" data-no-row-select="true">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[15px] font-medium text-[#00285599] hover:text-[#002855]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <h1 className="text-[17px] font-semibold text-[#002855]">Review Application</h1>
        <div className="w-[52px]" aria-hidden />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="mx-auto max-w-lg">
          <p className="mb-6 text-center text-[15px] leading-relaxed text-[#00285599]">
            Please review all the information below before submitting your mortgage application.
          </p>

          {/* Application details card */}
          <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]">
            <p className="mb-4 text-[18px] font-semibold text-[#002855]">Application Details</p>
            <div className="space-y-3">
              {fields.map((field) => (
                <div
                  key={field.label}
                  className="flex items-start justify-between gap-3 border-b border-[#0028551f] pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-[13px] font-medium uppercase tracking-wide text-[#00285599]">
                    {field.label}
                  </p>
                  <p className="max-w-[60%] text-right text-[15px] leading-snug text-[#002855]">
                    {field.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-center text-[12px] leading-[1.6] text-[#00285599]">
            By submitting, you agree to Casey Bank&apos;s mortgage terms and authorize us to process your application.
          </p>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[#FAFBFF] via-[#FAFBFF] to-transparent px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={onSubmit}
            className="w-full rounded-xl bg-[#0052FF] py-4 text-[16px] font-semibold text-white shadow-[0_4px_14px_rgba(0,82,255,0.25)] transition-colors hover:bg-[#0047E0] active:bg-[#003DBF]"
          >
            Submit my mortgage application
          </button>
        </div>
      </div>
    </div>
  );
}
