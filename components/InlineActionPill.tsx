"use client";

interface InlineActionPillProps {
  label: string;
  onClick: (label: string) => void;
}

export default function InlineActionPill({ label, onClick }: InlineActionPillProps) {
  return (
    <div className="mt-2 flex justify-end">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick(label);
        }}
        className="rounded-full border border-[#0028551f] bg-white px-4 py-2.5 text-[14px] font-semibold leading-snug text-[#002855] shadow-[0_5px_14px_rgba(0,40,85,0.06),0_1px_4px_rgba(0,40,85,0.03)] transition-transform active:scale-[0.98]"
      >
        {label}
      </button>
    </div>
  );
}
