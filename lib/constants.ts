import type {
  ApplicationStatus,
  DocumentStatus,
  Gender,
  MaritalStatus,
} from "@/types/enums";

/** Visual tone used by Badge/StatusTag to pick colors. */
export type Tone = "success" | "warning" | "error" | "info" | "neutral";

/* ---- Application status ------------------------------------- */

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  correction_required: "Correction Required",
  approved: "Approved",
  rejected: "Rejected",
  admitted: "Admission Offered",
  accepted: "Admission Accepted",
  declined: "Admission Declined",
};

export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, Tone> = {
  draft: "neutral",
  submitted: "info",
  under_review: "info",
  correction_required: "warning",
  approved: "success",
  rejected: "error",
  admitted: "success",
  accepted: "success",
  declined: "error",
};

/* ---- Document status ---------------------------------------- */

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
  correction_required: "Correction Required",
};

export const DOCUMENT_STATUS_TONE: Record<DocumentStatus, Tone> = {
  pending: "neutral",
  under_review: "info",
  verified: "success",
  rejected: "error",
  correction_required: "warning",
};

/* ---- The 8-step application flow (§3–13) -------------------- */

export const APPLICATION_STEPS = [
  { key: "personal", label: "Personal Information", short: "Personal" },
  { key: "contact", label: "Contact Information", short: "Contact" },
  { key: "programme", label: "Programme Selection", short: "Programme" },
  { key: "education", label: "Educational Background", short: "Education" },
  { key: "olevel", label: "O'Level Information", short: "O'Level" },
  { key: "jamb", label: "JAMB Information", short: "JAMB" },
  { key: "documents", label: "Documents", short: "Documents" },
  { key: "review", label: "Review & Submit", short: "Review" },
] as const;

export type StepKey = (typeof APPLICATION_STEPS)[number]["key"];

export const stepPath = (key: StepKey) => `/applicant/application/${key}`;

/* ---- Reference data ----------------------------------------- */

export const OLEVEL_SUBJECTS: string[] = [
  "English Language",
  "Mathematics",
  "Biology",
  "Chemistry",
  "Physics",
  "Economics",
  "Government",
  "Geography",
  "Literature in English",
  "Financial Accounting",
  "Commerce",
  "Agricultural Science",
  "Further Mathematics",
  "Civic Education",
  "Computer Studies",
  "Technical Drawing",
  "Data Processing",
  "Christian Religious Studies",
  "Islamic Religious Studies",
  "Food and Nutrition",
  "Marketing",
  "Yoruba",
  "Igbo",
  "Hausa",
];

export const NIGERIAN_STATES: string[] = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

/** Storage key for the mock application draft. */
export const DRAFT_STORAGE_KEY = "marist.application.draft.v1";

/* ---- Human-readable enum labels ----------------------------- */

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  single: "Single",
  married: "Married",
  divorced: "Divorced",
  widowed: "Widowed",
};
