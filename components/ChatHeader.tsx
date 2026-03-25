"use client";

interface ChatHeaderProps {
  /** Return to welcome / clear chat (e.g. from main screen). */
  onBack?: () => void;
}

/** Top bar: back | Casey | phone */
export default function ChatHeader({ onBack }: ChatHeaderProps) {
  return (
    <header className="relative sticky top-0 z-20 bg-transparent px-6 pb-3 pt-1">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="flex h-11 w-11 min-w-[44px] items-center justify-center rounded-full text-[#002855] transition-opacity active:opacity-70"
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="text-[17px] font-semibold tracking-tight text-[color:var(--text-primary)]">
          Casey AI
        </span>

        <button
          type="button"
          className="flex h-11 w-11 min-w-[44px] items-center justify-center rounded-full bg-[#00285514] text-[#002855] shadow-[0_3px_10px_rgba(0,40,85,0.08)] transition-opacity active:opacity-70"
          aria-label="Call"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
