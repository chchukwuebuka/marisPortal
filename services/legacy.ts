import { api } from "@/lib/api";
import { setTokens } from "@/lib/api/tokens";
import type {
  LegacyProfileInput,
  LegacyRegistrationDetail,
  LegacyRegistrationEvent,
  LegacyRequirementChecklistItem,
  LegacyStartInput,
  LegacyStudentDocument,
} from "@/types/legacy";

export interface LegacyStartResponse {
  registration: LegacyRegistrationDetail;
  tokens?: {
    access: string;
    refresh: string;
  };
  message?: string;
}

export async function startLegacyRegistration(
  input: LegacyStartInput
): Promise<LegacyStartResponse> {
  const res = await api.post<LegacyStartResponse>(
    "/legacy-students/start/",
    input
  );
  if (res.tokens?.access) {
    setTokens({ access: res.tokens.access, refresh: res.tokens.refresh });
  }
  return res;
}

export async function getMyLegacyRegistration(): Promise<LegacyRegistrationDetail> {
  return api.get<LegacyRegistrationDetail>("/legacy-students/me/");
}

export async function updateMyLegacyProfile(
  input: Partial<LegacyProfileInput>
): Promise<LegacyRegistrationDetail> {
  return api.patch<LegacyRegistrationDetail>(
    "/legacy-students/me/profile/",
    input
  );
}

export async function getLegacyRequirements(): Promise<
  LegacyRequirementChecklistItem[]
> {
  return api.get<LegacyRequirementChecklistItem[]>(
    "/legacy-students/me/requirements/"
  );
}

export async function uploadLegacyDocument(
  requirementId: number,
  file: File
): Promise<LegacyStudentDocument> {
  const formData = new FormData();
  formData.append("requirement", String(requirementId));
  formData.append("file", file);

  return api.upload<LegacyStudentDocument>(
    "/legacy-students/me/documents/",
    formData
  );
}

export async function deleteLegacyDocument(
  documentId: number
): Promise<{ detail?: string }> {
  return api.del<{ detail?: string }>(
    `/legacy-students/me/documents/${documentId}/`
  );
}

export async function submitLegacyRegistration(
  declarationAccepted = true
): Promise<LegacyRegistrationDetail> {
  return api.post<LegacyRegistrationDetail>("/legacy-students/me/submit/", {
    declaration_accepted: declarationAccepted,
  });
}

export async function getLegacyTimeline(): Promise<LegacyRegistrationEvent[]> {
  return api.get<LegacyRegistrationEvent[]>("/legacy-students/me/timeline/");
}
