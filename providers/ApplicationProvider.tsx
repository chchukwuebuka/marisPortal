"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AdmissionDecision,
  Applicant,
  Application,
  ApplicationDocument,
  ContactInfo,
  EducationRecord,
  JambInfo,
  OLevelResult,
  Payment,
  PersonalInfo,
  ProgrammeSelection,
} from "@/types/domain";
import type { StepKey } from "@/lib/constants";
import { DRAFT_STORAGE_KEY } from "@/lib/constants";
import {
  computeStepStatus,
  progressPercent,
  validateForSubmission,
} from "@/lib/completeness";
import {
  MOCK_APPLICANT,
  createInitialApplication,
  findDepartment,
  findProgramme,
  findSchool,
  findSession,
  generateApplicationNumber,
  generateVerificationCode,
} from "@/services";

type UploadMeta = {
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  objectUrl?: string;
};

export type DecisionKind = "admit" | "reject" | "correction";

export interface ApplicationContextValue {
  applicant: Applicant;
  application: Application;
  payment: Payment | null;
  paid: boolean;
  hydrated: boolean;

  updatePersonal: (data: Partial<PersonalInfo>) => void;
  updateContact: (data: Partial<ContactInfo>) => void;
  updateProgramme: (data: Partial<ProgrammeSelection>) => void;
  setEducation: (records: EducationRecord[]) => void;
  setOlevel: (results: OLevelResult[]) => void;
  setPresentingTwoSittings: (value: boolean) => void;
  updateJamb: (data: Partial<JambInfo>) => void;
  uploadDocument: (requirementId: string, meta: UploadMeta) => void;
  removeDocument: (requirementId: string) => void;
  getDocument: (requirementId: string) => ApplicationDocument | undefined;
  setConfirmedAccuracy: (value: boolean) => void;

  setPayment: (payment: Payment) => void;
  submitApplication: () => {
    ok: boolean;
    errors: string[];
    applicationNumber?: string;
  };
  acceptAdmission: () => void;
  declineAdmission: () => void;
  resetApplication: () => void;

  /** Demo-only: stand in for the deferred admissions-officer actions. */
  applyMockDecision: (kind: DecisionKind, comment?: string) => void;

  stepStatus: Record<StepKey, boolean>;
  completedCount: number;
  progress: number;
}

export const ApplicationContext =
  createContext<ApplicationContextValue | null>(null);

// Deterministic placeholder so server and first client render match (no
// hydration mismatch). Real draft is loaded from localStorage after mount.
const PLACEHOLDER: Application = {
  id: "app-draft",
  applicationNumber: null,
  applicantId: MOCK_APPLICANT.id,
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
  createdAt: "1970-01-01T00:00:00.000Z",
  updatedAt: "1970-01-01T00:00:00.000Z",
};

interface Persisted {
  application: Application;
  payment: Payment | null;
}

