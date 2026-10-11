export type LegacyRegistrationStatus =
  | "pending"
  | "submitted"
  | "under_review"
  | "correction_required"
  | "approved"
  | "rejected";

export interface LegacyStudentDocument {
  id: number;
  requirement: number;
  requirement_name: string;
  requirement_code: string;
  file_url: string | null;
  original_filename: string;
  status: "pending" | "verified" | "rejected";
  status_display: string;
  review_comment?: string;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyRequirementChecklistItem {
  requirement: {
    id: number;
    name: string;
    code: string;
    description?: string;
    allowed_formats?: string[];
    allowed_extensions?: string[];
    allowed_file_types?: string;
    max_size_mb?: number;
    max_file_size?: number;
    required: boolean;
    applies_to: "admission" | "legacy" | "both";
    order?: number;
    active?: boolean;
  };
  document: LegacyStudentDocument | null;
}

export interface LegacyRegistrationEvent {
  id: number;
  action: string;
  from_status: string;
  to_status: string;
  note: string;
  actor_email: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface LegacyRegistrationDetail {
  id: number;
  matric_number: string;
  status: LegacyRegistrationStatus;
  status_display: string;
  is_editable: boolean;
  is_reviewable: boolean;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string;
  marital_status: string;
  nationality: string;
  state_of_origin: string;
  lga: string;
  religion: string;
  phone: string;
  email: string;
  address: string;
  guardian_name: string;
  guardian_relationship: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_address: string;
  guardian_occupation: string;
  programme: number | null;
  programme_name: string;
  department_name: string;
  school_name: string;
  admission_session: number | null;
  admission_session_name: string;
  current_level: number | null;
  current_level_name: string;
  correction_note: string;
  rejection_reason: string;
  submitted_at: string | null;
  submission_count: number;
  approved_at: string | null;
  student_id: string | null;
  documents: LegacyStudentDocument[];
  events: LegacyRegistrationEvent[];
  missing: {
    fields: string[];
    documents: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface LegacyStartInput {
  matric_number: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  password?: string;
  password_confirm?: string;
}

export interface LegacyProfileInput {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  state_of_origin?: string;
  lga?: string;
  religion?: string;
  phone?: string;
  email?: string;
  address?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_address?: string;
  guardian_occupation?: string;
  programme?: number;
  admission_session?: number;
  current_level?: number;
}
