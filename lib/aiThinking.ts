/**
 * Thinking / reasoning UI — shared shape for hardcoded Casey replies and future Gemini streaming.
 *
 * Gemini integration (suggested):
 * - Server route streams NDJSON or SSE events, e.g.
 *   `{ "type": "thinking", "text": "..." }` → push onto `thinkingSteps`
 *   `{ "type": "content", "text": "..." }` → append to assistant message
 *   `{ "type": "done" }` → close stream
 * - Map each thinking chunk to `ThinkingStep` with a stable `id` (uuid or index).
 * - If Gemini exposes "thought" in a single block, split on newlines or use one step.
 */

import type { ThinkingStep } from "./types";

export function thinkingStepsFromStrings(texts: string[]): ThinkingStep[] {
  return texts.map((text, i) => ({
    id: `thinking-${i}-${text.slice(0, 12)}`,
    text,
  }));
}

/** Placeholder for parsing Gemini stream chunks — implement in `app/api/chat/route.ts` when wiring. */
export type GeminiStreamEvent =
  | { type: "thinking"; text: string; id?: string }
  | { type: "content"; text: string }
  | { type: "done" };

export function eventToThinkingStep(
  event: Extract<GeminiStreamEvent, { type: "thinking" }>,
  index: number
): ThinkingStep {
  return {
    id: event.id ?? `gemini-thinking-${index}`,
    text: event.text,
  };
}
