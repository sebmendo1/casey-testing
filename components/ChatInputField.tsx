"use client";

import { useState, useCallback } from "react";

interface ChatInputFieldProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const PLACEHOLDER = "How can I help you today?";

const INPUT_TEXT = "#002855";

export default function ChatInputField({
  onSend,
  disabled = false,
  placeholder = PLACEHOLDER,
}: ChatInputFieldProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }, [value, onSend, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="w-full bg-transparent px-6 pt-3 pb-2">
      <div className="flex min-h-[52px] w-full items-center gap-2 rounded-full border border-[#0028551f] bg-white py-1.5 pl-4 pr-2 shadow-[0_5px_14px_rgba(0,40,85,0.06),0_1px_4px_rgba(0,40,85,0.03)] transition-[box-shadow,border-color] focus-within:border-[#00285566] focus-within:shadow-[0_7px_18px_rgba(0,40,85,0.08),0_2px_6px_rgba(0,40,85,0.04)]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] min-w-0 flex-1 bg-transparent py-2 text-[16px] placeholder:text-[#00285580] focus:outline-none disabled:opacity-50"
          style={{ color: INPUT_TEXT }}
        />

        <div className="flex shrink-0 items-center gap-0.5 pr-0.5">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#00285599] transition-colors hover:bg-[#00285514] hover:text-[#002855] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Voice input"
            disabled={disabled}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 1a3 3 0 013 3v8a3 3 0 01-6 0V4a3 3 0 013-3z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 ${
              canSend
                ? "bg-[#002855] text-white shadow-[0_4px_10px_rgba(0,40,85,0.14)] hover:brightness-[1.03] active:brightness-[0.98]"
                : "bg-[#00285514] text-[#00285580] shadow-none"
            }`}
            aria-label="Send message"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 19V5M5 12l7-7 7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
