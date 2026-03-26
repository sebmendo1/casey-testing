import type { AffordabilityDownPayment, CaseyResponse, HomebuyingSession } from "./types";
import { thinkingStepsFromStrings } from "./aiThinking";
import { formatAddressLine, maskSsn } from "./creditUtils";
import {
  computeAffordabilityEstimate,
  formatAffordabilityResultCard,
  parseMoneyOrPercent,
} from "./affordabilityCalculator";

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

function fallback(session: HomebuyingSession): CaseyResponse {
  switch (session.stage) {
    case "journey_question":
      return {
        content:
          "That\u2019s a great question and I\u2019m happy to help with that along the way. To get us started though, I\u2019d love to know where you stand right now \u2014 are you still exploring the idea of buying, actively looking at homes, or do you already have a property under contract? This helps me figure out the best path forward for you.",
        session,
      };
    case "timeline_question":
      return {
        content:
          "No worries, timelines can be flexible. Just to give me a rough sense \u2014 are we talking weeks, a few months, or more like within the next year? Even a ballpark helps me make sure we\u2019re looking at the right programs for you.",
        session,
      };
    case "agent_question":
      return {
        content:
          "Totally fine if you haven\u2019t decided yet. For now, just let me know \u2014 do you have a real estate agent already, or would you like me to connect you with one through Casey Agent Express? Either way works for moving forward.",
        session,
      };
    case "address_prompt":
      return {
        content:
          "I\u2019d love to look that up, but I need just a bit more to go on. Could you share a full address, a ZIP code, or at least a city and state? For example, something like \u2018123 Main St, Austin, TX\u2019 or just \u201878701\u2019 works great.",
        session,
        inputMode: "property_address",
      };
    case "down_payment_question":
      return {
        content:
          "I hear you \u2014 down payments can feel like a big number. You don\u2019t have to go with 20% though; many borrowers put down less. Just let me know a dollar amount or percentage that feels realistic for you, and I\u2019ll recalculate everything.",
        session,
      };
    case "assets_review_question":
      return {
        content:
          "No problem at all. For this step, I check your Casey Bank accounts to confirm your available funds \u2014 things like checking, savings, and any investment accounts. If you\u2019d rather input your asset information yourself, just let me know and I\u2019ll set that up instead. Which would you prefer?",
        session,
      };
    default:
      return {
        content:
          "I want to make sure I help you the right way. Could you share a bit more about what you\u2019re looking for so I can guide you to the next step?",
        session,
      };
  }
}

function nextBuyTimeline(session: HomebuyingSession, userMessage: string): CaseyResponse {
  return {
    content:
      "Good to know you\u2019re aiming for " + userMessage.trim() + ". Are you currently working with a real estate agent, or would you like to go solo for now? If you don\u2019t have one yet, Casey Agent Express can pair you with a professional at no extra cost.",
    session: { ...session, stage: "agent_question", buyTimeline: userMessage },
    thinkingSteps: START_LOADING,
  };
}

function moveToAddressPrompt(session: HomebuyingSession, userMessage: string): CaseyResponse {
  return {
    content:
      "Perfect, that\u2019s helpful context. Now let\u2019s find your future home \u2014 go ahead and share the property address, a ZIP code, or even just the city and I\u2019ll pull up what I can. If you don\u2019t have a specific property yet, a neighborhood or ZIP still gives us a solid estimate.",
    session: { ...session, stage: "address_prompt", agentStatus: userMessage },
    inputMode: "property_address",
  };
}

function moveToOfferRecommendation(session: HomebuyingSession, propertyAddress: string): CaseyResponse {
  return {
    content:
      "Here\u2019s what we found for your property. Based on the listing data, a 20% down payment of about $84,000 would get you the best rates \u2014 does that amount work for you, or would you prefer a different figure? Just share whatever feels comfortable and I\u2019ll adjust the numbers.",
    session: { ...session, stage: "down_payment_question", propertyAddress },
    blocks: [
      {
        type: "property_summary",
        data: {
          statusTitle: "Property search complete",
          heading: "Here\u2019s what we know about your future home",
          imageAlt: "Property photo",
          displayMode: "single",
          items: [
            {
              listingId: "10001001001",
              price: "$420,000",
              address: "12509 Coral Dr, Frisco TX, 75036",
              beds: 4,
              baths: 2,
              sqft: 2097,
            },
          ],
        },
      },
    ],
    thinkingSteps: PROPERTY_LOADING,
  };
}

