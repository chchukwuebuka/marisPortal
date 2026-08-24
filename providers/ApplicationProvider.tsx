"use client";

/**
 * ApplicationProvider — the central state manager for the applicant's
 * application. All data flows through the real Django API.
 *
 * On mount it:
 *  1. Lists the applicant's applications (GET /applications/)
 *  2. Picks the first one (or creates one for the active session)
 *  3. Fetches its detail, profile, JAMB, and document requirements
 *  4. Assembles everything into the `Application` domain object
 *
 * Mutations call the relevant API endpoint then refresh local state.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
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
import {
  computeStepStatus,
  progressPercent,
  validateForSubmission,
} from "@/lib/completeness";
import {
  profileToPersonal,
  profileToContact,
  personalToProfilePatch,
  contactToProfilePatch,
  toDomainEducation,
  toDomainOlevel,
  toApiId,
} from "@/lib/api/adapters";
import * as appApi from "@/services/applications";
import * as profileApi from "@/services/profile";
import { getRequirements, uploadDocument as uploadDocApi } from "@/services/documents";
import { getInvoice } from "@/services/payments";
import { useAuth } from "@/hooks/useAuth";
import { useCatalogue } from "@/hooks/useCatalogue";

export interface ApplicationContextValue {
  applicant: Applicant;
  application: Application;
  payment: Payment | null;
  paid: boolean;
  hydrated: boolean;
  /** True while the initial API load is in progress */
  apiLoading: boolean;
  /** Non-null if the initial API load failed */
  apiError: string | null;

  updatePersonal: (data: Partial<PersonalInfo>) => Promise<void>;
  updateContact: (data: Partial<ContactInfo>) => Promise<void>;
  updateProgramme: (data: Partial<ProgrammeSelection>) => Promise<void>;
  addEducation: (record: Omit<EducationRecord, "id">) => Promise<void>;
  deleteEducation: (eduId: string) => Promise<void>;
  setEducation: (records: EducationRecord[]) => void;
  addOlevel: (result: OLevelResult, sitting: number) => Promise<void>;
  updateOlevel: (result: OLevelResult, sitting: number) => Promise<void>;
  deleteOlevel: (olevelId: string) => Promise<void>;
  setOlevel: (results: OLevelResult[]) => void;
  setPresentingTwoSittings: (value: boolean) => void;
  updateJamb: (data: Partial<JambInfo>) => Promise<void>;
  uploadDocument: (requirementId: string, file: File) => Promise<void>;
  getDocument: (requirementId: string) => ApplicationDocument | undefined;
  saveOlevel: (results: OLevelResult[]) => Promise<void>;
  setConfirmedAccuracy: (value: boolean) => void;

  setPayment: (payment: Payment) => void;
  submitApplication: () => Promise<{
    ok: boolean;
    errors: string[];
    applicationNumber?: string;
  }>;
  acceptAdmission: () => Promise<void>;
  declineAdmission: () => Promise<void>;
  resetApplication: () => void;
  /** Reload all data from the API */
  refresh: () => Promise<void>;

  stepStatus: Record<StepKey, boolean>;
  completedCount: number;
  progress: number;
}

export const ApplicationContext =
  createContext<ApplicationContextValue | null>(null);

