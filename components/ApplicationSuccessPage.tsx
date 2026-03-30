"use client";

interface ApplicationSuccessPageProps {
  open: boolean;
  onClose: () => void;
}

function SuccessCheckIcon() {
  return (
    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#E8F5E9]">
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden
      >
        <circle cx="28" cy="28" r="24" fill="#4CAF50" fillOpacity="0.15" />
        <path
          d="M17 28l7 7 15-15"
          stroke="#4CAF50"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function ApplicationSuccessPage({
  open,
  onClose,
}: ApplicationSuccessPageProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#FAFBFF]" data-no-row-select="true">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <SuccessCheckIcon />

        <h1 className="mt-8 text-center text-[28px] font-bold leading-tight text-[#002855]">
          Congratulations!
        </h1>

        <p className="mt-4 text-center text-[17px] leading-relaxed text-[#002855]">
          Your mortgage application has been submitted successfully.
        </p>

        <p className="mt-6 max-w-sm text-center text-[15px] leading-relaxed text-[#00285599]">
          You&apos;ll receive a confirmation email shortly with next steps. A mortgage specialist will reach out within 1-2 business days.
        </p>
      </div>

      {/* Fixed bottom button */}
      <div className="px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#002855] py-4 text-[16px] font-semibold text-white shadow-[0_4px_14px_rgba(0,40,85,0.2)] transition-colors hover:bg-[#001f40] active:bg-[#001530]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
