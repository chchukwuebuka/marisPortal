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

export const EXAM_TYPES = ["WAEC", "NECO", "NABTEB"] as const;
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

export const PROGRAMME_LEVELS = ["ND", "HND"] as const;
export type ProgrammeLevel = (typeof PROGRAMME_LEVELS)[number];

export const JAMB_EXAM_TYPES = ["UTME", "Direct Entry"] as const;
export type JambExamType = (typeof JAMB_EXAM_TYPES)[number];

export const INVOICE_STATUSES = ["unpaid", "paid"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "successful", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
