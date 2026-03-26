"use client";

import { useMemo } from "react";
import { Open_Sans } from "next/font/google";
import { parseAssistantRichText } from "@/lib/richText";
import type { RichTextSegment, RichTextSegmentKind } from "@/lib/types";

/**
 * Chat-style typing with progressive reveal: when `fullText` is available,
 * we always parse it with `streaming: false` to establish segment structure
 * (font weights, margins) from the start. Characters are then progressively
 * revealed within the pre-computed structure as `displayText` grows.
 * This eliminates the visual "jump" when typing completes.
 */

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

function classForKind(kind: RichTextSegmentKind): string {
  const base =
    "text-[16px] leading-[22px] text-[color:var(--text-secondary)] whitespace-pre-line transition-[margin-top] duration-200 ease-out motion-reduce:transition-none";
  if (kind === "question") {
    return `${base} font-semibold`;
  }
  return `${base} font-normal`;
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n").trim();
}

export default function AssistantRichText({
  displayText,
  fullText,
}: {
  displayText: string;
  fullText?: string;
}) {
  // Compute normalized strings outside useMemo
  const displayNorm = normalize(displayText);
  const fullNorm =
    fullText !== undefined && fullText !== "" ? normalize(fullText) : "";
  const hasFullText = Boolean(fullNorm);

  // Always parse fullText with streaming: false when available
  // This ensures font weights and margins are established from the start
  const segments = useMemo(() => {
    if (!hasFullText) {
      return displayNorm
        ? parseAssistantRichText(displayNorm, { streaming: true })
        : [];
    }
    return parseAssistantRichText(fullNorm, { streaming: false });
  }, [hasFullText, fullNorm, displayNorm]);

  // Calculate total chars across all segments
  const totalSegmentChars = useMemo(
    () => segments.reduce((sum, seg) => sum + seg.text.length, 0),
    [segments]
  );

  // Calculate how many characters should be visible
  const visibleChars = useMemo(() => {
    if (!hasFullText || displayNorm === fullNorm) return totalSegmentChars;
    return Math.min(displayNorm.length, totalSegmentChars);
  }, [hasFullText, displayNorm, fullNorm, totalSegmentChars]);

  // Build visible segments with progressive truncation
  const visibleSegments = useMemo(() => {
    if (segments.length === 0 || visibleChars === 0) return [];
    const result: Array<{ segment: RichTextSegment; text: string; index: number }> =
      [];
    let charOffset = 0;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (visibleChars <= charOffset) break;
      const charsToShow = Math.min(segment.text.length, visibleChars - charOffset);
      result.push({ segment, text: segment.text.slice(0, charsToShow), index: i });
      charOffset += segment.text.length;
    }
    return result;
  }, [segments, visibleChars]);

  if (visibleSegments.length === 0) return null;

  return (
    <div className={`${openSans.className} flex flex-col`}>
      {visibleSegments.map(({ segment, text, index }) => (
        <p
          key={`assistant-seg-${index}`}
          className={`${classForKind(segment.kind)} ${
            index > 0 ? (segment.kind === "question" ? "mt-6" : "mt-5") : ""
          }`}
        >
          {text}
        </p>
      ))}
    </div>
  );
}
