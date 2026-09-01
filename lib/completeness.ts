import type { Application, DocumentRequirement } from "@/types/domain";
import type { StepKey } from "@/lib/constants";

/* Per-section completeness (§16 uses these as the submission gate). */

export function isPersonalComplete(a: Application): boolean {
  const p = a.personal ?? {};
  return Boolean(
    p.firstName &&
      p.lastName &&
      p.dateOfBirth &&
      p.gender &&
      p.nationality &&
      p.stateOfOrigin &&
      p.lga &&
      p.maritalStatus &&
      p.residentialAddress,
  );
}

export function isContactComplete(a: Application): boolean {
  const c = a.contact ?? {};
  return Boolean(
    c.phone &&
      c.email &&
      c.residentialAddress &&
      c.emergencyContactName &&
      c.emergencyContactPhone &&
      c.emergencyContactRelationship,
  );
}

export function isProgrammeComplete(a: Application): boolean {
  const p = a.programme ?? {};
  return Boolean(p.sessionId && p.schoolId && p.departmentId && p.programmeId);
}

export function isEducationComplete(a: Application): boolean {
  return a.education.length > 0;
}

/** At least one sitting with ≥5 subjects including English & Mathematics. */
export function isOlevelComplete(a: Application): boolean {
  return a.olevel.some((r) => {
    if (!r.examType || !r.examNumber || !r.examYear) return false;
    if (r.subjects.length < 5) return false;
    const names = r.subjects.map((s) => s.subject.toLowerCase());
    return (
      names.includes("english language") && names.includes("mathematics")
    );
  });
}

export function isJambComplete(a: Application): boolean {
  const j = a.jamb ?? {};
  if (!j.registrationNumber || !j.examYear || !j.examType) return false;
  if (Array.isArray(j.subjects) && j.subjects.length === 4) {
    const subjects = j.subjects.map((s) => s.subject?.trim().toLowerCase() || "");
    const hasEnglish = subjects.some(
      (s) =>
        s === "use of english" ||
        s === "english" ||
        s === "english language",
    );
    const validScores = j.subjects.every(
      (s) => typeof s.score === "number" && s.score >= 0 && s.score <= 100,
    );
    return hasEnglish && validScores;
  }
  return typeof j.score === "number" && j.score > 0;
}

/**
 * Check if all required documents have been uploaded.
 * Accepts the requirements list as a parameter instead of calling a
 * synchronous mock function.
 */
export function areDocumentsComplete(
  a: Application,
  requirements: DocumentRequirement[] = [],
): boolean {
  const required = requirements.filter((r) => r.required);
  if (required.length === 0) {
    // If no requirements are loaded yet, consider documents incomplete
    // unless the applicant has uploaded at least one document
    return a.documents.length > 0;
  }
  return required.every((r) =>
    a.documents.some((d) => d.requirementId === r.id && Boolean(d.fileName)),
  );
}

export function isReviewComplete(a: Application): boolean {
  return a.confirmedAccuracy === true;
}

/** Build the step status map, accepting requirements for the documents check. */
export function computeStepStatus(
  a: Application,
  requirements: DocumentRequirement[] = [],
): Record<StepKey, boolean> {
  return {
    personal: isPersonalComplete(a),
    contact: isContactComplete(a),
    programme: isProgrammeComplete(a),
    education: isEducationComplete(a),
    olevel: isOlevelComplete(a),
    jamb: isJambComplete(a),
    documents: areDocumentsComplete(a, requirements),
    review: isReviewComplete(a),
  };
}

export function progressPercent(
  a: Application,
  requirements: DocumentRequirement[] = [],
): number {
  const status = computeStepStatus(a, requirements);
  const keys = Object.keys(status) as StepKey[];
  const done = keys.filter((k) => status[k]).length;
  return Math.round((done / keys.length) * 100);
}

/** §16 submission validation — returns a list of human-readable blockers. */
export function validateForSubmission(
  a: Application,
  paid: boolean,
  requirements: DocumentRequirement[] = [],
): string[] {
  const errors: string[] = [];
  if (!isPersonalComplete(a)) errors.push("Personal information is incomplete.");
  if (!isContactComplete(a)) errors.push("Contact information is incomplete.");
  if (!isProgrammeComplete(a)) errors.push("No programme has been selected.");
  if (!isEducationComplete(a))
    errors.push("Educational background is required.");
  if (!isOlevelComplete(a))
    errors.push(
      "O'Level result is incomplete (need ≥5 subjects including English & Mathematics).",
    );
  if (!isJambComplete(a)) errors.push("JAMB information is incomplete.");
  if (!areDocumentsComplete(a, requirements))
    errors.push("One or more required documents are missing.");
  if (!isReviewComplete(a))
    errors.push("You must confirm the information is accurate.");
  // Payment feature disabled for now — fee payment is not required to submit.
  // if (!paid) errors.push("The application fee has not been paid.");
  return errors;
}
