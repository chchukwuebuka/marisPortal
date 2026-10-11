import type { LegacyRequirementChecklistItem } from "@/types/legacy";

export interface FacultyOption {
  id: number;
  name: string;
  code?: string;
}

export interface DepartmentOption {
  id: number;
  name: string;
  code?: string;
  schoolId: number;
}

export interface ProgrammeOption {
  id: number;
  name: string;
  type?: string;
  departmentId: number;
  departmentName?: string;
  schoolId: number;
  schoolName?: string;
  duration_years?: number;
}

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const MARITAL_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

export const RELIGION_OPTIONS = [
  { value: "Christianity", label: "Christianity" },
  { value: "Islam", label: "Islam" },
  { value: "Other", label: "Other" },
];

export const RELATIONSHIP_OPTIONS = [
  { value: "Parent", label: "Parent" },
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Brother", label: "Brother" },
  { value: "Sister", label: "Sister" },
  { value: "Uncle", label: "Uncle" },
  { value: "Aunt", label: "Aunt" },
  { value: "Spouse", label: "Spouse" },
  { value: "Guardian", label: "Guardian" },
  { value: "Other", label: "Other" },
];

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export const STEPS = [
  { num: 1, label: "Matric & Account", shortTitle: "Account Setup" },
  { num: 2, label: "Profile & Academic", shortTitle: "Profile & Academic" },
  { num: 3, label: "Documents", shortTitle: "Upload Documents" },
  { num: 4, label: "Review & Submit", shortTitle: "Review & Submit" },
  { num: 5, label: "Status & Approval", shortTitle: "Status Tracker" },
];

export const DEFAULT_FALLBACK_REQUIREMENTS: LegacyRequirementChecklistItem[] = [
  {
    requirement: {
      id: 9,
      name: "Passport Photograph",
      code: "passport-photograph",
      description: "Recent passport-sized photograph on a plain white or light background.",
      required: true,
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
      max_size_mb: 5,
      applies_to: "both",
    },
    document: null,
  },
  {
    requirement: {
      id: 10,
      name: "O'Level Result (WAEC/NECO/NABTEB)",
      code: "olevel-result",
      description: "Statement of result or certificate for your O'Level sitting(s).",
      required: true,
      allowed_formats: ["pdf", "jpg", "jpeg", "png"],
      max_size_mb: 5,
      applies_to: "both",
    },
    document: null,
  },
  {
    requirement: {
      id: 11,
      name: "JAMB Result Slip",
      code: "jamb-result",
      description: "Your JAMB UTME result slip for your admission year.",
      required: true,
      allowed_formats: ["pdf", "jpg", "jpeg", "png"],
      max_size_mb: 5,
      applies_to: "both",
    },
    document: null,
  },
  {
    requirement: {
      id: 12,
      name: "Birth Certificate / Declaration of Age",
      code: "birth-certificate",
      description: "Birth certificate or a sworn declaration of age.",
      required: true,
      allowed_formats: ["pdf", "jpg", "jpeg", "png"],
      max_size_mb: 5,
      applies_to: "both",
    },
    document: null,
  },
  {
    requirement: {
      id: 13,
      name: "LGA Identification Letter",
      code: "lga-identification",
      description: "Local Government identification / indigene letter (optional).",
      required: false,
      allowed_formats: ["pdf", "jpg", "jpeg", "png"],
      max_size_mb: 5,
      applies_to: "both",
    },
    document: null,
  },
];
