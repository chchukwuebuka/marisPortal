import type {
  AcademicSession,
  Applicant,
  Application,
  ApplicationDocument,
  Department,
  DocumentRequirement,
  InvoiceItem,
  Programme,
  School,
} from "@/types/domain";
import type { ProgrammeLevel } from "@/types/enums";

/** Artificial network latency so the UI exercises loading states. */
export const delay = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

/** Stable-ish unique id. */
export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

/* ---- Seed: sessions, schools, departments ------------------- */

export const SESSIONS: AcademicSession[] = [
  {
    id: "2026",
    name: "2026/2027",
    isActive: true,
    applicationDeadline: "2026-10-31",
  },
];

export const SCHOOLS: School[] = [
  { id: "sch-computing", name: "School of Computing", code: "SC" },
  { id: "sch-engineering", name: "School of Engineering", code: "SE" },
  { id: "sch-business", name: "School of Business & Management", code: "SB" },
  { id: "sch-science", name: "School of Applied Sciences", code: "SS" },
];

export const DEPARTMENTS: Department[] = [
  { id: "dep-cs", schoolId: "sch-computing", name: "Computer Science", code: "CS" },
  { id: "dep-cyb", schoolId: "sch-computing", name: "Cyber Security", code: "CYB" },
  { id: "dep-swe", schoolId: "sch-computing", name: "Software Engineering", code: "SWE" },
  { id: "dep-eee", schoolId: "sch-engineering", name: "Electrical/Electronic Engineering", code: "EEE" },
  { id: "dep-mec", schoolId: "sch-engineering", name: "Mechanical Engineering", code: "MEC" },
  { id: "dep-civ", schoolId: "sch-engineering", name: "Civil Engineering", code: "CIV" },
  { id: "dep-acc", schoolId: "sch-business", name: "Accountancy", code: "ACC" },
  { id: "dep-bam", schoolId: "sch-business", name: "Business Administration", code: "BAM" },
  { id: "dep-mkt", schoolId: "sch-business", name: "Marketing", code: "MKT" },
  { id: "dep-slt", schoolId: "sch-science", name: "Science Laboratory Technology", code: "SLT" },
  { id: "dep-sta", schoolId: "sch-science", name: "Statistics", code: "STA" },
];

/** Programmes are generated ND + HND per department (kept DRY). */
export const PROGRAMMES: Programme[] = DEPARTMENTS.flatMap((dept) => {
  const levels: ProgrammeLevel[] = ["ND", "HND"];
  return levels.map((level) => {
    // One programme is intentionally closed, to exercise the validation.
    const acceptingApplications = !(dept.id === "dep-civ" && level === "HND");
    return {
      id: `prog-${level.toLowerCase()}-${dept.code.toLowerCase()}`,
      departmentId: dept.id,
      schoolId: dept.schoolId,
      sessionId: "2026",
      name: `${level} ${dept.name}`,
      level,
      code: `${dept.code}-${level}`,
      durationYears: 2,
      acceptingApplications,
    } satisfies Programme;
  });
});

/* ---- Seed: document requirements (§10, admin-configured) ----- */

export const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: "req-passport",
    name: "Passport Photograph",
    description: "Recent passport photo with a plain background.",
    required: true,
    allowedFileTypes: ["jpg", "jpeg", "png"],
    maxFileSizeMb: 1,
    programmeId: null,
    active: true,
  },
  {
    id: "req-olevel",
    name: "O'Level Result",
    description: "WAEC / NECO / NABTEB statement of result or certificate.",
    required: true,
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFileSizeMb: 2,
    programmeId: null,
    active: true,
  },
  {
    id: "req-jamb",
    name: "JAMB Result",
    description: "JAMB UTME result slip.",
    required: true,
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFileSizeMb: 2,
    programmeId: null,
    active: true,
  },
  {
    id: "req-birth",
    name: "Birth Certificate / Age Declaration",
    required: true,
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFileSizeMb: 2,
    programmeId: null,
    active: true,
  },
  {
    id: "req-origin",
    name: "Certificate of State of Origin",
    required: true,
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFileSizeMb: 2,
    programmeId: null,
    active: true,
  },
  {
    id: "req-jamb-admission",
    name: "JAMB Admission Letter",
    description: "Optional at application stage.",
    required: false,
    allowedFileTypes: ["pdf"],
    maxFileSizeMb: 2,
    programmeId: null,
    active: true,
  },
  {
    id: "req-other",
    name: "Other Supporting Document",
    required: false,
    allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
    maxFileSizeMb: 5,
    programmeId: null,
    active: true,
  },
];

/* ---- Fee configuration (§14) -------------------------------- */

export const FEE_CONFIG = {
  applicationFee: 10000,
  processingFee: 500,
};

export function buildInvoiceItems(): InvoiceItem[] {
  return [
    { label: "Application Fee", amount: FEE_CONFIG.applicationFee },
    { label: "Processing Fee", amount: FEE_CONFIG.processingFee },
  ];
}

export const invoiceTotal = () =>
  buildInvoiceItems().reduce((sum, i) => sum + i.amount, 0);

/* ---- Applicant & application factory ------------------------ */

/** Mock signed-in applicant (no real auth in this build). */
export const MOCK_APPLICANT: Applicant = {
  id: "applicant-1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
};

export function createInitialApplication(applicantId: string): Application {
  const now = new Date().toISOString();
  return {
    id: uid("app"),
    applicationNumber: null,
    applicantId,
    status: "draft",
    personal: {},
    contact: {},
    programme: {},
    education: [],
    olevel: [],
    presentingTwoSittings: false,
    jamb: {},
    documents: [],
    confirmedAccuracy: false,
    correctionComment: null,
    decision: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Materialize a document slot per active requirement, status "pending". */
export function buildDocumentSlots(
  reqs: DocumentRequirement[],
  existing: ApplicationDocument[] = [],
): ApplicationDocument[] {
  const byReq = new Map(existing.map((d) => [d.requirementId, d]));
  return reqs
    .filter((r) => r.active)
    .map(
      (r) =>
        byReq.get(r.id) ?? {
          id: uid("doc"),
          requirementId: r.id,
          status: "pending",
        },
    );
}

export function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const n = Math.floor(1 + Math.random() * 999999);
  return `MAR-${year}-${String(n).padStart(6, "0")}`;
}

export function generateVerificationCode(): string {
  const s = (Math.random().toString(36) + Math.random().toString(36))
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toUpperCase();
  return `MAR-ADM-${s}`;
}
