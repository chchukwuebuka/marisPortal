/**
 * The application aggregate and all its sub-resources. Everything here speaks
 * the API wire shapes (snake_case, integer ids); `ApplicationProvider` assembles
 * these into the app's single `Application` domain object via the adapters.
 *
 * Endpoint id note: the detail/patch routes use `{id}` while every sub-resource
 * route uses `{application_id}` — both are the same server-owned integer.
 */

import { api } from "@/lib/api";
import { educationToRequest, olevelToRequest } from "@/lib/api/adapters";
import type {
  ApiApplicationCreate,
  ApiApplicationDetail,
  ApiApplicationList,
  ApiEducationalBackground,
  ApiOLevelResult,
  ApiStatusHistory,
} from "@/lib/api/types";
import type { EducationRecord, JambInfo, OLevelResult } from "@/types/domain";

const base = (appId: number | string) => `/applications/${appId}`;

/* ---- Application ---------------------------------------------- */

/** GET /applications/ — the applicant's applications (plain array). */
export function listApplications(): Promise<ApiApplicationList[]> {
  return api.get<ApiApplicationList[]>("/applications/");
}

/** POST /applications/ — start an application for a session (+ optional programme). */
export function createApplication(
  sessionId: number,
  programmeId?: number,
): Promise<ApiApplicationCreate> {
  return api.post<ApiApplicationCreate>("/applications/", {
    session: sessionId,
    ...(programmeId != null ? { programme: programmeId } : {}),
  });
}

/** GET /applications/{id}/ — the full application detail. */
export function getApplication(id: number): Promise<ApiApplicationDetail> {
  return api.get<ApiApplicationDetail>(`${base(id)}/`);
}

/** PATCH /applications/{id}/ — only the programme selection is writable here. */
export function updateApplicationProgramme(
  id: number,
  data: { session?: number; programme?: number },
): Promise<{ session: number; programme: number | null }> {
  return api.patch(`${base(id)}/`, data);
}

/**
 * POST /applications/{id}/submit/ — server records the submission, assigns the
 * application number and advances status. Returns no body, so the caller should
 * re-fetch the detail afterwards.
 */
export async function submitApplication(
  id: number,
  declarationAccepted: boolean = true,
): Promise<void> {
  await api.post<void>(`${base(id)}/submit/`, {
    declaration_accepted: declarationAccepted,
  });
}

/* ---- Educational background ----------------------------------- */

export function listEducation(
  appId: number,
): Promise<ApiEducationalBackground[]> {
  return api.get<ApiEducationalBackground[]>(`${base(appId)}/education/`);
}

export function createEducation(
  appId: number,
  record: EducationRecord,
): Promise<ApiEducationalBackground> {
  return api.post<ApiEducationalBackground>(
    `${base(appId)}/education/`,
    educationToRequest(record),
  );
}

export function updateEducation(
  appId: number,
  eduId: number,
  record: EducationRecord,
): Promise<ApiEducationalBackground> {
  return api.put<ApiEducationalBackground>(
    `${base(appId)}/education/${eduId}/`,
    educationToRequest(record),
  );
}

export function deleteEducation(appId: number, eduId: number): Promise<void> {
  return api.del<void>(`${base(appId)}/education/${eduId}/`);
}

/* ---- O'Level results ------------------------------------------ */

export function listOlevel(appId: number): Promise<ApiOLevelResult[]> {
  return api.get<ApiOLevelResult[]>(`${base(appId)}/olevel-results/`);
}

export function createOlevel(
  appId: number,
  result: OLevelResult,
  sitting: number,
): Promise<ApiOLevelResult> {
  return api.post<ApiOLevelResult>(
    `${base(appId)}/olevel-results/`,
    olevelToRequest(result, sitting),
  );
}

