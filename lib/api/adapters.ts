/**
 * Boundary mappers between the API wire shapes (snake_case, integer ids,
 * decimal strings) and the app's domain models (camelCase, string ids). Keeping
 * every field-name/casing/id conversion here lets the rest of the app keep
 * speaking the domain language it already speaks.
 */

import type {
  AcademicSession,
  AppNotification,
  ApplicationDocument,
  ContactInfo,
  Department,
  DocumentRequirement,
  EducationRecord,
  NotificationCategory,
  OLevelResult,
  OLevelSubject,
  PersonalInfo,
  Programme,
  School,
} from "@/types/domain";
import type {
  ExamType,
  Gender,
  MaritalStatus,
  OLevelGrade,
  ProgrammeLevel,
} from "@/types/enums";
import {
  EXAM_TYPES,
  GENDERS,
  MARITAL_STATUSES,
  OLEVEL_GRADES,
  PROGRAMME_LEVELS,
} from "@/types/enums";
import type {
  ApiAcademicSession,
  ApiApplicantProfile,
  ApiApplicantProfilePatch,
  ApiApplicationDocument,
  ApiDepartment,
  ApiDocumentRequirement,
  ApiEducationalBackground,
  ApiGender,
  ApiMaritalStatus,
  ApiNotification,
  ApiNotificationCategory,
  ApiOLevelResult,
  ApiOLevelSubject,
  ApiProgramme,
  ApiProgrammeType,
  ApiSchool,
} from "./types";

/* ---- Small utilities ----------------------------------------- */

/** API ids are integers; the domain uses strings. */
export const toApiId = (
  id: string | number | undefined | null,
): number | undefined => {
  if (id === undefined || id === null || id === "") return undefined;
  const n = Number(id);
  return Number.isFinite(n) ? n : undefined;
};

