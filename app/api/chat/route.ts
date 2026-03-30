import { GoogleGenAI, type Content } from "@google/genai";
import { NextRequest } from "next/server";
import type { AssistantBlock, HomebuyingSession, CaseyStage } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/caseySystemPrompt";
import {
  TOOL_DECLARATIONS,
  handleComputeAffordability,
  handleSearchProperties,
} from "@/lib/geminiTools";
import { formatPropertySearchThinkingLabel } from "@/lib/propertySearchParams";
import {
  buildApplicationSummary,
  moveToAssetsResult,
  getCreditThreadAfterWizard,
  getCaseyResponse,
} from "@/lib/conversations";
import { getNextStage, CONVERSATION_STAGES } from "@/lib/stageFlow";

const MODEL = "gemini-2.5-flash";
const MAX_FUNCTION_ROUNDS = 6;
const GEMINI_TIMEOUT_MS = 30_000;

interface ChatRequestBody {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  session: HomebuyingSession;
}

function ndjsonLine(obj: Record<string, unknown>): string {
  return JSON.stringify(obj) + "\n";
}

function extractBlockMarkers(text: string): {
  cleaned: string;
  blocks: AssistantBlock[];
} {
  const blocks: AssistantBlock[] = [];
  const cleaned = text.replace(
    /<<BLOCK:(\w+):(.*?)>>/g,
    (_match, type: string, json: string) => {
      try {
        const data = JSON.parse(json);
        blocks.push({ type, data } as AssistantBlock);
      } catch {
        // malformed marker — skip
      }
      return "";
    },
  );
  return { cleaned: cleaned.trim(), blocks };
}

/**
 * Deterministic stage inference based on user actions, not AI response text.
 * When user answers a question for stage X, advance to stage X+1.
 */
function inferStage(
  session: HomebuyingSession,
  toolsCalled: string[],
  userMessage: string,
): { stage: CaseyStage; completedSteps: CaseyStage[] } {
  const currentCompleted = session.completedSteps ?? [];

  // Tool-based transitions (keep these - they're deterministic)
  if (toolsCalled.includes("compute_affordability")) {
    return { stage: "affordability_result", completedSteps: currentCompleted };
  }
  if (toolsCalled.includes("search_properties")) {
    return { stage: "property_search_results", completedSteps: currentCompleted };
  }

  // Conversation stages: advance deterministically when user responds
  if (CONVERSATION_STAGES.includes(session.stage) && userMessage.trim()) {
    const nextStage = getNextStage(session.stage);
    if (nextStage) {
      const completed = currentCompleted.includes(session.stage)
        ? currentCompleted
        : [...currentCompleted, session.stage];
      return { stage: nextStage, completedSteps: completed };
    }
  }

  // Handle transition from welcome/result stages to journey_question
  // This happens when user initiates the mortgage flow
  if (
    (session.stage === "welcome" ||
      session.stage === "affordability_result" ||
      session.stage === "property_search_results") &&
    userMessage.trim()
  ) {
    const lower = userMessage.toLowerCase();
    // User is starting or continuing the mortgage application flow
    if (
      lower.includes("mortgage") ||
      lower.includes("apply") ||
      lower.includes("loan") ||
      lower.includes("pre-approv") ||
      lower.includes("buy a home") ||
      lower.includes("buying a home")
    ) {
      return { stage: "journey_question", completedSteps: currentCompleted };
    }
  }

  return { stage: session.stage, completedSteps: currentCompleted };
}

/**
 * Sanitize contents for Gemini: ensure non-empty, first is user,
 * no consecutive same-role messages (merge them).
 */
function sanitizeContents(raw: Content[]): Content[] {
  if (raw.length === 0) {
    return [{ role: "user", parts: [{ text: "Hello" }] }];
  }

  const result: Content[] = [];
  for (const msg of raw) {
    const prev = result[result.length - 1];
    if (prev && prev.role === msg.role) {
      const prevText = prev.parts?.map((p) => (p as { text?: string }).text ?? "").join("") ?? "";
      const curText = msg.parts?.map((p) => (p as { text?: string }).text ?? "").join("") ?? "";
      prev.parts = [{ text: prevText + "\n" + curText }];
    } else {
      result.push({ ...msg });
    }
  }

  if (result[0]?.role !== "user") {
    result.unshift({ role: "user", parts: [{ text: "Hello" }] });
  }
  return result;
}

/**
 * Check if a stage should bypass Gemini and use deterministic responses.
 * Returns NDJSON lines if deterministic, or null to proceed with Gemini.
 */
