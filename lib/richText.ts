import type { RichTextSegment, RichTextSegmentKind } from "./types";

interface ParseRichTextOptions {
  /** While streaming, keep the last segment style stable to avoid flicker. */
  streaming?: boolean;
}

function inferKind(
  text: string,
  index: number,
  total: number,
  options: ParseRichTextOptions
): RichTextSegmentKind {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isQuestion = /\?\s*$/.test(text);

  if (total === 1) {
    return isQuestion && !options.streaming ? "question" : "body";
  }

  if (isFirst) return "lead";

  if (isLast && options.streaming) return "body";

  if (isQuestion) return "question";

  if (isLast && total >= 3) return "emphasis";

  return "body";
}

export function parseAssistantRichText(
  content: string,
  options: ParseRichTextOptions = {}
): RichTextSegment[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((text, index) => ({
    kind: inferKind(text, index, blocks.length, options),
    text,
  }));
}
