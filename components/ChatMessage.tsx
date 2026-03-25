"use client";

import type { AssistantBlock } from "@/lib/types";
import AssistantRichText from "./AssistantRichText";
import PropertySummaryCard from "./PropertySummaryCard";
import AccountGroupCard from "./AccountGroupCard";
import InlineActionPill from "./InlineActionPill";
import AssistantStatusLine from "./AssistantStatusLine";
import CreditAuthorizationCard from "./CreditAuthorizationCard";
import ApplicationSummaryCard from "./ApplicationSummaryCard";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  isStreaming?: boolean;
  timestamp?: string;
  blocks?: AssistantBlock[];
  onAction?: (value: string) => void;
}

export default function ChatMessage({
  role,
  content,
  displayContent,
  isStreaming,
  timestamp,
  blocks,
  onAction,
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
    <div className="min-w-0">
      {timestamp && (
        <p className="mb-1 text-[11px] text-[#00285599]">{timestamp}</p>
      )}
      {(displayContent ?? content).trim().length > 0 && (
        <AssistantRichText content={displayContent ?? content} isStreaming={Boolean(isStreaming)} />
      )}
      {blocks && blocks.length > 0 && (
        <div className="mt-5 space-y-4">
          {blocks.map((block, index) => {
            if (block.type === "status_line") {
              return (
                <AssistantStatusLine
                  key={`status-${index}`}
                  text={block.data.displayText ?? block.data.text}
                />
              );
            }
            if (isStreaming) return null;
            if (block.type === "property_summary") {
              return <PropertySummaryCard key={`property-${index}`} data={block.data} />;
            }
            if (block.type === "account_group") {
              return <AccountGroupCard key={`accounts-${index}`} data={block.data} />;
            }
            if (block.type === "inline_cta" && onAction) {
              return (
                <InlineActionPill
                  key={`action-${block.data.label}-${index}`}
                  label={block.data.label}
                  onClick={onAction}
                />
              );
            }
            if (block.type === "credit_authorization") {
              return (
                <CreditAuthorizationCard
                  key={`credit-auth-${index}`}
                  data={block.data}
                  onToggle={onAction}
                />
              );
            }
            if (block.type === "application_summary") {
              return <ApplicationSummaryCard key={`summary-${index}`} data={block.data} />;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
