import type { CaseyResponse, HomebuyingSession } from "./types";
import { thinkingStepsFromStrings } from "./aiThinking";
import { formatAddressLine, maskSsn } from "./creditUtils";

function normalizeInput(text: string): string {
  return text.trim().toLowerCase();
}

function includesAny(text: string, list: string[]): boolean {
  return list.some((item) => text.includes(item));
}

const DEFAULT_SESSION: HomebuyingSession = { stage: "welcome" };
const START_LOADING = thinkingStepsFromStrings(["Starting your mortgage application..."]);
const PROPERTY_LOADING = thinkingStepsFromStrings(["Running property search..."]);
const NUMBERS_LOADING = thinkingStepsFromStrings(["Running the numbers..."]);
const ACCOUNTS_LOADING = thinkingStepsFromStrings(["Reviewing your Casey accounts..."]);
const SOFT_CREDIT_LOADING = thinkingStepsFromStrings(["Preparing soft credit authorization..."]);

const TIMELINE_OPTIONS = [
  "As soon as possible",
  "In the next few months",
  "Within the next year",
  "Not sure yet",
];

const AGENT_OPTIONS = [
  "Yes, I have a real estate agent",
  "No, but I’m interested in one",
  "Not interested",
];

function fallback(session: HomebuyingSession): CaseyResponse {
  return {
    content: "Please choose one of the options above, or share more details and I can guide you.",
    session,
    inputMode: session.stage === "address_prompt" ? "property_address" : "default",
  };
}

function nextBuyTimeline(session: HomebuyingSession, userMessage: string): CaseyResponse {
  return {
    content:
      "Are you already working with a real estate agent?\n\nIf you don't have one, Casey Agent Express is an excellent solution for working with a real estate professional.",
    suggestions: AGENT_OPTIONS,
    session: { ...session, stage: "agent_question", buyTimeline: userMessage },
    thinkingSteps: START_LOADING,
  };
}

function moveToAddressPrompt(session: HomebuyingSession, userMessage: string): CaseyResponse {
  return {
    content:
      "Perfect, now it's time to search for your future home\n\nType the address bellow and we'll confirm the property's information. If you don't have the exact property, you can share the zip code or city, and we'll draw an estimate.\n\nEx: 1234 Sesame St, New York, NY, 12345",
    session: { ...session, stage: "address_prompt", agentStatus: userMessage },
    inputMode: "property_address",
  };
}

function moveToOfferRecommendation(session: HomebuyingSession, propertyAddress: string): CaseyResponse {
  return {
    content:
      "The asking price for this property is $420,000. According to Casey's listing data, this appears to be a fair asking price.\n\nWe recommend offering a 20% down payment of about $84,000 to get the best rates. Would this work?",
    session: { ...session, stage: "down_payment_question", propertyAddress },
    suggestions: ["Yes, a 20% down payment works", "Offer another amount"],
    blocks: [
      {
        type: "property_summary",
        data: {
          statusTitle: "Property search complete",
          heading: "Here's what we know about your future home",
          imageAlt: "Property photo",
          price: "$420,000",
          address: "12509 Coral Dr, Frisco TX, 75036",
          beds: 4,
          baths: 2,
          sqft: 2097,
        },
      },
    ],
    thinkingSteps: PROPERTY_LOADING,
  };
}

function moveToAssetsQuestion(session: HomebuyingSession, downPaymentDecision: string): CaseyResponse {
  return {
    content:
      "Great, now let's review your affordability with your Casey accounts.\n\nIf you wish, I can quickly review your Casey assets through both Checking, Savings, and Casey Wealth Management to estimate if you can afford this home. Would you like me to do that?",
    suggestions: ["Yes, review my Casey assets", "I prefer to add them manually"],
    session: { ...session, stage: "assets_review_question", downPaymentDecision },
    thinkingSteps: NUMBERS_LOADING,
  };
}

