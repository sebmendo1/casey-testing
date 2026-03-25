"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface TypewriterSegment {
  id: string;
  text: string;
}

interface RunQueueHandlers {
  onSegmentStart?: (segment: TypewriterSegment) => void;
  onSegmentUpdate?: (segment: TypewriterSegment, displayText: string) => void;
  onSegmentComplete?: (segment: TypewriterSegment) => void;
  onQueueComplete?: () => void;
}

interface TypewriterOptions {
  baseDelayMs?: number;
  punctuationDelayMs?: number;
  sentenceEndDelayMs?: number;
  jitterMs?: number;
}

export function useTypewriterQueue(options: TypewriterOptions = {}) {
  const {
    baseDelayMs = 16,
    punctuationDelayMs = 90,
    sentenceEndDelayMs = 140,
    jitterMs = 6,
  } = options;

  const [isRunning, setIsRunning] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const runIdRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    runIdRef.current += 1;
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const delayForChar = useCallback(
    (char: string): number => {
      const jitter = Math.floor(Math.random() * jitterMs);
      if (char === "." || char === "!" || char === "?") {
        return sentenceEndDelayMs + jitter;
      }
      if (char === "," || char === ":" || char === ";") {
        return punctuationDelayMs + jitter;
      }
      return baseDelayMs + jitter;
    },
    [baseDelayMs, punctuationDelayMs, sentenceEndDelayMs, jitterMs]
  );

  const runQueue = useCallback(
    (segments: TypewriterSegment[], handlers: RunQueueHandlers = {}) => {
      cancel();
      const runId = runIdRef.current;
      if (segments.length === 0) {
        handlers.onQueueComplete?.();
        return;
      }

      setIsRunning(true);
      let segmentIndex = 0;

      const typeCurrentSegment = () => {
        if (runIdRef.current !== runId) return;
        const segment = segments[segmentIndex];
        if (!segment) {
          setIsRunning(false);
          handlers.onQueueComplete?.();
          return;
        }

        handlers.onSegmentStart?.(segment);
        let charIndex = 0;

        const tick = () => {
          if (runIdRef.current !== runId) return;
          charIndex += 1;
          const display = segment.text.slice(0, charIndex);
          handlers.onSegmentUpdate?.(segment, display);

          if (charIndex >= segment.text.length) {
            handlers.onSegmentComplete?.(segment);
            segmentIndex += 1;
            timeoutRef.current = window.setTimeout(typeCurrentSegment, 80);
            return;
          }

          const lastChar = display[display.length - 1] ?? "";
          timeoutRef.current = window.setTimeout(tick, delayForChar(lastChar));
        };

        timeoutRef.current = window.setTimeout(tick, 40);
      };

      typeCurrentSegment();
    },
    [cancel, delayForChar]
  );

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    isRunning,
    runQueue,
    cancel,
  };
}