function deterministicResponse(
  session: HomebuyingSession,
  lastUserMessage: string,
): string | null {
  const lower = lastUserMessage.trim().toLowerCase();

  if (
    session.stage === "credit_intro" ||
    session.stage === "credit_ssn" ||
    session.stage === "credit_address" ||
    session.stage === "credit_review"
  ) {
    let lines = "";
    lines += ndjsonLine({ type: "content", text: "Use the credit check screens to continue — you can also tap Back if you need to change an answer." });
    lines += ndjsonLine({ type: "session", session });
    lines += ndjsonLine({ type: "done" });
    return lines;
  }

  if (session.stage === "credit_authorization") {
    if (lower.includes("completed the credit check wizard")) {
      const resp = getCreditThreadAfterWizard(session);
      return caseyResponseToNdjson(resp);
    }
    if (
      lower.includes("soft credit check authorized") ||
      lower.includes("credit check authorized") ||
      lower.includes("authorize soft credit")
    ) {
      const updatedSession: HomebuyingSession = { ...session, stage: "application_review", creditAuthorized: true };
      const summaryFields = buildApplicationSummary(updatedSession);
      let lines = "";
      lines += ndjsonLine({ type: "content", text: "Your soft credit check was successful! You're eligible for the loan.\n\nReview your application details below, then tap \"Confirm and submit\" when you're ready." });
      lines += ndjsonLine({ type: "block", block: { type: "status_line", data: { text: "Summarizing your application" } } });
      lines += ndjsonLine({ type: "block", block: { type: "credit_status", data: { title: "Credit Check", statusLabel: "Verified", subtext: "Soft check completed successfully." } } });
      lines += ndjsonLine({ type: "block", block: { type: "application_summary", data: { title: "Review your application", fields: summaryFields } } });
      lines += ndjsonLine({ type: "session", session: updatedSession });
      lines += ndjsonLine({ type: "done" });
      return lines;
    }
  }

  if (session.stage === "assets_review_question") {
    if (lower.includes("review") || lower.includes("yes")) {
      const resp = moveToAssetsResult(session, true);
      return caseyResponseToNdjson(resp);
    }
    if (lower.includes("manually") || lower.includes("prefer to add")) {
      const resp = moveToAssetsResult(session, false);
      return caseyResponseToNdjson(resp);
    }
  }


  if (session.stage === "application_review") {
    if (lower.includes("confirm application") || lower.includes("confirm") || lower === "submit") {
      const updatedSession: HomebuyingSession = { ...session, stage: "confirmation" };
      let lines = "";
      lines += ndjsonLine({ type: "content", text: "Confirmation complete.\n\nYour home loan application has been submitted successfully. A mortgage specialist will reach out with next steps shortly." });
      lines += ndjsonLine({ type: "block", block: { type: "status_line", data: { text: "Application confirmed" } } });
      lines += ndjsonLine({ type: "session", session: updatedSession });
      lines += ndjsonLine({ type: "done" });
      return lines;
    }
    if (lower.includes("review loan") || lower.includes("review loan terms")) {
      const summaryFields = buildApplicationSummary(session);
      let lines = "";
      lines += ndjsonLine({ type: "content", text: "Here's your application summary. Tap \"Confirm and submit\" when you're ready to submit your loan application." });
      lines += ndjsonLine({ type: "block", block: { type: "application_summary", data: { title: "Review your application", fields: summaryFields } } });
      lines += ndjsonLine({ type: "session", session });
      lines += ndjsonLine({ type: "done" });
      return lines;
    }
  }

  if (session.stage === "confirmation") {
    if (lower.includes("back to start") || lower.includes("start over") || lower.includes("restart")) {
      let lines = "";
      lines += ndjsonLine({ type: "session", session: { stage: "welcome" } });
      lines += ndjsonLine({ type: "done" });
      return lines;
    }
  }

  return null;
}

/**
 * Convert a CaseyResponse from conversations.ts into NDJSON lines
 * for the deterministic bypass.
 */