function moveToAssetsResult(session: HomebuyingSession, useAutoReview: boolean): CaseyResponse {
  return {
    content: useAutoReview
      ? "Here are your accounts we found\n\nYou can choose which ones you'd like to include for your qualification letter."
      : "Once you select your assets, you can continue with the application",
    session: {
      ...session,
      stage: "assets_results",
      assetsReviewMode: useAutoReview ? "auto" : "manual",
    },
    blocks: [
      ...(useAutoReview
        ? [
            {
              type: "status_line" as const,
              data: { text: "Account search complete" },
            },
          ]
        : []),
      {
        type: "account_group",
        data: {
          institution: "Casey",
          rows: [
            { name: "Checking (...1234)", value: "$10,000" },
            { name: "Savings (... 5678)", value: "$100,000" },
          ],
        },
      },
      {
        type: "account_group",
        data: {
          institution: "Casey Wealth Management",
          rows: [
            { name: "Roth IRA", value: "$20,000" },
            { name: "Investments", value: "$100,000" },
          ],
        },
      },
      {
        type: "inline_cta",
        data: {
          label: "Submit and continue",
        },
      },
    ],
    suggestions: [],
    thinkingSteps: useAutoReview ? ACCOUNTS_LOADING : undefined,
  };
}

function buildApplicationSummary(session: HomebuyingSession) {
  const rows = [
    { label: "Journey stage", value: session.journeyStage ?? "Not provided" },
    { label: "Buy timeline", value: session.buyTimeline ?? "Not provided" },
    { label: "Agent status", value: session.agentStatus ?? "Not provided" },
    { label: "Property address", value: session.propertyAddress ?? "Not provided" },
    { label: "Down payment", value: session.downPaymentDecision ?? "Not provided" },
    {
      label: "Asset review",
      value: session.assetsReviewMode === "auto" ? "Auto-linked Casey accounts" : "Manual account review",
    },
  ];
  if (session.creditForm) {
    rows.push(
      { label: "SSN", value: maskSsn(session.creditForm.ssn) },
      { label: "Home address", value: formatAddressLine(session.creditForm) }
    );
  }
  rows.push({
    label: "Soft credit check",
    value: session.creditAuthorized ? "Authorized" : "Pending authorization",
  });
  return rows;
}

/** Shown in chat after the credit wizard (SSN / address / review) is submitted. */
export function getCreditThreadAfterWizard(session: HomebuyingSession): CaseyResponse {
  return {
    content:
      "We have all your information ready.\n\nNow what we need is to run a soft credit check to verify your eligibility. Just remember: this operation will not affect your credit score in anyway.",
    blocks: [
      { type: "status_line", data: { text: "One last step to take" } },
      {
        type: "credit_authorization",
        data: {
          checked: false,
          label: "Authorize soft credit check",
          actionLabel: "Authorize soft credit check",
          variant: "inline",
        },
      },
    ],
    session: { ...session, stage: "credit_authorization" },
    thinkingSteps: SOFT_CREDIT_LOADING,
  };
}