export function updateOlevel(
  appId: number,
  olevelId: number,
  result: OLevelResult,
  sitting: number,
): Promise<ApiOLevelResult> {
  return api.put<ApiOLevelResult>(
    `${base(appId)}/olevel-results/${olevelId}/`,
    olevelToRequest(result, sitting),
  );
}

export function deleteOlevel(appId: number, olevelId: number): Promise<void> {
  return api.del<void>(`${base(appId)}/olevel-results/${olevelId}/`);
}

/* ---- JAMB ----------------------------------------------------- */
// The JAMB endpoint declares no request/response schema in the OpenAPI doc.
// These snake_case field names are the best-guess mapping and are the one place
// to adjust once the live shape is confirmed (see the plan's known-unknowns).

/** GET /applications/{id}/jamb/ — parsed permissively into domain shape. */
export async function getJamb(appId: number): Promise<Partial<JambInfo> | null> {
  const raw = await api.get<unknown>(`${base(appId)}/jamb/`);
  return parseJamb(raw);
}

/** PUT /applications/{id}/jamb/ — upsert the JAMB record. */
export async function putJamb(
  appId: number,
  data: Partial<JambInfo>,
): Promise<Partial<JambInfo> | null> {
  const raw = await api.put<unknown>(`${base(appId)}/jamb/`, jambToRequest(data));
  return parseJamb(raw);
}

function jambToRequest(d: Partial<JambInfo>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (d.registrationNumber !== undefined)
    body.registration_number = d.registrationNumber;
  if (d.examYear !== undefined) body.exam_year = d.examYear;
  if (d.score !== undefined) body.score = d.score;
  if (d.examType !== undefined) body.exam_type = d.examType;
  if (d.firstChoiceInstitution !== undefined)
    body.first_choice_institution = d.firstChoiceInstitution;
  if (d.courseApplied !== undefined) body.course_applied = d.courseApplied;
  return body;
}

function parseJamb(raw: unknown): Partial<JambInfo> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const num = (v: unknown) =>
    typeof v === "number" ? v : typeof v === "string" && v ? Number(v) : undefined;
  const out: Partial<JambInfo> = {};
  const reg = str(o.registration_number);
  if (reg !== undefined) out.registrationNumber = reg;
  const yr = num(o.exam_year);
  if (yr !== undefined) out.examYear = yr;
  const sc = num(o.score);
  if (sc !== undefined) out.score = sc;
  const et = str(o.exam_type);
  if (et !== undefined) out.examType = et as JambInfo["examType"];
  const inst = str(o.first_choice_institution);
  if (inst !== undefined) out.firstChoiceInstitution = inst;
  const course = str(o.course_applied);
  if (course !== undefined) out.courseApplied = course;
  return out;
}

/* ---- Admission decision --------------------------------------- */

/** POST /applications/{id}/accept/ — applicant accepts an admission offer. */
export async function acceptAdmission(appId: number): Promise<void> {
  await api.post<void>(`${base(appId)}/accept/`);
}

/** POST /applications/{id}/decline/ — applicant declines an admission offer. */
export async function declineAdmission(appId: number): Promise<void> {
  await api.post<void>(`${base(appId)}/decline/`);
}

/**
 * GET /applications/{id}/timeline/ — status history (undeclared body). Parsed
 * permissively: accepts a bare array or a wrapped `{results|timeline|history}`.
 */
export async function getTimeline(appId: number): Promise<ApiStatusHistory[]> {
  const raw = await api.get<unknown>(`${base(appId)}/timeline/`);
  if (Array.isArray(raw)) return raw as ApiStatusHistory[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["results", "timeline", "history", "events"]) {
      if (Array.isArray(o[key])) return o[key] as ApiStatusHistory[];
    }
  }
  return [];
}

/** GET /applications/{id}/admission-letter/ — raw response (shape TBD live). */
export function getAdmissionLetter(appId: number): Promise<unknown> {
  return api.get<unknown>(`${base(appId)}/admission-letter/`);
}
