"use client";

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import ChatHeader from "@/components/ChatHeader";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChatMessage from "@/components/ChatMessage";
import ChatInputField from "@/components/ChatInputField";
import AssistantStatusLine from "@/components/AssistantStatusLine";
import SuggestionPills from "@/components/SuggestionPills";
import { getCaseyResponse, getCreditThreadAfterWizard } from "@/lib/conversations";
import type { Message, CaseyResponse, CaseyInputMode, HomebuyingSession, CreditFormData } from "@/lib/types";
import CreditCheckWizard from "@/components/credit/CreditCheckWizard";
import CreditAuthorizeModal from "@/components/credit/CreditAuthorizeModal";
import CreditSuccessSheet from "@/components/credit/CreditSuccessSheet";
import DisclosureLinkButton from "@/components/DisclosureLinkButton";
import { emptyCreditForm } from "@/lib/creditUtils";
import { useTypewriterQueue, type TypewriterSegment } from "@/hooks/useTypewriterQueue";

const WELCOME_SUGGESTIONS = [
  "Apply for a mortgage",
  "See how much I can qualify for",
  "Search for homes in my area",
];

const DEFAULT_INPUT_PLACEHOLDER = "How can I help you today?";
const ADDRESS_INPUT_PLACEHOLDER = "Tell us your property address";
const MIN_LOADING_MS = 2000;
const MAX_LOADING_MS = 3000;
const GENERIC_LOADING_TEXT = "Thinking through your request...";
const TOP_ANCHOR_OFFSET_PX = 6;