/** Parse a decimal-string amount (e.g. "10000.00") to a number. */
export function parseMoney(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

const inList = (list: readonly string[], v: string): boolean =>
  list.includes(v);

/** The API gender set is wider (adds "other"/blank); coerce to the form's set. */
const coerceGender = (v: ApiGender | undefined): Gender | undefined =>
  v && inList(GENDERS, v) ? (v as Gender) : undefined;

const coerceMarital = (
  v: ApiMaritalStatus | undefined,
): MaritalStatus | undefined =>
  v && inList(MARITAL_STATUSES, v) ? (v as MaritalStatus) : undefined;

const coerceExamType = (v: string): ExamType =>
  inList(EXAM_TYPES, v) ? (v as ExamType) : "WAEC";

const coerceGrade = (v: string): OLevelGrade =>
  inList(OLEVEL_GRADES, v) ? (v as OLevelGrade) : "F9";

const levelFromType = (t: ApiProgrammeType): ProgrammeLevel =>
  inList(PROGRAMME_LEVELS, t) ? (t as ProgrammeLevel) : "ND";

/* ---- Profile ↔ Personal + Contact ---------------------------- */
// One API profile backs the app's separate "personal" and "contact" sections.

export function profileToPersonal(
  p: ApiApplicantProfile,
): Partial<PersonalInfo> {
  return {
    firstName: p.first_name || undefined,
    middleName: p.middle_name || undefined,
    lastName: p.last_name || undefined,
    dateOfBirth: p.date_of_birth || undefined,
    gender: coerceGender(p.gender),
    nationality: p.nationality || undefined,
    stateOfOrigin: p.state_of_origin || undefined,
    lga: p.lga || undefined,
    maritalStatus: coerceMarital(p.marital_status),
    residentialAddress: p.residential_address || undefined,
  };
}

export function profileToContact(p: ApiApplicantProfile): Partial<ContactInfo> {
  return {
    phone: p.phone || undefined,
    altPhone: p.alt_phone || undefined,
    email: p.email || undefined,
    residentialAddress: p.residential_address || undefined,
    emergencyContactName: p.emergency_contact_name || undefined,
    emergencyContactPhone: p.emergency_contact_phone || undefined,
    emergencyContactRelationship: p.emergency_contact_relationship || undefined,
  };
}

export function personalToProfilePatch(
  d: Partial<PersonalInfo>,
): ApiApplicantProfilePatch {
  const patch: ApiApplicantProfilePatch = {};
  if (d.firstName !== undefined) patch.first_name = d.firstName;
  if (d.middleName !== undefined) patch.middle_name = d.middleName;
  if (d.lastName !== undefined) patch.last_name = d.lastName;
  if (d.dateOfBirth !== undefined) patch.date_of_birth = d.dateOfBirth || null;
  if (d.gender !== undefined) patch.gender = d.gender;
  if (d.nationality !== undefined) patch.nationality = d.nationality;
  if (d.stateOfOrigin !== undefined) patch.state_of_origin = d.stateOfOrigin;
  if (d.lga !== undefined) patch.lga = d.lga;
  if (d.maritalStatus !== undefined) patch.marital_status = d.maritalStatus;
  if (d.residentialAddress !== undefined)
    patch.residential_address = d.residentialAddress;
  return patch;
}

export function contactToProfilePatch(
  d: Partial<ContactInfo>,
): ApiApplicantProfilePatch {
  const patch: ApiApplicantProfilePatch = {};
  if (d.phone !== undefined) patch.phone = d.phone;
  if (d.altPhone !== undefined) patch.alt_phone = d.altPhone;
  if (d.residentialAddress !== undefined)
    patch.residential_address = d.residentialAddress;
  if (d.emergencyContactName !== undefined)
    patch.emergency_contact_name = d.emergencyContactName;
  if (d.emergencyContactPhone !== undefined)
    patch.emergency_contact_phone = d.emergencyContactPhone;
  if (d.emergencyContactRelationship !== undefined)
    patch.emergency_contact_relationship = d.emergencyContactRelationship;
  // Note: `email` is read-only on the profile (it's the account email), so it
  // is intentionally never patched here.
  return patch;
}

/* ---- Catalogue ----------------------------------------------- */

function idToStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object" && "id" in (v as Record<string, unknown>)) {
    return String((v as { id: unknown }).id);
  }
  return String(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDomainSession(s: any): AcademicSession {
  return {
    id: idToStr(s.id),
    name: s.name || s.title || "Current Session",
    isActive: Boolean(s.is_active ?? s.active ?? s.is_open ?? true),
    applicationDeadline: s.application_deadline ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDomainSchool(s: any): School {
  return {
    id: idToStr(s.id),
    name: s.name || s.title || s.faculty_name || "",
    code: s.code || s.short_name || "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDomainDepartment(d: any): Department {
  const schoolId = idToStr(d.school ?? d.school_id ?? d.faculty ?? d.faculty_id);
  return {
    id: idToStr(d.id),
    schoolId,
    name: d.name || d.title || d.department_name || "",
    code: d.code || d.short_name || "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDomainProgramme(p: any): Programme {
  const deptId = idToStr(p.department ?? p.department_id);
  const schoolId = idToStr(p.school ?? p.school_id ?? p.faculty ?? p.faculty_id);
  const accepting =
    typeof p.is_accepting_applications === "boolean"
      ? p.is_accepting_applications
      : typeof p.accepting_applications === "boolean"
      ? p.accepting_applications
      : typeof p.is_active === "boolean"
      ? p.is_active
      : typeof p.is_open === "boolean"
      ? p.is_open
      : true;

  const rawLevel = p.programme_type || p.level || "ND";
  const level = levelFromType(rawLevel as ApiProgrammeType);

  return {
    id: idToStr(p.id),
    departmentId: deptId,
    schoolId,
    sessionId: idToStr(p.session ?? p.session_id),
    name: p.name || p.title || p.programme_name || "",
    level,
    code: p.code || p.short_code || "",
    durationYears: typeof p.duration_years === "number" ? p.duration_years : 2,
    acceptingApplications: accepting,
  };
}

/** Fees for a programme, as numbers (source of truth for the invoice preview). */
export function programmeFees(p: ApiProgramme): {
  application: number;
  processing: number;
  total: number;
} {
  return {
    application: parseMoney(p.application_fee),
    processing: parseMoney(p.processing_fee),
    total: parseMoney(p.total_fee),
  };
}

/* ---- Education ----------------------------------------------- */

export function toDomainEducation(
  e: ApiEducationalBackground,
): EducationRecord {
  return {
    id: String(e.id),
    institution: e.institution,
    qualification: e.qualification,
    startYear: e.start_year ?? 0,
    endYear: e.end_year ?? 0,
  };
}

export function educationToRequest(e: {
  institution: string;
  qualification: string;
  startYear: number;
  endYear: number;
}) {
  return {
    institution: e.institution,
    qualification: e.qualification,
    start_year: e.startYear,
    end_year: e.endYear,
  };
}

/* ---- O'Level ------------------------------------------------- */

export function toDomainOlevelSubject(s: ApiOLevelSubject): OLevelSubject {
  return { id: String(s.id), subject: s.subject, grade: coerceGrade(s.grade) };
}

export function toDomainOlevel(r: ApiOLevelResult): OLevelResult {
  return {
    id: String(r.id),
    examType: coerceExamType(r.exam_type),
    examNumber: r.exam_number,
    examYear: r.exam_year,
    examCentre: r.exam_centre,
    subjects: r.subjects.map(toDomainOlevelSubject),
  };
}

/** The domain O'Level result carries no sitting index; the caller supplies it. */
export function olevelToRequest(r: OLevelResult, sitting: number) {
  return {
    exam_type: r.examType,
    exam_number: r.examNumber,
    exam_year: r.examYear,
    exam_centre: r.examCentre,
    sitting,
    subjects: r.subjects.map((s) => ({ subject: s.subject, grade: s.grade })),
  };
}

/* ---- Documents ----------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDomainRequirement(r: any): DocumentRequirement {
  const requirement = r?.requirement ?? r;

  let exts: string[] = ["pdf", "jpg", "jpeg", "png"];
  if (
    Array.isArray(requirement.allowed_extensions) &&
    requirement.allowed_extensions.length > 0
  ) {
    exts = requirement.allowed_extensions;
  } else if (
    Array.isArray(requirement.allowed_file_types) &&
    requirement.allowed_file_types.length > 0
  ) {
    exts = requirement.allowed_file_types;
  } else if (
    typeof requirement.allowed_file_types === "string" &&
    requirement.allowed_file_types.trim().length > 0
  ) {
    exts = requirement.allowed_file_types
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  } else if (
    typeof requirement.allowed_extensions === "string" &&
    requirement.allowed_extensions.trim().length > 0
  ) {
    exts = requirement.allowed_extensions
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  const rawSize = Number(
    requirement.max_file_size || requirement.max_file_size_mb || 5,
  );
  const maxMb =
    rawSize > 1000
      ? Math.max(1, Math.round(rawSize / (1024 * 1024)))
      : Math.max(1, Math.round(rawSize));

  const isRequired =
    typeof requirement.required === "boolean"
      ? requirement.required
      : typeof requirement.is_required === "boolean"
        ? requirement.is_required
        : true;

  const isActive =
    typeof requirement.active === "boolean"
      ? requirement.active
      : typeof requirement.is_active === "boolean"
        ? requirement.is_active
        : true;

  const progId =
    requirement.programme != null
      ? String(requirement.programme)
      : requirement.programme_id != null
        ? String(requirement.programme_id)
        : null;

  return {
    id: String(requirement.id),
    name:
      requirement.name || requirement.title || "Required Document",
    description: requirement.description || undefined,
    required: isRequired,
    allowedFileTypes: exts.map((e: string) =>
      e.replace(/^\./, "").toLowerCase(),
    ),
    maxFileSizeMb: maxMb,
    programmeId: progId,
    active: isActive,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDomainDocument(d: any): ApplicationDocument {
  return {
    id: String(d.id),
    requirementId: String(d.requirement ?? d.requirement_id),
    fileName: d.original_filename || d.file_name || (d.file ? d.file.split("/").pop() : undefined),
    objectUrl: d.file_url || d.file || undefined,
    status: d.status || "under_review",
    reviewComment: d.review_comment || undefined,
    reviewedAt: d.reviewed_at || undefined,
    uploadedAt: d.created_at || undefined,
  };
}

/* ---- Notifications ------------------------------------------- */

const NOTIFICATION_CATEGORIES: readonly NotificationCategory[] = [
  "application",
  "payment",
  "document",
  "admission",
  "account",
  "general",
];

const coerceCategory = (
  v: ApiNotificationCategory | string | undefined,
): NotificationCategory =>
  v && inList(NOTIFICATION_CATEGORIES, v) ? (v as NotificationCategory) : "general";

export function toDomainNotification(n: ApiNotification): AppNotification {
  return {
    id: String(n.id),
    title: n.title,
    message: n.message,
    category: coerceCategory(n.category),
    isRead: n.is_read,
    readAt: n.read_at || undefined,
    createdAt: n.created_at,
  };
}
