"use client";

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import ChatHeader from "@/components/ChatHeader";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChatMessage from "@/components/ChatMessage";
import ChatInputField from "@/components/ChatInputField";
import AssistantStatusLine from "@/components/AssistantStatusLine";
import SuggestionPills from "@/components/SuggestionPills";
import type { Message, CaseyInputMode, HomebuyingSession, CreditFormData, AssistantBlock } from "@/lib/types";
import CreditCheckWizard from "@/components/credit/CreditCheckWizard";
import CreditAuthorizeModal from "@/components/credit/CreditAuthorizeModal";
import CreditSuccessSheet from "@/components/credit/CreditSuccessSheet";
import DisclosureLinkButton from "@/components/DisclosureLinkButton";
import { emptyCreditForm } from "@/lib/creditUtils";
import { useTypewriterQueue } from "@/hooks/useTypewriterQueue";
import { getCaseyResponse } from "@/lib/conversations";

const WELCOME_SUGGESTIONS = [
  "Apply for a mortgage",
  "See how much I can qualify for",
  "Search for homes in my area",
];

const DEFAULT_INPUT_PLACEHOLDER = "How can I help you today?";
const ADDRESS_INPUT_PLACEHOLDER = "Tell us your property address";
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

  const { runQueue: runTypewriterQueue, cancel: cancelTypewriter, isRunning: typewriterRunning } =
    useTypewriterQueue({
      baseDelayMs: 15,
      punctuationDelayMs: 90,
      sentenceEndDelayMs: 140,
      jitterMs: 7,
    });

  const isBusy = isResponding || typewriterRunning;

  const nextMessageId = useCallback((prefix: "user" | "assistant") => {
    msgCounterRef.current += 1;
    return `${prefix}-${Date.now()}-${msgCounterRef.current}`;
  }, []);


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
    cancelTypewriter();
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
  }, [cancelTypewriter, clearLoadingDelayTimer]);

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

  /** After the API stream completes, reveal assistant text with a typewriter effect. */
  const finalizeAssistantWithTypewriter = useCallback(
    (
      assistantMessageId: string,
      fullText: string,
      blocks: AssistantBlock[],
      suggestionsAfter: string[] = [],
    ) => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const trimmed = fullText.trim();
      if (trimmed.length === 0) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "",
                  displayContent: undefined,
                  blocks,
                  isStreaming: false,
                }
              : msg,
          ),
        );
        setActiveLoadingText(null);
        setIsResponding(false);
        setSuggestions(suggestionsAfter);
        return;
      }

      if (prefersReducedMotion) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: fullText,
                  displayContent: undefined,
                  blocks,
                  isStreaming: false,
                }
              : msg,
          ),
        );
        setActiveLoadingText(null);
        setIsResponding(false);
        setSuggestions(suggestionsAfter);
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: fullText,
                displayContent: "",
                blocks,
                isStreaming: true,
              }
            : msg,
        ),
      );
      setActiveLoadingText(null);

      runTypewriterQueue([{ id: assistantMessageId, text: fullText }], {
        onSegmentUpdate: (_seg, display) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, displayContent: display } : m,
            ),
          );
        },
        onQueueComplete: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, displayContent: undefined, isStreaming: false }
                : m,
            ),
          );
          setIsResponding(false);
          setSuggestions(suggestionsAfter);
        },
      });
    },
    [runTypewriterQueue],
  );

  const streamFromApi = useCallback(
    async (allMessages: Message[], currentSession: HomebuyingSession) => {
      clearLoadingDelayTimer();
      cancelTypewriter();
      setIsResponding(true);
      setActiveLoadingText("Thinking through your request...");

      const assistantMessageId = nextMessageId("assistant");
      let accumulatedText = "";
      const accumulatedBlocks: AssistantBlock[] = [];
      let suggestionsAfter: string[] = [];

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          displayContent: "",
          isStreaming: true,
          blocks: [],
        },
      ]);

      try {
        const apiMessages = allMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, session: currentSession }),
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let event: Record<string, unknown>;
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }

            if (event.type === "thinking") {
              setActiveLoadingText(event.text as string);
            } else if (event.type === "content") {
              setActiveLoadingText(null);
              accumulatedText += event.text as string;
            } else if (event.type === "block") {
              setActiveLoadingText(null);
              const block = event.block as AssistantBlock;
              accumulatedBlocks.push(block);
            } else if (event.type === "error") {
              console.error("[Gemini stream error]", event.message);
            } else if (event.type === "session") {
              const newSession = event.session as HomebuyingSession;
              setSession(newSession);
              setInputMode(
                newSession.stage === "address_prompt" ? "property_address" : "default",
              );
            } else if (event.type === "done") {
              // finalize below
            }
          }
        }
      } catch (err) {
        console.error("Stream error — falling back to local logic:", err);
        try {
          const lastMsg = allMessages[allMessages.length - 1]?.content ?? "";
          const localResp = getCaseyResponse(lastMsg, currentSession);
          accumulatedText = localResp.content ?? (accumulatedText || "I'm sorry, something went wrong. Please try again.");
          if (localResp.blocks) {
            for (const b of localResp.blocks) {
              accumulatedBlocks.push(b);
            }
          }
          setSession(localResp.session);
          setInputMode(localResp.inputMode ?? "default");
          if (localResp.suggestions) suggestionsAfter = localResp.suggestions;
        } catch {
          accumulatedText = accumulatedText || "I'm sorry, something went wrong. Please try again.";
        }
      }

      finalizeAssistantWithTypewriter(assistantMessageId, accumulatedText, accumulatedBlocks, suggestionsAfter);
    },
    [clearLoadingDelayTimer, finalizeAssistantWithTypewriter, nextMessageId, cancelTypewriter],
  );

  const handleCreditWizardComplete = useCallback(() => {
    const merged: HomebuyingSession = { ...session, creditForm: creditDraft, stage: "credit_authorization" };
    setSession(merged);
    const systemMessage: Message = {
      id: nextMessageId("user"),
      role: "user",
      content: "I have completed the credit check wizard. My SSN and address have been securely submitted. Please proceed with the soft credit authorization.",
    };
    const allMsgs = [...messages, systemMessage];
    setMessages(allMsgs);
    streamFromApi(allMsgs, merged);
  }, [session, creditDraft, nextMessageId, messages, streamFromApi]);

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
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setSuggestions([]);

      streamFromApi(updatedMessages, session);
    },
    [clearLoadingDelayTimer, nextMessageId, messages, session, streamFromApi],
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
