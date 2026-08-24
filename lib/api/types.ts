/**
 * Wire shapes for the Marist Admissions API (snake_case, exactly as the Django
 * REST backend returns them). These are the boundary types; conversion to the
 * app's camelCase domain models lives in `adapters.ts`. Derived from the live
 * OpenAPI schema at http://158.220.95.120/api/docs/.
 */

/* ---- Auth ---------------------------------------------------- */

export interface ApiTokenPair {
  access: string;
  refresh: string;
}

/**
 * GET /auth/me/ — the schema declares no body, so this is kept permissive.
 * We rely on /applicant/profile/ for the richer identity used in the UI.
 */
export interface ApiAuthUser {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  is_verified?: boolean;
  is_staff?: boolean;
  [key: string]: unknown;
}

/* ---- Profile ------------------------------------------------- */

export type ApiGender = "male" | "female" | "other" | "";
export type ApiMaritalStatus =
  | "single"
  | "married"
  | "divorced"
  | "widowed"
  | "";

export interface ApiApplicantProfile {
  id: number;
  email: string;
  full_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: ApiGender;
  nationality: string;
  state_of_origin: string;
  lga: string;
  marital_status: ApiMaritalStatus;
  phone: string;
  alt_phone: string;
  residential_address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  personal_complete: boolean;
  contact_complete: boolean;
  updated_at: string;
}

/** Body for PATCH /applicant/profile/ (all fields optional). */
export interface ApiApplicantProfilePatch {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  date_of_birth?: string | null;
  gender?: ApiGender;
  nationality?: string;
  state_of_origin?: string;
  lga?: string;
  marital_status?: ApiMaritalStatus;
  phone?: string;
  alt_phone?: string;
  residential_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

/* ---- Catalogue ----------------------------------------------- */

export interface ApiAcademicSession {
  id: number;
  name: string;
  application_start: string | null;
  application_deadline: string | null;
  is_active: boolean;
  is_open: boolean;
}

export interface ApiSchool {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface ApiDepartment {
  id: number;
  school: number;
  school_name: string;
  name: string;
  code: string;
  is_active: boolean;
}

export type ApiProgrammeType = "ND" | "HND" | "CERT";

export interface ApiProgramme {
  id: number;
  department: number;
  department_name: string;
  school: number;
  school_name: string;
  name: string;
  code: string;
  programme_type: ApiProgrammeType;
  programme_type_display: string;
  duration_years: number;
  application_fee: string; // decimal string, e.g. "10000.00"
  processing_fee: string;
  total_fee: string;
  is_accepting_applications: boolean;
}

/* ---- Application --------------------------------------------- */

export type ApiApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "correction_required"
  | "approved"
  | "rejected"
  | "admitted"
  | "accepted"
  | "declined";

export interface ApiApplicationList {
  id: number;
  application_number: string | null;
  applicant_name: string;
  applicant_email: string;
  status: ApiApplicationStatus;
  status_display: string;
  programme: number | null;
  programme_name: string | null;
  session: number;
  session_name: string;
  payment_status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** POST /applications/ response. */
export interface ApiApplicationCreate {
  id: number;
  session: number;
  programme: number | null;
}

export type ApiExamType = "WAEC" | "NECO" | "NABTEB" | "GCE";
export type ApiGrade =
  | "A1"
  | "B2"
  | "B3"
  | "C4"
  | "C5"
  | "C6"
  | "D7"
  | "E8"
  | "F9";

export interface ApiEducationalBackground {
  id: number;
  institution: string;
  qualification: string;
  start_year: number | null;
  end_year: number | null;
}

export interface ApiOLevelSubject {
  id: number;
  subject: string;
  grade: ApiGrade;
}

export interface ApiOLevelResult {
  id: number;
  exam_type: ApiExamType;
  exam_number: string;
  exam_year: number;
  exam_centre: string;
  sitting: number;
  subjects: ApiOLevelSubject[];
}

export interface ApiStatusHistory {
  id: number;
  status: ApiApplicationStatus;
  status_display: string;
  note: string;
  changed_by_email: string;
  created_at: string;
}

export interface ApiCorrectionRequest {
  id: number;
  message: string;
  requested_by_email: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface ApiApplicationDetail {
  id: number;
  application_number: string | null;
  status: ApiApplicationStatus;
  status_display: string;
  is_editable: boolean;
  session: number;
  session_name: string;
  programme: number | null;
  programme_detail: ApiProgramme | null;
  declaration_accepted: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  applicant: ApiApplicantProfile;
  education: ApiEducationalBackground[];
  olevel_results: ApiOLevelResult[];
  /** Read-only string summary in the schema; JAMB CRUD is a separate endpoint. */
  jamb: string | null;
  status_history: ApiStatusHistory[];
  correction_requests: ApiCorrectionRequest[];
}

/* ---- Documents ----------------------------------------------- */

export type ApiDocumentStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "correction_required";

export interface ApiDocumentRequirement {
  id: number;
  name: string;
  code: string;
  description: string;
  required: boolean;
  allowed_file_types: string; // comma-separated, e.g. "pdf,jpg,png"
  allowed_extensions: string[];
  max_file_size: number; // bytes
  programme: number | null;
  active: boolean;
  order: number;
}

export interface ApiApplicationDocument {
  id: number;
  requirement: number;
  requirement_name: string;
  requirement_code: string;
  file_url: string | null;
  original_filename: string;
  status: ApiDocumentStatus;
  status_display: string;
  review_comment: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/* ---- Notifications ------------------------------------------- */

export type ApiNotificationCategory =
  | "application"
  | "payment"
  | "document"
  | "admission"
  | "account"
  | "general";

export interface ApiNotification {
  id: number;
  title: string;
  message: string;
  category: ApiNotificationCategory;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/* ---- Generic ------------------------------------------------- */

export interface ApiPaginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