/** Empty application used before the API response arrives. */
const EMPTY_APP: Application = {
  id: "0",
  applicationNumber: null,
  applicantId: "0",
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function ApplicationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { setRequirements, findActiveSession, getRequirementsForProgramme } =
    useCatalogue();

  // Derive applicant from the authenticated user
  const applicant = useMemo<Applicant>(() => {
    if (!user)
      return { id: "0", firstName: "", lastName: "", email: "" };
    return {
      id: user.id ? String(user.id) : "0",
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  }, [user]);

  const [application, setApplication] = useState<Application>(EMPTY_APP);
  const [payment, setPaymentState] = useState<Payment | null>(null);
  const [apiAppId, setApiAppId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  /* ------------------------------------------------------------------ *
   *  Load application from API on mount                                 *
   * ------------------------------------------------------------------ */
  const loadApplication = useCallback(async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      // 1. List existing applications
      const apps = await appApi.listApplications();

      let appId: number;
      if (apps.length > 0) {
        appId = apps[0].id;
      } else {
        // No application yet — create one for the active session
        const session = findActiveSession();
        const sessionId = toApiId(session.id);
        if (!sessionId) throw new Error("No active session found");
        const created = await appApi.createApplication(sessionId);
        appId = created.id;
      }

      setApiAppId(appId);

      // 2. Fetch full detail + profile + JAMB + requirements in parallel
      const [detail, profile, jambData, reqsBundle] = await Promise.all([
        appApi.getApplication(appId),
        profileApi.getProfile(),
        appApi.getJamb(appId).catch(() => null),
        getRequirements(appId).catch(() => ({
          requirements: [],
          documents: [],
        })),
      ]);

      // 3. Also try to load payment/invoice
      let existingPayment: Payment | null = null;
      try {
        const invoice = await getInvoice(appId);
        if (invoice && invoice.status === "paid") {
          existingPayment = {
            id: invoice.id,
            invoiceId: invoice.id,
            reference: "",
            amount: invoice.total,
            status: "successful",
            paidAt: invoice.paidAt,
          };
        }
      } catch {
        /* no invoice yet — that's fine */
      }

      // 4. Store requirements in CatalogueProvider
      setRequirements(reqsBundle.requirements);

      // 5. Assemble the Application domain object
      const personal = profileToPersonal(profile);
      const contact = profileToContact(profile);

      const assembled: Application = {
        id: String(detail.id),
        applicationNumber: detail.application_number ?? null,
        applicantId: applicant.id,
        status: detail.status,
        personal,
        contact,
        programme: {
          sessionId: String(detail.session),
          programmeId: detail.programme != null ? String(detail.programme) : undefined,
          schoolId: detail.programme_detail?.school != null
            ? String(detail.programme_detail.school)
            : undefined,
          departmentId: detail.programme_detail?.department != null
            ? String(detail.programme_detail.department)
            : undefined,
        },
        education: detail.education.map(toDomainEducation),
        olevel: detail.olevel_results.map(toDomainOlevel),
        presentingTwoSittings: detail.olevel_results.length > 1,
        jamb: jambData ?? {},
        documents: reqsBundle.documents,
        confirmedAccuracy: detail.declaration_accepted,
        correctionComment:
          detail.correction_requests.length > 0
            ? detail.correction_requests[detail.correction_requests.length - 1]
                .message
            : null,
        decision: null,
        createdAt: detail.created_at,
        updatedAt: detail.updated_at,
        submittedAt: detail.submitted_at ?? undefined,
      };

      setApplication(assembled);
      setPaymentState(existingPayment);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Failed to load application",
      );
    } finally {
      setApiLoading(false);
      setHydrated(true);
    }
  }, [applicant.id, findActiveSession, setRequirements]);

  useEffect(() => {
    if (user) {
      void loadApplication();
    }
  }, [user, loadApplication]);

  /* ------------------------------------------------------------------ *
   *  Local state helpers                                                *
   * ------------------------------------------------------------------ */
  const touch = useCallback(
    (updater: (prev: Application) => Application) => {
      setApplication((prev) => ({
        ...updater(prev),
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  /* ------------------------------------------------------------------ *
   *  Mutation methods — call API then update local state                *
   * ------------------------------------------------------------------ */

  const updatePersonal = useCallback(
    async (data: Partial<PersonalInfo>) => {
      const patch = personalToProfilePatch(data);
      await profileApi.updateProfile(patch);
      touch((prev) => ({
        ...prev,
        personal: { ...prev.personal, ...data },
      }));
    },
    [touch],
  );

  const updateContact = useCallback(
    async (data: Partial<ContactInfo>) => {
      const patch = contactToProfilePatch(data);
      await profileApi.updateProfile(patch);
      touch((prev) => ({
        ...prev,
        contact: { ...prev.contact, ...data },
      }));
    },
    [touch],
  );

  const updateProgramme = useCallback(
    async (data: Partial<ProgrammeSelection>) => {
      if (apiAppId == null) return;
      const apiData: Record<string, unknown> = {};
      if (data.sessionId != null) apiData.session = toApiId(data.sessionId);
      if (data.programmeId != null)
        apiData.programme = toApiId(data.programmeId);
      await appApi.updateApplicationProgramme(apiAppId, apiData as { session?: number; programme?: number });
      touch((prev) => ({
        ...prev,
        programme: { ...prev.programme, ...data },
      }));
    },
    [apiAppId, touch],
  );

  const addEducation = useCallback(
    async (record: Omit<EducationRecord, "id">) => {
      if (apiAppId == null) return;
      const created = await appApi.createEducation(apiAppId, record as EducationRecord);
      const domain = toDomainEducation(created);
      touch((prev) => ({
        ...prev,
        education: [...prev.education, domain],
      }));
    },
    [apiAppId, touch],
  );

  const deleteEducation = useCallback(
    async (eduId: string) => {
      if (apiAppId == null) return;
      const numId = toApiId(eduId);
      if (numId == null) return;
      await appApi.deleteEducation(apiAppId, numId);
      touch((prev) => ({
        ...prev,
        education: prev.education.filter((e) => e.id !== eduId),
      }));
    },
    [apiAppId, touch],
  );

  // Kept for backward compat — used for local-only array updates (e.g. optimistic UI)
  const setEducation = useCallback(
    (education: EducationRecord[]) =>
      touch((prev) => ({ ...prev, education })),
    [touch],
  );

  const addOlevel = useCallback(
    async (result: OLevelResult, sitting: number) => {
      if (apiAppId == null) return;
      const created = await appApi.createOlevel(apiAppId, result, sitting);
      const domain = toDomainOlevel(created);
      touch((prev) => ({
        ...prev,
        olevel: prev.olevel.map((s, i) => (i === sitting - 1 ? domain : s)),
      }));
    },
    [apiAppId, touch],
  );

  const updateOlevelFn = useCallback(
    async (result: OLevelResult, sitting: number) => {
      if (apiAppId == null) return;
      const olevelId = toApiId(result.id);
      if (olevelId == null) return;
      const updated = await appApi.updateOlevel(apiAppId, olevelId, result, sitting);
      const domain = toDomainOlevel(updated);
      touch((prev) => ({
        ...prev,
        olevel: prev.olevel.map((s) => (s.id === result.id ? domain : s)),
      }));
    },
    [apiAppId, touch],
  );

  const deleteOlevel = useCallback(
    async (olevelId: string) => {
      if (apiAppId == null) return;
      const numId = toApiId(olevelId);
      if (numId == null) return;
      await appApi.deleteOlevel(apiAppId, numId);
      touch((prev) => ({
        ...prev,
        olevel: prev.olevel.filter((o) => o.id !== olevelId),
      }));
    },
    [apiAppId, touch],
  );

  // Kept for backward compat — used for local-only array updates
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
    async (data: Partial<JambInfo>) => {
      if (apiAppId == null) return;
      await appApi.putJamb(apiAppId, data);
      touch((prev) => ({
        ...prev,
        jamb: { ...prev.jamb, ...data },
      }));
    },
    [apiAppId, touch],
  );

  const saveOlevel = useCallback(
    async (results: OLevelResult[]) => {
      if (apiAppId == null) return;
      const updatedList: OLevelResult[] = [];
      for (let i = 0; i < results.length; i++) {
        const sitting = results[i];
        if (!sitting.examType || !sitting.examYear || sitting.subjects.length === 0) {
          updatedList.push(sitting);
          continue;
        }
        const numericId = toApiId(sitting.id);
        if (numericId != null) {
          const res = await appApi.updateOlevel(apiAppId, numericId, sitting, i + 1);
          updatedList.push(toDomainOlevel(res));
        } else {
          const res = await appApi.createOlevel(apiAppId, sitting, i + 1);
          updatedList.push(toDomainOlevel(res));
        }
      }
      touch((prev) => ({ ...prev, olevel: updatedList }));
    },
    [apiAppId, touch],
  );

  const uploadDocument = useCallback(
    async (requirementId: string, file: File) => {
      if (apiAppId == null) {
        throw new Error("No application loaded.");
      }

      const reqId = toApiId(requirementId);
      if (reqId == null) {
        throw new Error(`Invalid document requirement ID: ${requirementId}`);
      }

      // Upload to the server. A rejection propagates to the caller so the
      // RequirementCard surfaces the real error — we never fake local success.
      const doc = await uploadDocApi(apiAppId, reqId, file);

      if (doc) {
        touch((prev) => {
          const docs = [...prev.documents];
          const index = docs.findIndex(
            (d) => d.requirementId === doc.requirementId,
          );
          if (index >= 0) docs[index] = doc;
          else docs.push(doc);
          return { ...prev, documents: docs };
        });
      } else {
        // Server accepted the file but returned no body — re-read the
        // authoritative document list so state mirrors the backend exactly.
        const bundle = await getRequirements(apiAppId);
        touch((prev) => ({ ...prev, documents: bundle.documents }));
      }
    },
    [apiAppId, touch],
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

  const submitApplication = useCallback(async () => {
    const reqs = getRequirementsForProgramme(application.programme?.programmeId);
    const errors = validateForSubmission(application, paid, reqs);
    if (errors.length > 0) return { ok: false, errors };

    if (apiAppId == null) return { ok: false, errors: ["No application loaded."] };
    try {
      await appApi.submitApplication(
        apiAppId,
        application.confirmedAccuracy,
      );
      // Re-fetch to get the server-assigned application number and updated status
      const detail = await appApi.getApplication(apiAppId);
      touch((prev) => ({
        ...prev,
        applicationNumber: detail.application_number ?? prev.applicationNumber,
        status: detail.status,
        submittedAt: detail.submitted_at ?? new Date().toISOString(),
        correctionComment: null,
      }));
      return {
        ok: true,
        errors: [],
        applicationNumber: detail.application_number ?? undefined,
      };
    } catch (err) {
      return {
        ok: false,
        errors: [
          err instanceof Error ? err.message : "Submission failed. Please try again.",
        ],
      };
    }
  }, [application, paid, apiAppId, touch, getRequirementsForProgramme]);

  const acceptAdmission = useCallback(async () => {
    if (apiAppId == null) return;
    await appApi.acceptAdmission(apiAppId);
    touch((prev) =>
      prev.decision
        ? {
            ...prev,
            status: "accepted",
            decision: { ...prev.decision, accepted: true },
          }
        : prev,
    );
  }, [apiAppId, touch]);

  const declineAdmission = useCallback(async () => {
    if (apiAppId == null) return;
    await appApi.declineAdmission(apiAppId);
    touch((prev) =>
      prev.decision
        ? {
            ...prev,
            status: "declined",
            decision: { ...prev.decision, accepted: false },
          }
        : prev,
    );
  }, [apiAppId, touch]);

  const resetApplication = useCallback(() => {
    setApplication(EMPTY_APP);
    setPaymentState(null);
  }, []);

  const refresh = useCallback(async () => {
    await loadApplication();
  }, [loadApplication]);

  /* ------------------------------------------------------------------ *
   *  Completeness                                                       *
   * ------------------------------------------------------------------ */
  const reqs = getRequirementsForProgramme(application.programme?.programmeId);

  const stepStatus = useMemo(
    () => computeStepStatus(application, reqs),
    [application, reqs],
  );
  const completedCount = useMemo(
    () => Object.values(stepStatus).filter(Boolean).length,
    [stepStatus],
  );
  const progress = useMemo(
    () => progressPercent(application, reqs),
    [application, reqs],
  );

  const value: ApplicationContextValue = {
    applicant,
    application,
    payment,
    paid,
    hydrated,
    apiLoading,
    apiError,
    updatePersonal,
    updateContact,
    updateProgramme,
    addEducation,
    deleteEducation,
    setEducation,
    addOlevel,
    updateOlevel: updateOlevelFn,
    deleteOlevel,
    setOlevel,
    saveOlevel,
    setPresentingTwoSittings,
    updateJamb,
    uploadDocument,
    getDocument,
    setConfirmedAccuracy,
    setPayment,
    submitApplication,
    acceptAdmission,
    declineAdmission,
    resetApplication,
    refresh,
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
