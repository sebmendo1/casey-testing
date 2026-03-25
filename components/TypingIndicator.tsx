"use client";

import SparkleIcon from "@/components/SparkleIcon";

const STATUS_TEXT = "#002855";

/** Freeform composing state — sparkle + line (no bubble), matches thinking row. */
export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 pt-0.5">
      <SparkleIcon className="mt-0.5" />
      <p
        className="animate-compose-pulse text-[15px] font-medium leading-snug"
        style={{ color: STATUS_TEXT }}
      >
        Composing your reply…
      </p>
    </div>
  );
}