export function ApplicationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [application, setApplication] = useState<Application>(PLACEHOLDER);
  const [payment, setPaymentState] = useState<Payment | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted draft (client only). setState-in-effect is the correct
  // pattern here: the server has no localStorage, so the draft can only be
  // read after mount — a lazy initializer would cause a hydration mismatch.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        setApplication(parsed.application);
        setPaymentState(parsed.payment ?? null);
      } else {
        setApplication(createInitialApplication(MOCK_APPLICANT.id));
      }
    } catch {
      setApplication(createInitialApplication(MOCK_APPLICANT.id));
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist on change (only after hydration, so we never clobber the draft).
  useEffect(() => {
    if (!hydrated) return;
    const payload: Persisted = { application, payment };
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* storage full / unavailable — non-fatal in this mock */
    }
  }, [application, payment, hydrated]);

  const touch = useCallback(
    (updater: (prev: Application) => Application) => {
      setApplication((prev) => ({
        ...updater(prev),
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  const updatePersonal = useCallback(
    (data: Partial<PersonalInfo>) =>
      touch((prev) => ({ ...prev, personal: { ...prev.personal, ...data } })),
    [touch],
  );
  const updateContact = useCallback(
    (data: Partial<ContactInfo>) =>
      touch((prev) => ({ ...prev, contact: { ...prev.contact, ...data } })),
    [touch],
  );
  const updateProgramme = useCallback(
    (data: Partial<ProgrammeSelection>) =>
      touch((prev) => ({ ...prev, programme: { ...prev.programme, ...data } })),
    [touch],
  );
  const setEducation = useCallback(
    (education: EducationRecord[]) =>
      touch((prev) => ({ ...prev, education })),
    [touch],
  );
  const setOlevel = useCallback(
    (olevel: OLevelResult[]) => touch((prev) => ({ ...prev, olevel })),
    [touch],
  );
  const setPresentingTwoSittings = useCallback(
    (presentingTwoSittings: boolean) =>
      touch((prev) => ({ ...prev, presentingTwoSittings })),
    [touch],
  );
  const updateJamb = useCallback(
    (data: Partial<JambInfo>) =>
      touch((prev) => ({ ...prev, jamb: { ...prev.jamb, ...data } })),
    [touch],
  );

  const uploadDocument = useCallback(
    (requirementId: string, meta: UploadMeta) =>
      touch((prev) => {
        const docs = [...prev.documents];
        const idx = docs.findIndex((d) => d.requirementId === requirementId);
        const entry: ApplicationDocument = {
          id: idx >= 0 ? docs[idx].id : `doc-${requirementId}`,
          requirementId,
          fileName: meta.fileName,
          fileSizeBytes: meta.fileSizeBytes,
          fileType: meta.fileType,
          objectUrl: meta.objectUrl,
          status: "under_review",
          uploadedAt: new Date().toISOString(),
        };
        if (idx >= 0) docs[idx] = entry;
        else docs.push(entry);
        return { ...prev, documents: docs };
      }),
    [touch],
  );
  const removeDocument = useCallback(
    (requirementId: string) =>
      touch((prev) => ({
        ...prev,
        documents: prev.documents.filter(
          (d) => d.requirementId !== requirementId,
        ),
      })),
    [touch],
  );
  const getDocument = useCallback(
    (requirementId: string) =>
      application.documents.find((d) => d.requirementId === requirementId),
    [application.documents],
  );

  const setConfirmedAccuracy = useCallback(
    (confirmedAccuracy: boolean) =>
      touch((prev) => ({ ...prev, confirmedAccuracy })),
    [touch],
  );

  const setPayment = useCallback((p: Payment) => setPaymentState(p), []);
  const paid = payment?.status === "successful";

  const submitApplication = useCallback(() => {
    const errors = validateForSubmission(application, paid);
    if (errors.length > 0) return { ok: false, errors };
    const applicationNumber =
      application.applicationNumber ?? generateApplicationNumber();
    touch((prev) => ({
      ...prev,
      applicationNumber,
      status: "under_review",
      submittedAt: new Date().toISOString(),
      correctionComment: null,
    }));
    return { ok: true, errors: [], applicationNumber };
  }, [application, paid, touch]);

  const applyMockDecision = useCallback(
    (kind: DecisionKind, comment?: string) =>
      touch((prev) => {
        if (kind === "reject") {
          return { ...prev, status: "rejected", decision: null };
        }
        if (kind === "correction") {
          return {
            ...prev,
            status: "correction_required",
            correctionComment:
              comment ?? "Please upload a clearer copy of your JAMB result.",
          };
        }
        const decision: AdmissionDecision = {
          id: `dec-${prev.id}`,
          applicationId: prev.id,
          programmeName: findProgramme(prev.programme?.programmeId)?.name ?? "—",
          departmentName:
            findDepartment(prev.programme?.departmentId)?.name ?? "—",
          schoolName: findSchool(prev.programme?.schoolId)?.name ?? "—",
          sessionName: findSession(prev.programme?.sessionId)?.name ?? "—",
          admissionType: "Full Admission",
          decisionDate: new Date().toISOString(),
          verificationCode: generateVerificationCode(),
          accepted: undefined,
        };
        return { ...prev, status: "admitted", decision };
      }),
    [touch],
  );

  const acceptAdmission = useCallback(
    () =>
      touch((prev) =>
        prev.decision
          ? {
              ...prev,
              status: "accepted",
              decision: { ...prev.decision, accepted: true },
            }
          : prev,
      ),
    [touch],
  );
  const declineAdmission = useCallback(
    () =>
      touch((prev) =>
        prev.decision
          ? {
              ...prev,
              status: "declined",
              decision: { ...prev.decision, accepted: false },
            }
          : prev,
      ),
    [touch],
  );

  const resetApplication = useCallback(() => {
    setApplication(createInitialApplication(MOCK_APPLICANT.id));
    setPaymentState(null);
  }, []);

  const stepStatus = useMemo(
    () => computeStepStatus(application),
    [application],
  );
  const completedCount = useMemo(
    () => Object.values(stepStatus).filter(Boolean).length,
    [stepStatus],
  );
  const progress = useMemo(
    () => progressPercent(application),
    [application],
  );

  const value: ApplicationContextValue = {
    applicant: MOCK_APPLICANT,
    application,
    payment,
    paid,
    hydrated,
    updatePersonal,
    updateContact,
    updateProgramme,
    setEducation,
    setOlevel,
    setPresentingTwoSittings,
    updateJamb,
    uploadDocument,
    removeDocument,
    getDocument,
    setConfirmedAccuracy,
    setPayment,
    submitApplication,
    acceptAdmission,
    declineAdmission,
    resetApplication,
    applyMockDecision,
    stepStatus,
    completedCount,
    progress,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
}
