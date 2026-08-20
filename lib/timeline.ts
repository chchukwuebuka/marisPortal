import type { Application, StatusEvent } from "@/types/domain";

function ev(
  id: string,
  label: string,
  state: StatusEvent["state"],
  at?: string,
  note?: string,
): StatusEvent {
  return { id, label, state, at, note };
}

/**
 * Derive the applicant-facing status timeline (§18) from the application.
 * The journey is linear — draft → submitted → review → decision → offer →
 * accepted — with terminal branches for correction, rejection, and decline.
 */
export function buildTimeline(a: Application): StatusEvent[] {
  const { status: s, applicationNumber: num, createdAt, submittedAt } = a;
  const created = ev(
    "created",
    "Application created",
    "done",
    createdAt,
    "Your application draft was created.",
  );
  const submittedNote = num
    ? `Application ${num} submitted for review.`
    : undefined;
  const decisionAt = a.decision?.decisionDate;

  switch (s) {
    case "draft":
      return [
        created,
        ev(
          "submit",
          "Submit application",
          "current",
          undefined,
          "Complete every section, pay the fee, then submit for review.",
        ),
        ev("review", "Admissions review", "upcoming"),
        ev("decision", "Admission decision", "upcoming"),
      ];
    case "submitted":
    case "under_review":
      return [
        created,
        ev("submit", "Application submitted", "done", submittedAt, submittedNote),
        ev(
          "review",
          "Admissions review",
          "current",
          undefined,
          "Your application is being reviewed by the admissions office.",
        ),
        ev("decision", "Admission decision", "upcoming"),
      ];
    case "correction_required":
      return [
        created,
        ev("submit", "Application submitted", "done", submittedAt, submittedNote),
        ev(
          "review",
          "Correction requested",
          "current",
          undefined,
          a.correctionComment ??
            "The admissions office has requested changes to your application.",
        ),
        ev("decision", "Admission decision", "upcoming"),
      ];
    case "approved":
      return [
        created,
        ev("submit", "Application submitted", "done", submittedAt, submittedNote),
        ev("review", "Admissions review", "done"),
        ev(
          "decision",
          "Application approved",
          "current",
          undefined,
          "Congratulations — your application has been approved.",
        ),
        ev("offer", "Admission offer", "upcoming"),
      ];
    case "admitted":
      return [
        created,
        ev("submit", "Application submitted", "done", submittedAt, submittedNote),
        ev("review", "Admissions review", "done"),
        ev("decision", "Application approved", "done"),
        ev(
          "offer",
          "Admission offered",
          "current",
          decisionAt,
          "You have an admission offer. Review and accept it to proceed.",
        ),
        ev("accept", "Accept admission", "upcoming"),
      ];
    case "accepted":
      return [
        created,
        ev("submit", "Application submitted", "done", submittedAt, submittedNote),
        ev("review", "Admissions review", "done"),
        ev("offer", "Admission offered", "done", decisionAt),
        ev(
          "accept",
          "Admission accepted",
          "done",
          undefined,
          "You have accepted your admission. Welcome to Marist Polytechnic!",
        ),
      ];
    case "declined":
      return [
        created,
        ev("submit", "Application submitted", "done", submittedAt, submittedNote),
        ev("review", "Admissions review", "done"),
        ev("offer", "Admission offered", "done", decisionAt),
        ev(
          "accept",
          "Admission declined",
          "current",
          undefined,
          "You declined the admission offer for this session.",
        ),
      ];
    case "rejected":
      return [
        created,
        ev("submit", "Application submitted", "done", submittedAt, submittedNote),
        ev("review", "Admissions review", "done"),
        ev(
          "decision",
          "Application not successful",
          "current",
          undefined,
          "Unfortunately your application was not successful this session.",
        ),
      ];
    default:
      return [created];
  }
}
