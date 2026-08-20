import type { DocumentRequirement } from "@/types/domain";
import { DOCUMENT_REQUIREMENTS, delay } from "./mock/data";

function filterRequirements(programmeId?: string | null): DocumentRequirement[] {
  return DOCUMENT_REQUIREMENTS.filter(
    (r) => r.active && (r.programmeId == null || r.programmeId === programmeId),
  );
}

/** Async: the document requirements that apply to a programme (null => all). */
export async function getRequirements(
  programmeId?: string | null,
): Promise<DocumentRequirement[]> {
  await delay();
  return filterRequirements(programmeId);
}

/** Sync variant for completeness checks that must run without awaiting. */
export function getRequirementsSync(
  programmeId?: string | null,
): DocumentRequirement[] {
  return filterRequirements(programmeId);
}

export const findRequirement = (id: string): DocumentRequirement | undefined =>
  DOCUMENT_REQUIREMENTS.find((r) => r.id === id);