function caseyResponseToNdjson(resp: {
  content?: string;
  blocks?: AssistantBlock[];
  session: HomebuyingSession;
}): string {
  let lines = "";
  if (resp.blocks) {
    for (const block of resp.blocks) {
      lines += ndjsonLine({ type: "block", block });
    }
  }
  if (resp.content) {
    lines += ndjsonLine({ type: "content", text: resp.content });
  }
  lines += ndjsonLine({ type: "session", session: resp.session });
  lines += ndjsonLine({ type: "done" });
  return lines;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      ndjsonLine({ type: "content", text: "Gemini API key is not configured. Please add GEMINI_API_KEY to .env.local." }) +
      ndjsonLine({ type: "done" }),
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const body = (await req.json()) as ChatRequestBody;
  const { messages, session } = body;
  const lastUserMessage = messages[messages.length - 1]?.content ?? "";

  const det = deterministicResponse(session, lastUserMessage);
  if (det) {
    return new Response(det, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const ai = new GoogleGenAI({ apiKey });

  const rawContents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const contents = sanitizeContents(rawContents);

  const systemInstruction = buildSystemPrompt(session);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const write = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(ndjsonLine(obj)));

      write({ type: "thinking", text: "Thinking through your request..." });

      try {
        let currentContents: Content[] = [...contents];
        const allToolsCalled: string[] = [];
        const allBlocks: AssistantBlock[] = [];
        let fullAssistantText = "";

        for (let round = 0; round < MAX_FUNCTION_ROUNDS; round++) {
          const response = await withTimeout(
            ai.models.generateContent({
              model: MODEL,
              contents: currentContents,
              config: {
                systemInstruction,
                tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
              },
            }),
            GEMINI_TIMEOUT_MS,
            "Gemini generateContent",
          );

          const candidate = response.candidates?.[0];
          if (!candidate?.content?.parts) break;

          let textThisRound = "";
          const functionCalls: Array<{ name: string; id?: string; args: Record<string, unknown> }> = [];

          for (const part of candidate.content.parts) {
            if (part.text) {
              textThisRound += part.text;
            }
            if (part.functionCall) {
              functionCalls.push({
                name: part.functionCall.name ?? "",
                id: part.functionCall.id,
                args: (part.functionCall.args ?? {}) as Record<string, unknown>,
              });
            }
          }

          if (textThisRound) {
            fullAssistantText += textThisRound;
          }

          if (functionCalls.length === 0) {
            break;
          }

          const functionResponseParts: Array<{ functionResponse: { name: string; id?: string; response: Record<string, unknown> } }> = [];

          for (const fc of functionCalls) {
            allToolsCalled.push(fc.name);

            if (fc.name === "compute_affordability") {
              // Show skeleton while calculating
              write({ type: "skeleton_start", cardType: "affordability_result" });
              const result = handleComputeAffordability(fc.args);
              // Replace skeleton with actual result
              write({ type: "skeleton_end", cardType: "affordability_result" });
              // Emit status line first, then the result card
              write({ type: "block", block: { type: "status_line", data: { text: "Estimate ready" } } });
              allBlocks.push({ type: "status_line", data: { text: "Estimate ready" } });
              allBlocks.push({ type: "affordability_result", data: result.formatted });
              write({ type: "block", block: { type: "affordability_result", data: result.formatted } });
              functionResponseParts.push({
                functionResponse: {
                  name: fc.name,
                  id: fc.id,
                  response: { result: result.raw, formatted: result.formatted },
                },
              });
            } else if (fc.name === "search_properties") {
              write({
                type: "thinking",
                text: formatPropertySearchThinkingLabel(fc.args),
              });
              // Emit skeleton placeholder while search runs
              write({
                type: "skeleton_start",
                cardType: "property_summary",
              });
              const result = await withTimeout(
                handleSearchProperties(fc.args),
                25_000,
                "Property search",
              );
              // Signal skeleton end - frontend will transition smoothly
              write({ type: "skeleton_end", cardType: "property_summary" });
              if (result.summary.items.length > 0) {
                // Only show the first (best) property result
                const singleResult = {
                  ...result.summary,
                  items: [result.summary.items[0]],
                };
                allBlocks.push({ type: "property_summary", data: singleResult });
                write({ type: "block", block: { type: "property_summary", data: singleResult } });
              }
              functionResponseParts.push({
                functionResponse: {
                  name: fc.name,
                  id: fc.id,
                  response: {
                    listings: result.raw,
                    count: result.summary.items.length,
                    summary: result.summary,
                  },
                },
              });
            }
          }

          currentContents = [
            ...currentContents,
            candidate.content as Content,
            { role: "user", parts: functionResponseParts } as Content,
          ];
        }

        const { cleaned, blocks: markerBlocks } = extractBlockMarkers(fullAssistantText);

        for (const b of markerBlocks) {
          // Tool already streams property_summary with live listing data; model markers duplicate the same cards.
          if (b.type === "property_summary" && allToolsCalled.includes("search_properties")) {
            continue;
          }
          // Skip status_line for property search - PropertySummaryCard has its own statusTitle
          if (b.type === "status_line" && allToolsCalled.includes("search_properties")) {
            continue;
          }
          // Tool already streams affordability_result and status_line; skip all duplicates from model markers.
          if (allToolsCalled.includes("compute_affordability")) {
            if (b.type === "affordability_result") {
              continue;
            }
            // Skip status_line if it's about the estimate (already emitted by tool)
            if (b.type === "status_line" && typeof b.data?.text === "string" &&
                b.data.text.toLowerCase().includes("estimate")) {
              continue;
            }
          }
          allBlocks.push(b);
          write({ type: "block", block: b });
        }

        if (cleaned) {
          write({ type: "content", text: cleaned });
        }

        const { stage: newStage, completedSteps } = inferStage(
          session,
          allToolsCalled,
          lastUserMessage
        );
        const updatedSession: HomebuyingSession = {
          ...session,
          stage: newStage,
          completedSteps,
        };

        if (allToolsCalled.includes("compute_affordability")) {
          const incomeMatch = fullAssistantText.match(/income.*?(\d[\d,]*)/i);
          if (incomeMatch) {
            updatedSession.affordabilityAnnualIncome = Number(incomeMatch[1].replace(/,/g, ""));
          }
        }
        if (allToolsCalled.includes("search_properties")) {
          updatedSession.propertySearchCity = String(messages[messages.length - 1]?.content ?? "");
        }

        write({ type: "session", session: updatedSession });
        write({ type: "done" });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("Gemini API error:", errMsg, err);
        write({ type: "error", message: errMsg });
        write({
          type: "content",
          text: "I'm sorry, something went wrong on my end. Please try again in a moment.",
        });
        write({ type: "session", session });
        write({ type: "done" });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
