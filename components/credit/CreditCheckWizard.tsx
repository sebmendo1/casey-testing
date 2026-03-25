"use client";

import type { CreditFormData } from "@/lib/types";
import { formatSsnInput, maskSsn } from "@/lib/creditUtils";
import DisclosureLinkButton from "@/components/DisclosureLinkButton";

interface CreditCheckWizardProps {
  stage: "credit_intro" | "credit_ssn" | "credit_address" | "credit_review";
  draft: CreditFormData;
  onDraftChange: (next: CreditFormData) => void;
  onContinueIntro: () => void;
  onContinueSsn: () => void;
  onContinueAddress: () => void;
  onSubmitReview: () => void;
  onBack: () => void;
  onExitToChat: () => void;
}

function CreditCardHeroIcon() {
  return (
    <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-3xl bg-[#0028550d]">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
        <rect x="16" y="32" width="88" height="56" rx="10" fill="#002855" fillOpacity="0.12" />
        <rect x="24" y="44" width="40" height="8" rx="2" fill="#002855" fillOpacity="0.35" />
        <rect x="24" y="60" width="72" height="6" rx="2" fill="#002855" fillOpacity="0.2" />
        <path
          d="M78 24l12 8v16l-12 8-12-8V32l12-8z"
          fill="#002855"
          fillOpacity="0.25"
        />
        <path
          d="M78 34l6 4v8l-6 4-6-4v-8l6-4z"
          fill="var(--success-green)"
          fillOpacity="0.9"
        />
      </svg>
    </div>
  );
}

export default function CreditCheckWizard({
  stage,
  draft,
  onDraftChange,
  onContinueIntro,
  onContinueSsn,
  onContinueAddress,
  onSubmitReview,
  onBack,
  onExitToChat,
}: CreditCheckWizardProps) {
  const canContinueSsn = draft.ssn.replace(/\D/g, "").length === 9;
  const canContinueAddress =
    draft.street.trim().length > 0 && draft.city.trim().length > 0 && draft.state.trim().length > 0 && draft.zip.trim().length >= 4;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#FAFBFF]" data-no-row-select="true">
      <div className="chat-shell flex flex-1 flex-col overflow-y-auto px-6 pb-8 pt-6">
        {stage === "credit_intro" && (
          <>
            <button
              type="button"
              onClick={onExitToChat}
              className="mb-4 self-start text-[15px] font-medium text-[#00285599] underline-offset-2 hover:underline"
            >
              Back to chat
            </button>
            <h1 className="text-center text-[22px] font-semibold leading-tight text-[var(--text-primary)]">Credit check</h1>
            <p className="mt-4 text-center text-[15px] leading-relaxed text-[var(--text-secondary)]">
              We need to run a soft credit check to see what you qualify for. This won&apos;t impact your credit score.
            </p>
            <div className="mt-10">
              <CreditCardHeroIcon />
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-10">
              <button
                type="button"
                onClick={onContinueIntro}
                className="w-full rounded-[1.25rem] bg-[#002855] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_14px_rgba(0,40,85,0.2)]"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {stage === "credit_ssn" && (
          <>
            <button type="button" onClick={onBack} className="mb-4 self-start text-[15px] font-medium text-[#00285599]">
              Back
            </button>
            <h1 className="text-[22px] font-semibold leading-tight text-[var(--text-primary)]">
              What is your Social Security Number?
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
              We use your SSN to verify your identity and pull your credit report.
            </p>
            <label className="mt-8 block">
              <span className="text-[13px] font-medium text-[#00285599]">SSN</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={draft.ssn}
                onChange={(e) => onDraftChange({ ...draft, ssn: formatSsnInput(e.target.value) })}
                placeholder="000-00-0000"
                aria-invalid={!canContinueSsn && draft.ssn.length > 0}
                aria-describedby="ssn-hint"
                className="mt-2 w-full rounded-xl border border-[#0028552e] bg-white px-4 py-3.5 text-[16px] text-[#002855] outline-none ring-[#00285534] focus:ring-2"
              />
            </label>
            <p id="ssn-hint" className="mt-2 text-[13px] leading-snug text-[color:var(--text-muted)]">
              {canContinueSsn ? "SSN looks complete." : "Enter a 9-digit SSN to continue."}
            </p>
            <p className="mt-4 flex items-center gap-2 text-[13px] text-[#00285599]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 2L4 7v5c0 5 3.5 9.5 8 10.5 4.5-1 8-5.5 8-10.5V7l-8-5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              Your data is encrypted and secure.
            </p>
            <div className="mt-auto flex flex-col gap-3 pt-10">
              <button
                type="button"
                disabled={!canContinueSsn}
                onClick={onContinueSsn}
                className="w-full rounded-[1.25rem] bg-[#002855] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_14px_rgba(0,40,85,0.2)] disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {stage === "credit_address" && (
          <>
            <button type="button" onClick={onBack} className="mb-4 self-start text-[15px] font-medium text-[#00285599]">
              Back
            </button>
            <h1 className="text-[22px] font-semibold leading-tight text-[var(--text-primary)]">
              What is your current home address?
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">This helps us verify your identity.</p>
            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="text-[13px] font-medium text-[#00285599]">Street address</span>
                <input
                  type="text"
                  value={draft.street}
                  onChange={(e) => onDraftChange({ ...draft, street: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-[#0028552e] bg-white px-4 py-3.5 text-[16px] text-[#002855] outline-none ring-[#00285534] focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-[#00285599]">Apt, unit, etc (optional)</span>
                <input
                  type="text"
                  value={draft.apt}
                  onChange={(e) => onDraftChange({ ...draft, apt: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-[#0028552e] bg-white px-4 py-3.5 text-[16px] text-[#002855] outline-none ring-[#00285534] focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-[#00285599]">City</span>
                <input
                  type="text"
                  value={draft.city}
                  onChange={(e) => onDraftChange({ ...draft, city: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-[#0028552e] bg-white px-4 py-3.5 text-[16px] text-[#002855] outline-none ring-[#00285534] focus:ring-2"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[13px] font-medium text-[#00285599]">State</span>
                  <input
                    type="text"
                    value={draft.state}
                    onChange={(e) => onDraftChange({ ...draft, state: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-[#0028552e] bg-white px-4 py-3.5 text-[16px] text-[#002855] outline-none ring-[#00285534] focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-medium text-[#00285599]">Zip code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.zip}
                    onChange={(e) => onDraftChange({ ...draft, zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                    className="mt-2 w-full rounded-xl border border-[#0028552e] bg-white px-4 py-3.5 text-[16px] text-[#002855] outline-none ring-[#00285534] focus:ring-2"
                  />
                </label>
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-10">
              <button
                type="button"
                disabled={!canContinueAddress}
                onClick={onContinueAddress}
                className="w-full rounded-[1.25rem] bg-[#002855] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_14px_rgba(0,40,85,0.2)] disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {stage === "credit_review" && (
          <>
            <button type="button" onClick={onBack} className="mb-4 self-start text-[15px] font-medium text-[#00285599]">
              Back
            </button>
            <h1 className="text-[22px] font-semibold leading-tight text-[var(--text-primary)]">Review your information</h1>
            <div className="mt-8 space-y-6">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#00285599]">Personal info</p>
                <p className="mt-2 text-[15px] text-[#002855]">SSN {maskSsn(draft.ssn)}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#00285599]">Home address</p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#002855]">
                  {draft.street}
                  {draft.apt ? `, ${draft.apt}` : ""}
                  <br />
                  {draft.city}, {draft.state} {draft.zip}
                </p>
              </div>
            </div>
            <p className="mt-8 text-[12px] leading-[1.6] text-[#00285599]">
              By clicking &apos;Submit&apos;, you agree to our{" "}
              <DisclosureLinkButton className="text-[12px]">Credit Report Authorization</DisclosureLinkButton> and{" "}
              <DisclosureLinkButton className="text-[12px]">Terms of Use</DisclosureLinkButton>.
            </p>
            <div className="mt-auto flex flex-col gap-3 pt-10">
              <button
                type="button"
                onClick={onSubmitReview}
                className="w-full rounded-[1.25rem] bg-[#002855] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_14px_rgba(0,40,85,0.2)]"
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