export function getCaseyResponse(
  userMessage: string,
  currentSession?: HomebuyingSession
): CaseyResponse {
  const session = currentSession ?? DEFAULT_SESSION;
  const normalized = normalizeInput(userMessage);

  if (session.stage === "welcome") {
    if (includesAny(normalized, ["apply for a mortgage", "apply for a home loan"])) {
      return {
        content:
          "Great, let's get you started in your home journey with your mortgage application\n\nI'll guide you through the steps and save your progress along the way so you can pick up where you left off. Remember that I can always answer any questions you may have along the way.\n\nBefore we get started, I have a few questions around your home buying needs, timeline, and similar\n\nAs of today, where are you in your home buying journey?",
        suggestions: ["I'm still researching", "Starting to make offers", "Signed a purchase contract"],
        session: { stage: "journey_question" },
        thinkingSteps: START_LOADING,
      };
    }

    return {
      content:
        "Select a launch option to continue: Apply for a home loan, See how much I can qualify for, or Search for homes in my area.",
      session,
    };
  }

  if (session.stage === "journey_question") {
    return {
      content: "When do you want to buy a house?",
      suggestions: TIMELINE_OPTIONS,
      session: { ...session, stage: "timeline_question", journeyStage: userMessage },
      thinkingSteps: START_LOADING,
    };
  }

  if (session.stage === "timeline_question") {
    return nextBuyTimeline(session, userMessage);
  }

  if (session.stage === "agent_question") {
    if (includesAny(normalized, ["yes, i have", "yes", "interested", "not interested", "real estate agent"])) {
      return moveToAddressPrompt(session, userMessage);
    }
    return fallback(session);
  }

  if (session.stage === "address_prompt") {
    if (userMessage.trim().length < 5) {
      return {
        content: "Please share a complete address, ZIP code, or city so I can run the search.",
        session,
        inputMode: "property_address",
      };
    }
    return moveToOfferRecommendation(session, userMessage.trim());
  }

  if (session.stage === "down_payment_question") {
    if (includesAny(normalized, ["yes", "20% down payment"])) {
      return moveToAssetsQuestion(session, userMessage);
    }

    if (includesAny(normalized, ["offer another amount", "another amount"])) {
      return {
        content: "Share the down payment amount you prefer, and I'll rerun the estimate.",
        session,
      };
    }

    if (/\$?\d+/.test(normalized)) {
      return moveToAssetsQuestion(session, userMessage);
    }

    return fallback(session);
  }

  if (session.stage === "assets_review_question") {
    if (includesAny(normalized, ["yes, review", "review my casey", "review"])) {
      return moveToAssetsResult(session, true);
    }
    if (includesAny(normalized, ["manually", "prefer to add"])) {
      return moveToAssetsResult(session, false);
    }
    return fallback(session);
  }

  if (session.stage === "assets_results") {
    if (includesAny(normalized, ["submit and continue", "submit"])) {
      return {
        content: "",
        suggestions: [],
        blocks: [
          {
            type: "status_line",
            data: { text: "Planning next steps..." },
          },
        ],
        session: { ...session, stage: "credit_intro", creditAuthorized: false },
        thinkingSteps: SOFT_CREDIT_LOADING,
      };
    }
    return fallback(session);
  }

  if (
    session.stage === "credit_intro" ||
    session.stage === "credit_ssn" ||
    session.stage === "credit_address" ||
    session.stage === "credit_review"
  ) {
    return {
      content: "Use the credit check screens to continue — you can also tap Back if you need to change an answer.",
      session,
    };
  }

  if (session.stage === "credit_authorization") {
    if (
      includesAny(normalized, ["soft credit check authorized", "credit check authorized"]) ||
      normalized.includes("authorize soft credit")
    ) {
      return {
        content:
          "Your soft credit check was successful! You're eligible for the loan.\n\nWhat would you like to do next?",
        blocks: [
          { type: "status_line", data: { text: "Summarizing your application" } },
          {
            type: "credit_status",
            data: {
              title: "Credit Check",
              statusLabel: "Verified",
              subtext: "Soft check completed successfully.",
            },
          },
          {
            type: "application_summary",
            data: {
              title: "Review your application",
              fields: buildApplicationSummary({ ...session, creditAuthorized: true }),
            },
          },
          {
            type: "inline_cta",
            data: { label: "Confirm application" },
          },
        ],
        suggestions: ["Review loan terms", "Talk to an agent"],
        session: { ...session, stage: "application_review", creditAuthorized: true },
        thinkingSteps: thinkingStepsFromStrings(["Checking your credit... This will only take a moment."]),
      };
    }
    return fallback(session);
  }

  if (session.stage === "application_review") {
    if (includesAny(normalized, ["confirm application", "confirm", "submit"])) {
      return {
        content:
          "Confirmation complete.\n\nYour home loan application has been submitted successfully. A mortgage specialist will reach out with next steps shortly.",
        blocks: [
          {
            type: "status_line",
            data: { text: "Application confirmed" },
          },
        ],
        suggestions: ["Back to start"],
        session: { ...session, stage: "confirmation" },
      };
    }
    if (includesAny(normalized, ["review loan", "review loan terms"])) {
      return {
        content:
          "Here's your application summary. Tap Confirm application when you're ready to submit your loan application.",
        blocks: [
          {
            type: "application_summary",
            data: {
              title: "Review your application",
              fields: buildApplicationSummary(session),
            },
          },
          {
            type: "inline_cta",
            data: { label: "Confirm application" },
          },
        ],
        session,
      };
    }
    if (includesAny(normalized, ["talk to an agent"])) {
      return {
        content:
          "We'll connect you with a mortgage specialist. You can still confirm your application below whenever you're ready.",
        blocks: [
          {
            type: "inline_cta",
            data: { label: "Confirm application" },
          },
        ],
        session,
      };
    }
    return fallback(session);
  }

  if (session.stage === "confirmation") {
    if (includesAny(normalized, ["back to start", "start over", "restart"])) {
      return {
        content: "",
        suggestions: [],
        session: DEFAULT_SESSION,
      };
    }
    return fallback(session);
  }

  return fallback(session);
}
