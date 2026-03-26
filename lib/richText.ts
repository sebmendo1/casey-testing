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

/**
 * If the block ends with a question, split so the question can be styled separately
 * (semi-bold, spacing above) from the preceding sentences.
 */
export function splitLeadAndQuestion(block: string): { lead: string; question: string | null } {
  const t = block.trim();
  if (!t.includes("?")) {
    return { lead: t, question: null };
  }
  const lastQ = t.lastIndexOf("?");
  const before = t.slice(0, lastQ);
  let start = 0;
  const dot = before.lastIndexOf(". ");
  const bang = before.lastIndexOf("! ");
  const qMark = before.lastIndexOf("? ");
  const nl = before.lastIndexOf("\n");
  const boundary = Math.max(dot, bang, qMark, nl);
  if (boundary !== -1) {
    start = boundary + (before[boundary] === "\n" ? 1 : 2);
  }
  const question = t.slice(start, lastQ + 1).trim();
  const lead = t.slice(0, start).trim();
  if (!question) {
    return { lead: t, question: null };
  }
  return { lead, question };
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

  const out: RichTextSegment[] = [];

  for (let index = 0; index < blocks.length; index++) {
    const text = blocks[index];
    const blockKind = inferKind(text, index, blocks.length, options);

    /** While streaming/typing, keep one segment per block so lead vs question split does not pop in mid-stream. */
    if (options.streaming) {
      out.push({ kind: blockKind, text });
      continue;
    }

    const { lead, question } = splitLeadAndQuestion(text);

    if (question && lead) {
      const firstKind: RichTextSegmentKind =
        blockKind === "lead"
          ? "lead"
          : blockKind === "emphasis"
            ? "emphasis"
            : "body";
      out.push({ kind: firstKind, text: lead });
      out.push({ kind: "question", text: question });
    } else if (question && !lead) {
      out.push({ kind: "question", text: question });
    } else {
      out.push({ kind: blockKind, text });
    }
  }

  return out;
}
