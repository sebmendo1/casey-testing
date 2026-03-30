"use client";

import type { AssistantBlock } from "@/lib/types";
import AssistantRichText from "./AssistantRichText";
import PropertySummaryCard from "./PropertySummaryCard";
import AccountGroupCard from "./AccountGroupCard";
import InlineActionPill from "./InlineActionPill";
import AssistantStatusLine from "./AssistantStatusLine";
import CreditAuthorizationCard from "./CreditAuthorizationCard";
import ApplicationSummaryCard from "./ApplicationSummaryCard";
import CreditCheckStatusCard from "./credit/CreditCheckStatusCard";
import AffordabilityResultCard from "./AffordabilityResultCard";
import SkeletonCard from "./skeletons/SkeletonCard";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  isStreaming?: boolean;
  timestamp?: string;
  blocks?: AssistantBlock[];
  onAction?: (value: string) => void;
  onOpenCreditAuthorize?: () => void;
  onConfirmApplication?: () => void;
}

export default function ChatMessage({
  role,
  content,
  displayContent,
  isStreaming,
  timestamp,
  blocks,
  onAction,
  onOpenCreditAuthorize,
  onConfirmApplication,
}: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          {timestamp && (
            <p className="mb-1 text-right text-[11px] text-[#00285599]">
              {timestamp}
            </p>
          )}
          <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_6px_18px_rgba(0,40,85,0.07),0_1px_4px_rgba(0,40,85,0.04)]">
            <p className="text-[15px] leading-relaxed text-[#002855]">{content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-w-0"
      aria-live="polite"
      aria-busy={isStreaming ? true : undefined}
      aria-atomic="false"
    >
      {timestamp && (
        <p className="mb-1 text-[11px] text-[#00285599]">{timestamp}</p>
      )}
      {/* Blocks render FIRST (status line, property card, etc.) */}
      {blocks && blocks.length > 0 && (
        <div className="space-y-4">
          {blocks.map((block, index) => {
            // Status lines have their own animation
            if (block.type === "status_line") {
              return (
                <AssistantStatusLine
                  key={`status-${index}`}
                  text={block.data.displayText ?? block.data.text}
                />
              );
            }
            // Skeleton placeholders with shimmer
            if (block.type === "skeleton_placeholder") {
              return (
                <div key={`skeleton-${block.data.cardType}-${index}`} className="skeleton-shimmer">
                  <SkeletonCard cardType={block.data.cardType} />
                </div>
              );
            }
            // Binary decisions rendered in footer
            if (block.type === "binary_decision") {
              return null;
            }
            // All card blocks with smooth enter animation
            let cardContent: React.ReactNode = null;
            if (block.type === "property_summary") {
              cardContent = <PropertySummaryCard data={block.data} />;
            } else if (block.type === "account_group") {
              cardContent = <AccountGroupCard data={block.data} />;
            } else if (block.type === "inline_cta" && onAction) {
              cardContent = (
                <InlineActionPill
                  label={block.data.label}
                  onClick={onAction}
                />
              );
            } else if (block.type === "credit_authorization") {
              cardContent = (
                <CreditAuthorizationCard
                  data={block.data}
                  onToggle={onAction}
                  onOpenAuthorize={onOpenCreditAuthorize}
                />
              );
            } else if (block.type === "credit_status") {
              cardContent = <CreditCheckStatusCard data={block.data} />;
            } else if (block.type === "application_summary") {
              cardContent = (
                <ApplicationSummaryCard
                  data={block.data}
                  onConfirm={onConfirmApplication}
                />
              );
            } else if (block.type === "affordability_result") {
              cardContent = <AffordabilityResultCard data={block.data} />;
            }
            if (cardContent) {
              return (
                <div key={`${block.type}-${index}`} className="animate-card-enter">
                  {cardContent}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
      {/* Text content renders AFTER blocks (below the property card) */}
      {(displayContent ?? content).trim().length > 0 && (
        <div className={blocks && blocks.length > 0 ? "mt-5" : ""}>
          <AssistantRichText
            displayText={displayContent ?? content}
            fullText={content.trim().length > 0 ? content : undefined}
          />
        </div>
      )}
    </div>
  );
}
