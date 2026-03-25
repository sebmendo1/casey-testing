"use client";

import SparkleIcon from "@/components/SparkleIcon";
import type { ThinkingStep } from "@/lib/types";

type Props = {
  steps: ThinkingStep[];
  /** Number of steps finished (0 … steps.length). When `steps.length`, all steps are done. */
  completedCount: number;
};

const STATUS_TEXT = "#002855";

/**
 * Freeform status: sparkle + single line (no bubble), matching Casey AI reference.
 * Shows the current active thinking line; when all steps complete, shows the last line briefly.
 */
export default function ThinkingStatus({ steps, completedCount }: Props) {
  if (steps.length === 0) return null;

  const idx = Math.min(completedCount, steps.length - 1);
  const line = steps[idx]?.text ?? "";

  return (
    <div className="flex items-start gap-2.5 pt-0.5 transition-opacity duration-300 ease-out">
      <SparkleIcon className="mt-0.5 transition-opacity duration-300" />
      <p
        key={line}
        className="animate-loading-line min-w-0 flex-1 text-[15px] font-medium leading-snug"
        style={{ color: STATUS_TEXT }}
      >
        {line}
      </p>
    </div>
  );
}
