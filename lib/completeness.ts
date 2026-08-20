import type { Application } from "@/types/domain";
import type { StepKey } from "@/lib/constants";
import { getRequirementsSync } from "@/services/documents";

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
  return Boolean(
    j.registrationNumber &&
      j.examYear &&
      typeof j.score === "number" &&
      j.examType,
  );
}

export function areDocumentsComplete(a: Application): boolean {
  const required = getRequirementsSync(a.programme?.programmeId).filter(
    (r) => r.required,
  );
  return required.every((r) =>
    a.documents.some((d) => d.requirementId === r.id && Boolean(d.fileName)),
  );
}

export function isReviewComplete(a: Application): boolean {
  return a.confirmedAccuracy === true;
}

export const STEP_COMPLETENESS: Record<StepKey, (a: Application) => boolean> = {
  personal: isPersonalComplete,
  contact: isContactComplete,
  programme: isProgrammeComplete,
  education: isEducationComplete,
  olevel: isOlevelComplete,
  jamb: isJambComplete,
  documents: areDocumentsComplete,
  review: isReviewComplete,
};

export function computeStepStatus(a: Application): Record<StepKey, boolean> {
  return {
    personal: isPersonalComplete(a),
    contact: isContactComplete(a),
    programme: isProgrammeComplete(a),
    education: isEducationComplete(a),
    olevel: isOlevelComplete(a),
    jamb: isJambComplete(a),
    documents: areDocumentsComplete(a),
    review: isReviewComplete(a),
  };
}

export function progressPercent(a: Application): number {
  const keys = Object.keys(STEP_COMPLETENESS) as StepKey[];
  const done = keys.filter((k) => STEP_COMPLETENESS[k](a)).length;
  return Math.round((done / keys.length) * 100);
}

/** §16 submission validation — returns a list of human-readable blockers. */
export function validateForSubmission(a: Application, paid: boolean): string[] {
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
  if (!areDocumentsComplete(a))
    errors.push("One or more required documents are missing.");
  if (!isReviewComplete(a))
    errors.push("You must confirm the information is accurate.");
  if (!paid) errors.push("The application fee has not been paid.");
  return errors;
}
