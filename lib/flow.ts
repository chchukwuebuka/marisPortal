import type { Application } from "@/types/domain";
import { APPLICATION_STEPS, stepPath, type StepKey } from "./constants";

const SUBMIT_HREF = "/applicant/application/submit";

/** Previous/next navigation targets for a given step in the flow. */
export function stepNav(key: StepKey): { prevHref: string; nextHref: string } {
  const idx = APPLICATION_STEPS.findIndex((s) => s.key === key);
  const prev = idx > 0 ? APPLICATION_STEPS[idx - 1] : undefined;
  const next =
    idx >= 0 && idx < APPLICATION_STEPS.length - 1
      ? APPLICATION_STEPS[idx + 1]
      : undefined;
  return {
    prevHref: prev ? stepPath(prev.key) : "/applicant/dashboard",
    nextHref: next ? stepPath(next.key) : SUBMIT_HREF,
  };
}

export interface NextAction {
  label: string;
  href: string;
  hint?: string;
}

/**
 * The single most important thing the applicant should do next, derived from
 * application status + section completeness + payment. Used by the dashboard
 * CTA and the status page.
 */
export function getNextAction(
  application: Application,
  stepStatus: Record<StepKey, boolean>,
  paid: boolean,
): NextAction {
  switch (application.status) {
    case "draft": {
      const firstIncomplete = APPLICATION_STEPS.find((s) => !stepStatus[s.key]);
      if (firstIncomplete) {
        return {
          label: "Continue application",
          href: stepPath(firstIncomplete.key),
          hint: `Next: ${firstIncomplete.label}`,
        };
      }
      // Payment feature disabled for now — skip the "pay the fee" gate and go
      // straight to submission once all sections are complete.
      // if (!paid) {
      //   return {
      //     label: "Pay application fee",
      //     href: "/applicant/payments",
      //     hint: "All sections complete — pay the fee to submit",
      //   };
      // }
      return {
        label: "Submit application",
        href: "/applicant/application/submit",
        hint: "Everything is ready — submit for review",
      };
    }
    case "correction_required":
      return {
        label: "Make corrections",
        href: "/applicant/application/review",
        hint: "Admissions requested changes to your application",
      };
    case "admitted":
      return {
        label: "View admission offer",
        href: "/applicant/admission",
        hint: "Congratulations — you have an admission offer",
      };
    case "accepted":
      return {
        label: "View admission letter",
        href: "/applicant/admission",
      };
    case "submitted":
    case "under_review":
    case "approved":
    case "rejected":
    case "declined":
    default:
      return {
        label: "View application status",
        href: "/applicant/status",
      };
  }
}
