"use client";

import { Open_Sans } from "next/font/google";
import { parseAssistantRichText } from "@/lib/richText";
import type { RichTextSegmentKind } from "@/lib/types";

/**
 * Freeform assistant copy on the page background (no bubble),
 * rendered as semantic paragraph segments for easier readability.
 */

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

function classForKind(kind: RichTextSegmentKind): string {
  void kind;
  return "text-[16px] font-normal leading-[20px] text-[#002855cc]";
}

export default function AssistantRichText({
  content,
  isStreaming = false,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  const segments = parseAssistantRichText(content, { streaming: isStreaming });
  if (segments.length === 0) return null;

  return (
    <div className={`${openSans.className} space-y-5`}>
      {segments.map((segment, index) => (
        <p key={`${segment.kind}-${index}`} className={`${classForKind(segment.kind)} whitespace-pre-line`}>
          {segment.text}
        </p>
      ))}
    </div>
  );
}
