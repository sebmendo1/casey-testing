/** One line of status shown before the assistant reply. */
export interface ThinkingStep {
  id: string;
  text: string;
}

export type RichTextSegmentKind = "lead" | "body" | "question" | "emphasis";

export interface RichTextSegment {
  kind: RichTextSegmentKind;
  text: string;
}

/** Legacy flow types kept for compatibility with older components. */
export type Flow = "qualification" | "application" | "property_search" | null;

export interface TrustCardData {
  title: string;
  primaryValue: string;
  reasoning: string[];
  primaryAction: string;
  secondaryAction: string;
  finePrint?: string;
}

export interface PropertyCardData {
  address: string;
  price: string;
  beds: number;
  baths: number;
  sqft?: string;
  estimatedMonthly: string;
}

export type CaseyInputMode = "default" | "property_address";

export type CaseyStage =
  | "welcome"
  | "journey_question"
  | "timeline_question"
  | "agent_question"
  | "address_prompt"
  | "down_payment_question"
  | "assets_review_question"
  | "assets_results"
  | "credit_intro"
  | "credit_ssn"
  | "credit_address"
  | "credit_review"
  | "credit_authorization"
  | "application_review"
  | "confirmation";

export interface CreditFormData {
  ssn: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
}

export interface HomebuyingSession {
  stage: CaseyStage;
  journeyStage?: string;
  buyTimeline?: string;
  agentStatus?: string;
  propertyAddress?: string;
  downPaymentDecision?: string;
  assetsReviewMode?: string;
  creditAuthorized?: boolean;
  creditForm?: CreditFormData;
}

export interface PropertySummaryData {
  statusTitle: string;
  heading: string;
  imageAlt: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  commentary?: string;
}

export interface AccountRow {
  name: string;
  value: string;
}

export interface AccountGroupData {
  institution: string;
  rows: AccountRow[];
}

export interface InlineCtaData {
  label: string;
}

export interface CreditAuthorizationData {
  checked: boolean;
  label: string;
  detailsLinkText?: string;
  actionLabel: string;
  /** Inline card (chat) opens full authorization modal */
  variant?: "inline" | "default";
}

export interface CreditStatusData {
  title: string;
  statusLabel: string;
  subtext: string;
}

export interface ReviewField {
  label: string;
  value: string;
}

export interface ApplicationSummaryData {
  title: string;
  fields: ReviewField[];
}

export type AssistantBlock =
  | { type: "status_line"; data: { text: string; displayText?: string } }
  | { type: "property_summary"; data: PropertySummaryData }
  | { type: "account_group"; data: AccountGroupData }
  | { type: "inline_cta"; data: InlineCtaData }
  | { type: "credit_authorization"; data: CreditAuthorizationData }
  | { type: "credit_status"; data: CreditStatusData }
  | { type: "application_summary"; data: ApplicationSummaryData };

export interface CaseyResponse {
  content?: string;
  thinkingSteps?: ThinkingStep[];
  suggestions?: string[];
  inputMode?: CaseyInputMode;
  blocks?: AssistantBlock[];
  session: HomebuyingSession;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  isStreaming?: boolean;
  blocks?: AssistantBlock[];
  timestamp?: string;
}