function moveToAssetsQuestion(session: HomebuyingSession, downPaymentDecision: string): CaseyResponse {
  return {
    content:
      "Nice, that down payment works well with your profile. Next, I\u2019d like to pull in your Casey bank accounts \u2014 Checking, Savings, and Wealth Management \u2014 to verify you have the funds for this purchase. Just say yes and I\u2019ll do a quick review, or let me know if you\u2019d prefer to add accounts manually.",
    session: { ...session, stage: "assets_review_question", downPaymentDecision },
    thinkingSteps: NUMBERS_LOADING,
  };
}

export function moveToAssetsResult(session: HomebuyingSession, useAutoReview: boolean): CaseyResponse {
  return {
    content: useAutoReview
      ? "Here are the accounts I found linked to your Casey profile. You can choose which ones you\u2019d like to include for your qualification letter."
      : "No problem \u2014 once you add your asset information, you can continue with the application.",
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

export function buildApplicationSummary(session: HomebuyingSession) {
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

const AFFORDABILITY_QUALIFY_PHRASES = [
  "see how much i can qualify",
  "how much i can qualify",
  "qualify for",
  "buying power",
  "affordability estimate",
];

function buildAffordabilityResultResponse(session: HomebuyingSession): CaseyResponse {
  const income = session.affordabilityAnnualIncome ?? 0;
  const debts = session.affordabilityMonthlyDebts ?? 0;
  const dp: AffordabilityDownPayment = session.affordabilityDownPayment ?? { mode: "percent", value: 20 };
  const compute = computeAffordabilityEstimate({
    annualIncome: income,
    monthlyDebts: debts,
    downPayment: dp,
  });
  const card = formatAffordabilityResultCard(compute);
  return {
    content:
      "Here\u2019s a quick estimate based on what you shared. Principal and interest only \u2014 taxes, insurance, HOA, and PMI are not included.\n\nWhen you\u2019re ready, let me know if you\u2019d like to apply for a mortgage, adjust your numbers and rerun the estimate, or start over.",
    session: { ...session, stage: "affordability_result" },
    blocks: [
      { type: "status_line", data: { text: "Estimate ready" } },
      { type: "affordability_result", data: card },
    ],
    suggestions: [],
    thinkingSteps: NUMBERS_LOADING,
  };
}

export function getCreditThreadAfterWizard(session: HomebuyingSession): CaseyResponse {
  return {
    content:
      "We have all your information ready.\n\nNow what we need is to run a soft credit check to verify your eligibility. Just remember: this will not affect your credit score in any way.",
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
          "Great, let\u2019s get your home loan application started. Where are you right now in your home buying journey \u2014 still researching, actively making offers, or have you already signed a purchase contract? No wrong answers here, it just helps me tailor the next steps for you.",
        session: { stage: "journey_question" },
        thinkingSteps: START_LOADING,
      };
    }

    if (includesAny(normalized, AFFORDABILITY_QUALIFY_PHRASES)) {
      return {
        content:
          "I\u2019ll estimate how much you may be able to borrow based on your income, monthly debts, and down payment. This is only a rough guide \u2014 not a loan offer or financial advice.\n\nWhat is your annual gross income before taxes?",
        suggestions: [],
        session: { stage: "affordability_income" },
        thinkingSteps: NUMBERS_LOADING,
      };
    }

    return {
      content:
        "I\u2019m here to help you on your home buying journey. You can apply for a home loan, see how much you can qualify for, or search for homes in your area \u2014 just let me know what sounds good.",
      session,
    };
  }

  if (session.stage === "affordability_income") {
    const p = parseMoneyOrPercent(userMessage);
    if (!p.ok || p.isPercent) {
      return {
        content: "I appreciate you sharing that. For this step I need your annual gross income as a dollar amount \u2014 for example, 85000 or $85,000. What\u2019s your yearly income before taxes?",
        session,
        suggestions: [],
      };
    }
    return {
      content:
        "Got it, thanks for sharing that. What are your total minimum monthly payments on non-housing debts \u2014 things like car loans, credit cards, student loans, and similar? If you don\u2019t have any, just say 0.",
      suggestions: [],
      session: { ...session, affordabilityAnnualIncome: p.value, stage: "affordability_debts" },
      thinkingSteps: NUMBERS_LOADING,
    };
  }

  if (session.stage === "affordability_debts") {
    const p = parseMoneyOrPercent(userMessage);
    if (!p.ok || p.isPercent) {
      return {
        content: "No worries \u2014 I just need a monthly dollar amount for your non-housing debts. Something like 0, 350, or $500 works. If you don\u2019t have any monthly debts like that, 0 is perfectly fine.",
        session,
        suggestions: [],
      };
    }
    return {
      content:
        "Thanks, that helps me get a clearer picture. How much do you plan to put toward a down payment? You can share a percentage of the purchase price like 20%, or a dollar amount like $40,000.",
      suggestions: [],
      session: { ...session, affordabilityMonthlyDebts: p.value, stage: "affordability_down_payment" },
      thinkingSteps: NUMBERS_LOADING,
    };
  }

  if (session.stage === "affordability_down_payment") {
    const p = parseMoneyOrPercent(userMessage);
    if (!p.ok) {
      return {
        content: "I just need a number for the down payment \u2014 either a percentage like 20% or a dollar amount like $40,000. Whatever you\u2019re comfortable with works.",
        session,
        suggestions: [],
      };
    }
    const dp: AffordabilityDownPayment = p.isPercent
      ? { mode: "percent", value: Math.min(p.value, 100) }
      : { mode: "dollar", value: p.value };
    return buildAffordabilityResultResponse({
      ...session,
      affordabilityDownPayment: dp,
      stage: "affordability_down_payment",
    });
  }

  if (session.stage === "affordability_result") {
    if (includesAny(normalized, ["apply for a mortgage", "apply for a home loan"])) {
      return {
        content:
          "Great \u2014 let\u2019s build on your estimate with a full application. Where are you right now in your home buying journey \u2014 still researching, actively making offers, or have you already signed a purchase contract? This helps me figure out the best next steps.",
        session: { stage: "journey_question" },
        thinkingSteps: START_LOADING,
      };
    }
    if (includesAny(normalized, ["adjust my numbers", "adjust"])) {
      return {
        content: "Let\u2019s update your numbers. What is your annual gross income before taxes?",
        suggestions: [],
        session: { stage: "affordability_income" },
        thinkingSteps: NUMBERS_LOADING,
      };
    }
    if (includesAny(normalized, ["start over", "back to start"])) {
      return {
        content: "",
        suggestions: [],
        session: DEFAULT_SESSION,
      };
    }
    return fallback(session);
  }

  if (session.stage === "journey_question") {
    return {
      content:
        "Sounds like you\u2019re " + userMessage.trim().toLowerCase() + " \u2014 that\u2019s a great place to be. What\u2019s your timeline for purchasing \u2014 are you looking to move quickly, in the next few months, or sometime within the year? Knowing your pace helps me find the right loan options for your situation.",
      session: { ...session, stage: "timeline_question", journeyStage: userMessage },
      thinkingSteps: START_LOADING,
    };
  }

  if (session.stage === "timeline_question") {
    return nextBuyTimeline(session, userMessage);
  }

  if (session.stage === "agent_question") {
    if (normalized.length > 1) {
      return moveToAddressPrompt(session, userMessage);
    }
    return fallback(session);
  }

  if (session.stage === "address_prompt") {
    if (userMessage.trim().length < 5) {
      return fallback(session);
    }
    return moveToOfferRecommendation(session, userMessage.trim());
  }

  if (session.stage === "down_payment_question") {
    if (includesAny(normalized, ["yes", "20%", "works", "sounds good", "that works"])) {
      return moveToAssetsQuestion(session, userMessage);
    }

    if (/\$?\d+/.test(normalized)) {
      return moveToAssetsQuestion(session, userMessage);
    }

    return fallback(session);
  }

  if (session.stage === "assets_review_question") {
    if (includesAny(normalized, ["yes", "review", "sure", "go ahead", "do it"])) {
      return moveToAssetsResult(session, true);
    }
    if (includesAny(normalized, ["manually", "prefer to add", "myself", "manual"])) {
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
      content: "Use the credit check screens to continue \u2014 you can also tap Back if you need to change an answer.",
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
          "Your soft credit check was successful! You\u2019re eligible for the loan.\n\nWhat would you like to do next?",
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
        suggestions: [],
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
        suggestions: [],
        session: { ...session, stage: "confirmation" },
      };
    }
    if (includesAny(normalized, ["review loan", "review loan terms"])) {
      return {
        content:
          "Here\u2019s your application summary. Tap Confirm application when you\u2019re ready to submit your loan application.",
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
          "We\u2019ll connect you with a mortgage specialist. You can still confirm your application below whenever you\u2019re ready.",
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
