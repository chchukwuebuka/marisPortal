import type {
  ApplicationStatus,
  DocumentStatus,
  ExamType,
  Gender,
  InvoiceStatus,
  JambExamType,
  MaritalStatus,
  OLevelGrade,
  PaymentStatus,
  ProgrammeLevel,
} from "./enums";

/* ---- Academic catalogue (§5) --------------------------------- */

export interface AcademicSession {
  id: string;
  name: string; // e.g. "2026/2027"
  isActive: boolean;
  applicationDeadline: string; // ISO date
}

export interface School {
  id: string;
  name: string;
  code: string;
}

export interface Department {
  id: string;
  schoolId: string;
  name: string;
  code: string;
}

export interface Programme {
  id: string;
  departmentId: string;
  schoolId: string;
  sessionId: string;
  name: string; // e.g. "ND Computer Science"
  level: ProgrammeLevel;
  code: string;
  option?: string | null;
  durationYears: number;
  applicationFee?: string;
  totalFee?: string;
  acceptingApplications: boolean;
  cutoffMark?: number | null;
}

/* ---- Application sections (§3–9) ----------------------------- */

export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  gender: Gender;
  nationality: string;
  stateOfOrigin: string;
  lga: string;
  maritalStatus: MaritalStatus;
  residentialAddress: string;
}

export interface ContactInfo {
  phone: string;
  altPhone?: string;
  email: string;
  residentialAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

export interface ProgrammeSelection {
  sessionId: string;
  schoolId: string;
  departmentId: string;
  programmeId: string;
}

export interface EducationRecord {
  id: string;
  institution: string;
  qualification: string;
  startYear: number;
  endYear: number;
}

export interface OLevelSubject {
  id: string;
  subject: string;
  grade: OLevelGrade;
}

export interface OLevelResult {
  id: string;
  examType: ExamType;
  examNumber: string;
  examYear: number;
  examCentre: string;
  subjects: OLevelSubject[];
}

export interface JambSubjectScore {
  id?: string;
  subject: string;
  score: number;
}

export interface JambInfo {
  registrationNumber: string;
  examYear: number;
  score: number;
  examType: JambExamType;
  firstChoiceInstitution: string;
  courseApplied: string;
  subjects?: JambSubjectScore[];
}

/* ---- Documents (§10–12) — reusable, admin-configured --------- */

export interface DocumentRequirement {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  allowedFileTypes: string[]; // e.g. ["pdf", "jpg", "png"]
  maxFileSizeMb: number;
  programmeId?: string | null; // null => applies to all programmes
  active: boolean;
}

export interface ApplicationDocument {
  id: string;
  requirementId: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileType?: string;
  objectUrl?: string; // in-memory preview URL (mock — no real storage)
  status: DocumentStatus;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  uploadedAt?: string;
}

/* ---- Payment (§14–15) ---------------------------------------- */

export interface InvoiceItem {
  label: string;
  amount: number;
}

export interface Invoice {
  id: string;
  applicationId: string;
  applicationNumber?: string | null;
  items: InvoiceItem[];
  total: number;
  status: InvoiceStatus;
  createdAt: string;
  paidAt?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  reference: string;
  amount: number;
  status: PaymentStatus;
  channel?: string;
  paidAt?: string;
}

/* ---- Status & admission (§18, §22–24) ------------------------ */

export type TimelineState = "done" | "current" | "upcoming";

export interface StatusEvent {
  id: string;
  label: string;
  note?: string;
  at?: string; // ISO datetime
  state: TimelineState;
}

export interface AdmissionDecision {
  id: string;
  applicationId: string;
  programmeName: string;
  departmentName: string;
  schoolName: string;
  sessionName: string;
  admissionType: string; // e.g. "Full Admission"
  decisionDate: string;
  conditions?: string;
  verificationCode: string; // e.g. "MAR-ADM-XXXXXXXX"
  accepted?: boolean;
}

/* ---- Notifications ------------------------------------------- */

export type NotificationCategory =
  | "application"
  | "payment"
  | "document"
  | "admission"
  | "account"
  | "general";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

/* ---- Applicant & application aggregate ----------------------- */

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * The application aggregate. During editing, section fields are Partial
 * (the applicant fills them progressively). Arrays default to empty.
 * This object is what the mock draft persists to localStorage.
 */
export interface Application {
  id: string;
  applicationNumber?: string | null; // assigned on submit
  applicantId: string;
  status: ApplicationStatus;

  personal?: Partial<PersonalInfo>;
  contact?: Partial<ContactInfo>;
  programme?: Partial<ProgrammeSelection>;
  education: EducationRecord[];
  olevel: OLevelResult[];
  presentingTwoSittings: boolean;
  jamb?: Partial<JambInfo>;
  documents: ApplicationDocument[];

  confirmedAccuracy: boolean;
  correctionComment?: string | null;
  decision?: AdmissionDecision | null;

  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}
