/** Enumerations for the admissions domain (string unions + iterable const arrays). */

export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "correction_required",
  "approved",
  "rejected",
  "admitted",
  "accepted",
  "declined",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const DOCUMENT_STATUSES = [
  "pending",
  "under_review",
  "verified",
  "rejected",
  "correction_required",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

// Mirrors the API's O'Level exam types (includes GCE).
export const EXAM_TYPES = ["WAEC", "NECO", "NABTEB", "GCE"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

/** WAEC/NECO grading scale, best (A1) to worst (F9). */
export const OLEVEL_GRADES = [
  "A1",
  "B2",
  "B3",
  "C4",
  "C5",
  "C6",
  "D7",
  "E8",
  "F9",
] as const;
export type OLevelGrade = (typeof OLEVEL_GRADES)[number];

/** A grade is a credit pass if C6 or better. */
export const CREDIT_GRADES: OLevelGrade[] = ["A1", "B2", "B3", "C4", "C5", "C6"];

export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

export const MARITAL_STATUSES = [
  "single",
  "married",
  "divorced",
  "widowed",
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

// Mirrors the API's programme types (ND / BSC / BENG / CERT).
export const PROGRAMME_LEVELS = ["ND", "BSC", "BENG", "DEGREE", "CERT"] as const;
export type ProgrammeLevel = (typeof PROGRAMME_LEVELS)[number];

export const ENTRY_MODES = [
  "UTME",
  "DE",
  "INTERNATIONAL",
  "JUPEB",
  "TRANSFER",
] as const;
export type EntryMode = (typeof ENTRY_MODES)[number];

export const ENTRY_MODE_OPTIONS: { value: EntryMode; label: string; badge: string; description: string }[] = [
  {
    value: "UTME",
    label: "UTME (100 Level)",
    badge: "100 Level",
    description: "Standard UTME admission for candidates with official JAMB UTME score.",
  },
  {
    value: "DE",
    label: "Direct Entry (200 Level)",
    badge: "200 Level",
    description: "For holders of National Diploma (ND), NCE, HND, or GCE A-Level seeking 200 Level admission.",
  },
  {
    value: "INTERNATIONAL",
    label: "International Student",
    badge: "International",
    description: "For foreign / non-Nigerian applicants applying with foreign high school qualifications.",
  },
  {
    value: "JUPEB",
    label: "JUPEB / IJMB Foundation",
    badge: "Foundation / DE",
    description: "For candidates with completed JUPEB or IJMB Advanced Level qualifications.",
  },
  {
    value: "TRANSFER",
    label: "Inter-University Transfer",
    badge: "Transfer",
    description: "For students currently enrolled in recognized universities or polytechnics seeking transfer.",
  },
];

export const JAMB_EXAM_TYPES = ["UTME", "Direct Entry"] as const;
export type JambExamType = (typeof JAMB_EXAM_TYPES)[number];

export const INVOICE_STATUSES = ["unpaid", "paid"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "successful", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const STUDENT_STATUSES = [
  "provisional",
  "active",
  "suspended",
  "graduated",
  "withdrawn",
  "deferred",
] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const USER_ROLES = [
  "applicant",
  "student",
  "officer",
  "admin",
  "lecturer",
  "hod",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

