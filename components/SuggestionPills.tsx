"use client";

interface SuggestionPillsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export default function SuggestionPills({ suggestions, onSelect }: SuggestionPillsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      className="mt-4 flex flex-col items-end gap-2 opacity-0 animate-fade-in"
      style={{ animationDelay: "200ms" }}
    >
      {suggestions.map((text) => (
        <button
          key={text}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(text);
          }}
          className="max-w-[90%] rounded-full border border-[#0028551f] bg-white px-4 py-2.5 text-left text-[14px] font-semibold leading-snug text-[#002855] shadow-[0_5px_14px_rgba(0,40,85,0.06),0_1px_4px_rgba(0,40,85,0.03)] transition-transform active:scale-[0.98]"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