/** Brand canvas */
const CHAT_SURFACE = "#FAFBFF";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<HomebuyingSession>({ stage: "welcome" });
  const [inputMode, setInputMode] = useState<CaseyInputMode>("default");
  const [activeLoadingText, setActiveLoadingText] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(WELCOME_SUGGESTIONS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const msgCounterRef = useRef(0);
  const loadingDelayTimeoutRef = useRef<number | null>(null);
  const selectedFlashTimeoutRef = useRef<number | null>(null);
  const scrollTargetRef = useRef<string | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const [creditDraft, setCreditDraft] = useState<CreditFormData>(() => emptyCreditForm());
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditSuccessOpen, setCreditSuccessOpen] = useState(false);

  const typewriter = useTypewriterQueue({
    baseDelayMs: 15,
    punctuationDelayMs: 90,
    sentenceEndDelayMs: 140,
    jitterMs: 7,
  });

  const isBusy = isResponding || typewriter.isRunning;

  const nextMessageId = useCallback((prefix: "user" | "assistant") => {
    msgCounterRef.current += 1;
    return `${prefix}-${Date.now()}-${msgCounterRef.current}`;
  }, []);

  const finalizeResponseMeta = useCallback((response: CaseyResponse) => {
    setSuggestions(response.suggestions ?? []);
    setSession(response.session);
    setInputMode(response.inputMode ?? "default");
    setIsResponding(false);
  }, []);

  const streamAssistantMessage = useCallback(
    (response: CaseyResponse) => {
      const fullContent = response.content ?? "";
      const originalBlocks = response.blocks ?? [];
      const hasText = fullContent.trim().length > 0;
      const hasBlocks = originalBlocks.length > 0;
      const hasStatusBlocks = originalBlocks.some((block) => block.type === "status_line");

      if (!hasText && !hasBlocks) {
        finalizeResponseMeta(response);
        return;
      }

      const assistantMessageId = nextMessageId("assistant");
      const initialBlocks = originalBlocks.map((block) =>
        block.type === "status_line"
          ? { ...block, data: { ...block.data, displayText: "" } }
          : block
      );
      const shouldStream = hasStatusBlocks || hasText;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: fullContent,
          displayContent: hasText ? "" : fullContent,
          blocks: initialBlocks,
          isStreaming: shouldStream,
        },
      ]);

      if (!shouldStream) {
        finalizeResponseMeta(response);
        return;
      }

      const segments: TypewriterSegment[] = [];
      originalBlocks.forEach((block, index) => {
        if (block.type === "status_line") {
          segments.push({ id: `status-${index}`, text: block.data.text });
        }
      });
      if (hasText) {
        segments.push({ id: "content", text: fullContent });
      }

      typewriter.runQueue(segments, {
        onSegmentStart: (segment) => {
          if (!segment.id.startsWith("status-")) return;
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== assistantMessageId) return msg;
              const blockIdx = Number(segment.id.replace("status-", ""));
              const updatedBlocks = (msg.blocks ?? []).map((block, i) =>
                i === blockIdx && block.type === "status_line"
                  ? { ...block, data: { ...block.data, displayText: "" } }
                  : block
              );
              return { ...msg, blocks: updatedBlocks };
            })
          );
        },
        onSegmentUpdate: (segment, displayText) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== assistantMessageId) return msg;
              if (segment.id === "content") {
                return { ...msg, displayContent: displayText };
              }
              if (segment.id.startsWith("status-")) {
                const blockIdx = Number(segment.id.replace("status-", ""));
                const updatedBlocks = (msg.blocks ?? []).map((block, i) =>
                  i === blockIdx && block.type === "status_line"
                    ? { ...block, data: { ...block.data, displayText } }
                    : block
                );
                return { ...msg, blocks: updatedBlocks };
              }
              return msg;
            })
          );
        },
        onQueueComplete: () => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== assistantMessageId) return msg;
              const finalizedBlocks = (msg.blocks ?? []).map((block) =>
                block.type === "status_line"
                  ? { ...block, data: { ...block.data, displayText: block.data.text } }
                  : block
              );
              return {
                ...msg,
                isStreaming: false,
                displayContent: undefined,
                blocks: finalizedBlocks,
              };
            })
          );
          finalizeResponseMeta(response);
        },
      });
    },
    [finalizeResponseMeta, nextMessageId, typewriter]
  );

  const clearLoadingDelayTimer = useCallback(() => {
    if (loadingDelayTimeoutRef.current !== null) {
      window.clearTimeout(loadingDelayTimeoutRef.current);
      loadingDelayTimeoutRef.current = null;
    }
  }, []);

  const clearSelectedFlashTimer = useCallback(() => {
    if (selectedFlashTimeoutRef.current !== null) {
      window.clearTimeout(selectedFlashTimeoutRef.current);
      selectedFlashTimeoutRef.current = null;
    }
  }, []);

  const flashSelectedMessage = useCallback(
    (messageId: string) => {
      setSelectedMessageId(messageId);
      clearSelectedFlashTimer();
      selectedFlashTimeoutRef.current = window.setTimeout(() => {
        setSelectedMessageId((prev) => (prev === messageId ? null : prev));
        selectedFlashTimeoutRef.current = null;
      }, 260);
    },
    [clearSelectedFlashTimer]
  );

  const scrollMessageToTop = useCallback((messageId: string) => {
    const container = scrollRef.current;
    const target = messageRefs.current[messageId];
    if (!container || !target) return false;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const desiredTop = container.scrollTop + (targetRect.top - containerRect.top) - TOP_ANCHOR_OFFSET_PX;
    container.scrollTop = Math.max(0, desiredTop);
    return true;
  }, []);

  const resetToWelcome = useCallback(() => {
    clearLoadingDelayTimer();
    typewriter.cancel();
    setMessages([]);
    setSession({ stage: "welcome" });
    setInputMode("default");
    setActiveLoadingText(null);
    setIsResponding(false);
    setSelectedMessageId(null);
    scrollTargetRef.current = null;
    setCreditDraft(emptyCreditForm());
    setCreditModalOpen(false);
    setCreditSuccessOpen(false);
    setSuggestions(WELCOME_SUGGESTIONS);
  }, [typewriter, clearLoadingDelayTimer]);

  useEffect(() => {
    return () => {
      clearLoadingDelayTimer();
      clearSelectedFlashTimer();
    };
  }, [clearLoadingDelayTimer, clearSelectedFlashTimer]);

  useLayoutEffect(() => {
    const id = scrollTargetRef.current;
    if (!id) return;
    scrollTargetRef.current = null;
    scrollMessageToTop(id);
  }, [messages, scrollMessageToTop]);

  const queueAssistantResponse = useCallback(
    (response: CaseyResponse) => {
      clearLoadingDelayTimer();
      setIsResponding(true);
      const loadingSegments: TypewriterSegment[] =
        (response.thinkingSteps ?? []).length > 0
          ? (response.thinkingSteps ?? []).map((step, index) => ({
              id: `loading-${index}`,
              text: step.text,
            }))
          : [{ id: "loading-generic", text: GENERIC_LOADING_TEXT }];

      const requiredLoadingMs =
        MIN_LOADING_MS + Math.floor(Math.random() * (MAX_LOADING_MS - MIN_LOADING_MS + 1));
      const loadingStartedAt = performance.now();

      const scheduleStream = () => {
        const elapsed = performance.now() - loadingStartedAt;
        const remaining = Math.max(0, requiredLoadingMs - elapsed);
        loadingDelayTimeoutRef.current = window.setTimeout(() => {
          setActiveLoadingText(null);
          streamAssistantMessage(response);
          loadingDelayTimeoutRef.current = null;
        }, remaining);
      };

      typewriter.runQueue(loadingSegments, {
        onSegmentStart: () => {
          setActiveLoadingText("");
        },
        onSegmentUpdate: (_segment, displayText) => {
          setActiveLoadingText(displayText);
        },
        onQueueComplete: scheduleStream,
      });
    },
    [clearLoadingDelayTimer, streamAssistantMessage, typewriter]
  );

  const handleCreditWizardBack = useCallback(() => {
    setSession((s) => {
      if (s.stage === "credit_ssn") return { ...s, stage: "credit_intro" };
      if (s.stage === "credit_address") return { ...s, stage: "credit_ssn" };
      if (s.stage === "credit_review") return { ...s, stage: "credit_address" };
      return s;
    });
  }, []);

  const handleExitCreditWizard = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Leave the credit check? You can continue later from the chat.")
    ) {
      return;
    }
    setSession((s) => ({ ...s, stage: "assets_results" }));
  }, []);

  const handleCreditWizardComplete = useCallback(() => {
    const merged: HomebuyingSession = { ...session, creditForm: creditDraft, stage: "credit_authorization" };
    setSession(merged);
    queueAssistantResponse(getCreditThreadAfterWizard(merged));
  }, [session, creditDraft, queueAssistantResponse]);

  const handleSend = useCallback(
    (text: string) => {
      clearLoadingDelayTimer();
      const userMessageId = nextMessageId("user");
      const userMessage: Message = {
        id: userMessageId,
        role: "user",
        content: text,
      };

      scrollTargetRef.current = userMessageId;
      setMessages((prev) => [...prev, userMessage]);
      setSuggestions([]);

      const response = getCaseyResponse(text, session);
      queueAssistantResponse(response);
    },
    [clearLoadingDelayTimer, nextMessageId, queueAssistantResponse, session]
  );

  const handleCreditSuccessContinue = useCallback(() => {
    setCreditSuccessOpen(false);
    handleSend("Soft credit check authorized");
  }, [handleSend]);

  const handleRowSelect = useCallback(
    (messageId: string) => {
      if (isBusy) return;
      const row = messages.find((m) => m.id === messageId);
      if (row?.role === "user") {
        flashSelectedMessage(messageId);
      }
      scrollMessageToTop(messageId);
    },
    [isBusy, flashSelectedMessage, messages, scrollMessageToTop]
  );

  const shouldIgnoreRowSelection = (target: HTMLElement | null) => {
    if (!target) return true;
    return Boolean(
      target.closest(
        'button,a,input,textarea,select,label,[role="button"],[data-no-row-select="true"]'
      )
    );
  };

  const selectFromEventTarget = useCallback(
    (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return;
      if (shouldIgnoreRowSelection(target)) return;
      const messageRow = target.closest<HTMLElement>("[data-message-id]");
      const messageId = messageRow?.dataset.messageId;
      if (!messageId) return;
      handleRowSelect(messageId);
    },
    [handleRowSelect]
  );

  const handleSuggestionClick = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

  const showWelcome = messages.length === 0;

  const showCreditWizard =
    session.stage === "credit_intro" ||
    session.stage === "credit_ssn" ||
    session.stage === "credit_address" ||
    session.stage === "credit_review";

  const creditWizardStage =
    session.stage === "credit_intro" ||
    session.stage === "credit_ssn" ||
    session.stage === "credit_address" ||
    session.stage === "credit_review"
      ? session.stage
      : "credit_intro";

  return (
    <div className="h-dvh w-full overflow-hidden" style={{ backgroundColor: CHAT_SURFACE }}>
      <div
        className="relative flex h-full w-full flex-col overflow-hidden"
        style={{ backgroundColor: CHAT_SURFACE }}
        aria-hidden={creditModalOpen || creditSuccessOpen || showCreditWizard ? true : undefined}
      >
        <div className="chat-shell">
          <ChatHeader onBack={resetToWelcome} />
        </div>
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="chat-shell flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
            onPointerDownCapture={(event) => {
              pointerStartRef.current = { x: event.clientX, y: event.clientY };
            }}
            onPointerUpCapture={(event) => {
              const start = pointerStartRef.current;
              pointerStartRef.current = null;
              if (!start) return;
              const movedX = Math.abs(event.clientX - start.x);
              const movedY = Math.abs(event.clientY - start.y);
              if (movedX > 8 || movedY > 8) return;
              selectFromEventTarget(event.target);
            }}
            onClickCapture={(event) => {
              // Keyboard/synthetic click fallback for non-pointer activation.
              if (pointerStartRef.current) return;
              selectFromEventTarget(event.target);
            }}
          >
            {showWelcome ? (
              <div className="min-h-full">
                <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
              </div>
            ) : (
              <>
                <div className="px-6 py-6">
                  <div className="space-y-6">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        data-message-id={msg.id}
                        ref={(node) => {
                          messageRefs.current[msg.id] = node;
                        }}
                        role="group"
                        tabIndex={0}
                        aria-label="Chat row"
                        onKeyDown={(event) => {
                          if (event.currentTarget !== event.target) return;
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          handleRowSelect(msg.id);
                        }}
                        className={`${
                          msg.role === "assistant" ? "chat-output-row" : "selectable-chat-row"
                        } ${selectedMessageId === msg.id ? "chat-row-selected" : ""} ${
                          msg.isStreaming ? "message-stream-enter" : "opacity-0 animate-fade-in"
                        }`}
                        style={msg.isStreaming ? undefined : { animationDelay: "50ms" }}
                      >
                        <ChatMessage
                          role={msg.role}
                          content={msg.content}
                          displayContent={msg.displayContent}
                          isStreaming={msg.isStreaming}
                          blocks={msg.blocks}
                          onAction={handleSuggestionClick}
                          onOpenCreditAuthorize={() => setCreditModalOpen(true)}
                        />
                        {msg.role === "assistant" &&
                          !msg.isStreaming &&
                          msg.id === messages[messages.length - 1]?.id &&
                          !isBusy && (
                            <SuggestionPills suggestions={suggestions} onSelect={handleSuggestionClick} />
                          )}
                      </div>
                    ))}
                    {activeLoadingText !== null && (
                      <div key="loading-status" className="message-stream-enter">
                        <AssistantStatusLine text={activeLoadingText} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0" aria-hidden style={{ minHeight: "100dvh" }} />
              </>
            )}
          </div>
          <div className="chat-dissolve-top pointer-events-none absolute inset-x-0 top-0 z-10" aria-hidden />
          <div className="chat-dissolve-bottom pointer-events-none absolute inset-x-0 bottom-0 z-10" aria-hidden />
        </main>
        {/* Pinned footer: not inside scroll region; stays at bottom of the shell */}
        <footer className="relative z-20 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="chat-shell">
            <ChatInputField
              onSend={handleSend}
              disabled={isBusy || showCreditWizard || creditModalOpen || creditSuccessOpen}
              placeholder={inputMode === "property_address" ? ADDRESS_INPUT_PLACEHOLDER : DEFAULT_INPUT_PLACEHOLDER}
            />
            <p
              className="max-w-prose px-6 pb-0 pt-0 text-center text-[11px] leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Casey can make mistakes <DisclosureLinkButton>as per our disclosures.</DisclosureLinkButton>
            </p>
          </div>
        </footer>
      </div>

      {showCreditWizard && (
        <CreditCheckWizard
          stage={creditWizardStage}
          draft={creditDraft}
          onDraftChange={setCreditDraft}
          onContinueIntro={() => setSession((s) => ({ ...s, stage: "credit_ssn" }))}
          onContinueSsn={() => setSession((s) => ({ ...s, stage: "credit_address" }))}
          onContinueAddress={() => setSession((s) => ({ ...s, stage: "credit_review" }))}
          onSubmitReview={handleCreditWizardComplete}
          onBack={handleCreditWizardBack}
          onExitToChat={handleExitCreditWizard}
        />
      )}

      <CreditAuthorizeModal
        open={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        onSubmit={() => {
          setCreditModalOpen(false);
          setCreditSuccessOpen(true);
        }}
      />

      <CreditSuccessSheet open={creditSuccessOpen} onContinue={handleCreditSuccessContinue} />
    </div>
  );
}
