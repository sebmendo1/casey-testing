"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ChatHeader from "@/components/ChatHeader";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChatMessage from "@/components/ChatMessage";
import ChatInputField from "@/components/ChatInputField";
import AssistantStatusLine from "@/components/AssistantStatusLine";
import SuggestionPills from "@/components/SuggestionPills";
import { getCaseyResponse } from "@/lib/conversations";
import type { Message, CaseyResponse, CaseyInputMode, HomebuyingSession } from "@/lib/types";
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
  const [activeSendAnchorId, setActiveSendAnchorId] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [anchorMessageId, setAnchorMessageId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(WELCOME_SUGGESTIONS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const msgCounterRef = useRef(0);
  const loadingDelayTimeoutRef = useRef<number | null>(null);
  const selectedFlashTimeoutRef = useRef<number | null>(null);
  const pendingUserAnchorIdRef = useRef<string | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

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

  const scrollMessageToTop = useCallback((messageId: string, behavior: ScrollBehavior = "auto") => {
    const container = scrollRef.current;
    const target = messageRefs.current[messageId];
    if (!container || !target) return false;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const relativeTop = targetRect.top - containerRect.top;
    const nextTop = Math.max(0, container.scrollTop + relativeTop - TOP_ANCHOR_OFFSET_PX);
    container.scrollTo({ top: nextTop, behavior });
    return true;
  }, []);

  const requestAnchorToTop = useCallback((messageId: string, flashSelection = false) => {
    if (flashSelection) {
      flashSelectedMessage(messageId);
    }
    setAnchorMessageId(messageId);
  }, [flashSelectedMessage]);

  const scheduleImmediateTopSnap = useCallback((messageId: string) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollMessageToTop(messageId, "auto");
      });
    });
  }, [scrollMessageToTop]);

  /** Back control: return to welcome and cancel any active streaming. */
  const resetToWelcome = useCallback(() => {
    clearLoadingDelayTimer();
    typewriter.cancel();
    setMessages([]);
    setSession({ stage: "welcome" });
    setInputMode("default");
    setActiveLoadingText(null);
    setActiveSendAnchorId(null);
    setIsResponding(false);
    setAnchorMessageId(null);
    setSelectedMessageId(null);
    pendingUserAnchorIdRef.current = null;
    setSuggestions(WELCOME_SUGGESTIONS);
  }, [typewriter, clearLoadingDelayTimer]);

  useEffect(() => {
    return () => {
      clearLoadingDelayTimer();
      clearSelectedFlashTimer();
    };
  }, [clearLoadingDelayTimer, clearSelectedFlashTimer]);

  useEffect(() => {
    if (!anchorMessageId) return;
    let attempts = 0;
    let raf = 0;

    const tryAnchor = () => {
      attempts += 1;
      const anchored = scrollMessageToTop(anchorMessageId, "auto");
      if (anchored) {
        setAnchorMessageId(null);
        return;
      }
      if (attempts >= 20) return;
      raf = window.requestAnimationFrame(tryAnchor);
    };

    raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(tryAnchor);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [anchorMessageId, messages.length, scrollMessageToTop]);

  useEffect(() => {
    if (activeLoadingText === null || !activeSendAnchorId) return;
    let attempts = 0;
    let raf = 0;
    const maxAttempts = 360;

    const reanchor = () => {
      attempts += 1;
      scrollMessageToTop(activeSendAnchorId, "auto");
      if (attempts >= maxAttempts) return;
      raf = window.requestAnimationFrame(reanchor);
    };

    raf = window.requestAnimationFrame(reanchor);
    return () => window.cancelAnimationFrame(raf);
  }, [activeLoadingText, activeSendAnchorId, scrollMessageToTop]);

  const handleSend = useCallback(
    (text: string) => {
      clearLoadingDelayTimer();
      const userMessageId = nextMessageId("user");
      const userMessage: Message = {
        id: userMessageId,
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMessage]);
      setActiveSendAnchorId(userMessageId);
      requestAnchorToTop(userMessageId);
      scheduleImmediateTopSnap(userMessageId);
      pendingUserAnchorIdRef.current = userMessageId;
      setSuggestions([]);
      setIsResponding(true);

      const response = getCaseyResponse(text, session);
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
          pendingUserAnchorIdRef.current = null;
          setAnchorMessageId(null);
          streamAssistantMessage(response);
          setActiveSendAnchorId(null);
          loadingDelayTimeoutRef.current = null;
        }, remaining);
      };

      typewriter.runQueue(loadingSegments, {
        onSegmentStart: () => {
          setActiveLoadingText("");
          if (pendingUserAnchorIdRef.current) {
            scrollMessageToTop(pendingUserAnchorIdRef.current, "auto");
          }
        },
        onSegmentUpdate: (_segment, displayText) => {
          setActiveLoadingText(displayText);
          if (pendingUserAnchorIdRef.current) {
            scrollMessageToTop(pendingUserAnchorIdRef.current, "auto");
          }
        },
        onQueueComplete: scheduleStream,
      });
    },
    [clearLoadingDelayTimer, nextMessageId, requestAnchorToTop, scheduleImmediateTopSnap, scrollMessageToTop, session, streamAssistantMessage, typewriter]
  );

  const handleRowSelect = useCallback((messageId: string) => {
    if (activeSendAnchorId && activeLoadingText !== null) return;
    requestAnchorToTop(messageId, true);
  }, [activeLoadingText, activeSendAnchorId, requestAnchorToTop]);

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

  return (
    <div className="min-h-dvh w-full overflow-hidden" style={{ backgroundColor: CHAT_SURFACE }}>
      <div
        className="relative flex min-h-dvh w-full min-h-0 flex-col overflow-hidden"
        style={{ backgroundColor: CHAT_SURFACE }}
      >
        <div className="mx-auto w-full max-w-[980px]">
          <ChatHeader onBack={resetToWelcome} />
        </div>
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ scrollBehavior: "smooth" }}>
          <div
            ref={scrollRef}
            className="mx-auto flex min-h-0 w-full max-w-[980px] flex-1 flex-col overflow-y-auto overscroll-contain"
            style={{ scrollBehavior: "smooth" }}
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
              <div className="px-6 py-6">
                <div className="max-w-3xl space-y-6">
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
                      className={`selectable-chat-row ${
                        selectedMessageId === msg.id ? "chat-row-selected" : ""
                      } ${msg.isStreaming ? "message-stream-enter" : "opacity-0 animate-fade-in"}`}
                      style={msg.isStreaming ? undefined : { animationDelay: "50ms" }}
                    >
                      <ChatMessage
                        role={msg.role}
                        content={msg.content}
                        displayContent={msg.displayContent}
                        isStreaming={msg.isStreaming}
                        blocks={msg.blocks}
                        onAction={handleSuggestionClick}
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
            )}
          </div>
          <div className="chat-dissolve-top pointer-events-none absolute inset-x-0 top-0 z-10" aria-hidden />
          <div className="chat-dissolve-bottom pointer-events-none absolute inset-x-0 bottom-0 z-10" aria-hidden />
        </main>
        {/* Pinned footer: not inside scroll region; stays at bottom of the shell */}
        <footer className="relative z-20 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-[980px]">
            <ChatInputField
              onSend={handleSend}
              disabled={isBusy}
              placeholder={inputMode === "property_address" ? ADDRESS_INPUT_PLACEHOLDER : DEFAULT_INPUT_PLACEHOLDER}
            />
            <p className="px-6 pb-0 pt-0 text-center text-[11px] leading-relaxed text-[#002855b3]">
              Casey can make mistakes{" "}
              <a href="#" className="text-[#002855] underline underline-offset-2">
                as per our disclosures.
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
