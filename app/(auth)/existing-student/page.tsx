"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui";
import {
  deleteLegacyDocument,
  getLegacyRequirements,
  getLegacyTimeline,
  getMyLegacyRegistration,
  lookupLegacyMatric,
  startLegacyRegistration,
  submitLegacyRegistration,
  updateMyLegacyProfile,
  uploadLegacyDocument,
  type LegacyLookupResponse,
} from "@/services/legacy";
import {
  getAdmissionOptions,
  getDepartments,
  getLevels,
  getProgrammes,
  getSchools,
  getSessions,
  type ApiLevel,
} from "@/services/catalogue";
import { clearTokens, getAccessToken } from "@/lib/api/tokens";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import type {
  LegacyProfileInput,
  LegacyRegistrationDetail,
  LegacyRegistrationEvent,
  LegacyRequirementChecklistItem,
  LegacyStartInput,
} from "@/types/legacy";
import type { AcademicSession } from "@/types/domain";
import {
  DEFAULT_FALLBACK_REQUIREMENTS,
  STEPS,
  type DepartmentOption,
  type FacultyOption,
  type ProgrammeOption,
} from "./types";
import {
  Step1Account,
  Step2Profile,
  Step3Documents,
  Step4Review,
  Step5Status,
  StepperNav,
} from "./components";
import styles from "./existing-student.module.css";

export default function ExistingStudentOnboardingPage() {
  const { login } = useAuth();
  const [, startTransition] = useTransition();

  // Resume / Returning student state
  const [resumeMode, setResumeMode] = useState<"new" | "resume">("new");
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<LegacyLookupResponse | null>(null);
  const [resumeEmail, setResumeEmail] = useState<string>("");
  const [resumePassword, setResumePassword] = useState<string>("");
  const [resuming, setResuming] = useState<boolean>(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Wizard state
  const [step, setStep] = useState<number>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingDocId, setUploadingDocId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states from backend
  const [registration, setRegistration] = useState<LegacyRegistrationDetail | null>(null);
  const [requirements, setRequirements] = useState<LegacyRequirementChecklistItem[]>([]);
  const [timeline, setTimeline] = useState<LegacyRegistrationEvent[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [levels, setLevels] = useState<ApiLevel[]>([]);

  // Backend catalogue states (Faculty/School, Department, Programme)
  const [schools, setSchools] = useState<FacultyOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);

  // Step 2 Cascading Selection State
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | "">("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "">("");
  const [sessionInputText, setSessionInputText] = useState<string>("");

  // Step 1 Form
  const [startForm, setStartForm] = useState<LegacyStartInput>({
    matric_number: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    password_confirm: "",
  });

  // Step 2 Form
  const [profileForm, setProfileForm] = useState<LegacyProfileInput>({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "male",
    marital_status: "single",
    nationality: "Nigerian",
    state_of_origin: "Enugu",
    lga: "",
    religion: "Christianity",
    phone: "",
    email: "",
    address: "",
    guardian_name: "",
    guardian_relationship: "Parent",
    guardian_phone: "",
    guardian_email: "",
    guardian_address: "",
    guardian_occupation: "",
    programme: undefined,
    admission_session: undefined,
    current_level: undefined,
  });

  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);

  // Load existing onboarding status & backend catalogue
  useEffect(() => {
    async function init() {
      setLoading(true);
      setErrorMsg(null);
      try {
        // Check URL params for returning student links
        if (typeof window !== "undefined") {
          const sp = new URLSearchParams(window.location.search);
          const qMatric = sp.get("matric");
          const qEmail = sp.get("email");
          const qMode = sp.get("mode");
          if (qMatric) {
            setStartForm((prev) => ({ ...prev, matric_number: qMatric.toUpperCase() }));
            handleMatricLookup(qMatric.toUpperCase());
          }
          if (qEmail) {
            setResumeEmail(qEmail);
          }
          if (qMode === "resume" || qEmail) {
            setResumeMode("resume");
          }
        }
        // 1. Fetch live catalogue and reference levels from backend
        const [sessData, admTree, rawSchools, rawDepts, rawProgs, rawLevels] =
          await Promise.allSettled([
            getSessions(),
            getAdmissionOptions(),
            getSchools(),
            getDepartments(),
            getProgrammes(),
            getLevels(),
          ]);

        let loadedSessions: AcademicSession[] = [];
        if (sessData.status === "fulfilled") {
          loadedSessions = sessData.value;
          setSessions(sessData.value);
        }

        let loadedLevels: ApiLevel[] = [];
        if (rawLevels.status === "fulfilled" && rawLevels.value.length > 0) {
          loadedLevels = rawLevels.value;
          setLevels(rawLevels.value);
        } else {
          // Default reference level structure matching backend
          loadedLevels = [
            { id: 1, name: "100 Level", code: "100", numeric_value: 100 },
            { id: 2, name: "200 Level", code: "200", numeric_value: 200 },
            { id: 3, name: "300 Level", code: "300", numeric_value: 300 },
            { id: 4, name: "400 Level", code: "400", numeric_value: 400 },
            { id: 5, name: "500 Level", code: "500", numeric_value: 500 },
          ];
          setLevels(loadedLevels);
        }

        const schoolList: FacultyOption[] = [];
        const deptList: DepartmentOption[] = [];
        const progList: ProgrammeOption[] = [];

        if (admTree.status === "fulfilled" && admTree.value?.schools) {
          for (const s of admTree.value.schools) {
            schoolList.push({ id: s.id, name: s.name, code: s.code });
            for (const d of s.departments || []) {
              deptList.push({ id: d.id, name: d.name, code: d.code, schoolId: s.id });
              for (const p of d.programmes || []) {
                progList.push({
                  id: p.id,
                  name: p.name,
                  type: p.type || "ND",
                  departmentId: d.id,
                  departmentName: d.name,
                  schoolId: s.id,
                  schoolName: s.name,
                  duration_years: p.duration_years || 2,
                });
              }
            }
          }
        }

        // Merge raw catalogue if missing
        if (rawSchools.status === "fulfilled") {
          for (const s of rawSchools.value) {
            const sId = Number(s.id);
            if (!schoolList.some((x) => x.id === sId)) {
              schoolList.push({ id: sId, name: s.name, code: s.code });
            }
          }
        }
        if (rawDepts.status === "fulfilled") {
          for (const d of rawDepts.value) {
            const dId = Number(d.id);
            const sId = Number(d.schoolId);
            if (!deptList.some((x) => x.id === dId)) {
              deptList.push({ id: dId, name: d.name, code: d.code, schoolId: sId });
            }
          }
        }
        if (rawProgs.status === "fulfilled") {
          for (const p of rawProgs.value) {
            const pId = Number(p.id);
            const dId = Number(p.departmentId);
            const sId = Number(p.schoolId);
            if (!progList.some((x) => x.id === pId)) {
              progList.push({
                id: pId,
                name: p.name,
                type: p.level || "ND",
                departmentId: dId,
                schoolId: sId,
                duration_years: p.durationYears || 2,
              });
            }
          }
        }

        setSchools(schoolList);
        setDepartments(deptList);
        setProgrammes(progList);

        // 2. Check if logged-in user already has a registration
        const token = getAccessToken();
        if (token) {
          try {
            const reg = await getMyLegacyRegistration();
            if (reg && reg.id) {
              setRegistration(reg);
              populateFormFromRegistration(reg, progList, loadedSessions);
              if (reg.status === "pending" || reg.status === "correction_required") {
                // If profile is already saved, resume directly at Step 3 (Documents)
                if (reg.programme && reg.date_of_birth && reg.phone) {
                  setStep(3);
                  setMaxStepReached(4);
                } else {
                  setStep(2);
                  setMaxStepReached(3);
                }
              } else {
                setStep(5);
                setMaxStepReached(5);
              }
              await reloadRequirementsAndTimeline();
            }
          } catch (err) {
            // If token returned 401 Unauthorized or 403 (e.g. invalid, expired or staff token), clear it
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
              clearTokens();
            }
          }
        }
      } catch (err) {
        console.error("Init failed:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function populateFormFromRegistration(
    reg: LegacyRegistrationDetail,
    progList: ProgrammeOption[] = programmes,
    sessionList: AcademicSession[] = sessions
  ) {
    setProfileForm({
      first_name: reg.first_name || "",
      middle_name: reg.middle_name || "",
      last_name: reg.last_name || "",
      date_of_birth: reg.date_of_birth || "",
      gender: reg.gender || "male",
      marital_status: reg.marital_status || "single",
      nationality: reg.nationality || "Nigerian",
      state_of_origin: reg.state_of_origin || "Enugu",
      lga: reg.lga || "",
      religion: reg.religion || "Christianity",
      phone: reg.phone || "",
      email: reg.email || "",
      address: reg.address || "",
      guardian_name: reg.guardian_name || "",
      guardian_relationship: reg.guardian_relationship || "Parent",
      guardian_phone: reg.guardian_phone || "",
      guardian_email: reg.guardian_email || "",
      guardian_address: reg.guardian_address || "",
      guardian_occupation: reg.guardian_occupation || "",
      programme: reg.programme || undefined,
      admission_session: reg.admission_session || undefined,
      current_level: reg.current_level || undefined,
    });

    if (reg.admission_session) {
      const sessMatch = sessionList.find(
        (s) => String(s.id) === String(reg.admission_session)
      );
      if (sessMatch) {
        setSessionInputText(sessMatch.name);
      } else if (reg.admission_session_name) {
        setSessionInputText(reg.admission_session_name);
      }
    } else if (reg.admission_session_name) {
      setSessionInputText(reg.admission_session_name);
    }

    if (reg.programme) {
      const match = progList.find((p) => p.id === reg.programme);
      if (match) {
        setSelectedSchoolId(match.schoolId);
        setSelectedDepartmentId(match.departmentId);
      }
    }
  }

  async function reloadRequirementsAndTimeline() {
    try {
      const [reqs, events] = await Promise.all([
        getLegacyRequirements(),
        getLegacyTimeline(),
      ]);
      setRequirements(reqs);
      setTimeline(events);
    } catch (e) {
      console.warn("Could not load requirements or timeline:", e);
    }
  }

  function goToStep(targetStep: number) {
    if (targetStep <= maxStepReached || (registration && targetStep <= 4)) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setStep(targetStep);
    }
  }

  // --- Returning Student Lookup & Resume Handlers ---
  async function handleMatricLookup(explicitMatric?: string) {
    const raw = (explicitMatric || startForm.matric_number || "").trim().toUpperCase();
    if (!raw || raw.length < 4) return;

    setLookupLoading(true);
    try {
      const res = await lookupLegacyMatric(raw);
      if (res && res.exists) {
        setLookupResult(res);
        if (res.email) {
          setResumeEmail(res.email);
        }
        setResumeMode("resume");
        if (res.correction_note) {
          setSuccessMsg(
            `Found existing registration for ${res.full_name || raw}. Status: ${
              res.status_display || res.status
            }.`
          );
        }
      } else {
        setLookupResult(null);
      }
    } catch {
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleResumeRegistration(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailToUse = resumeEmail.trim() || lookupResult?.email || "";
    if (!emailToUse) {
      setErrorMsg("Please enter the email address registered with your account.");
      return;
    }
    if (!resumePassword) {
      setErrorMsg("Please enter your portal password.");
      return;
    }

    setResuming(true);
    try {
      await login(emailToUse, resumePassword);

      const reg = await getMyLegacyRegistration();
      if (reg && reg.id) {
        setRegistration(reg);
        populateFormFromRegistration(reg, programmes, sessions);
        await reloadRequirementsAndTimeline();

        if (reg.status === "pending" || reg.status === "correction_required") {
          if (reg.programme && reg.date_of_birth && reg.phone) {
            setStep(3);
            setMaxStepReached(4);
          } else {
            setStep(2);
            setMaxStepReached(3);
          }
        } else {
          setStep(5);
          setMaxStepReached(5);
        }
        setSuccessMsg(
          `Welcome back, ${reg.first_name || "student"}! Application resumed.`
        );
      } else {
        setErrorMsg("No active onboarding record found for this account.");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message || "" : "";
      if (
        (err instanceof ApiError && err.code === "email_not_verified") ||
        /verif/i.test(msg)
      ) {
        setUnverifiedEmail(emailToUse);
      }
      if (err instanceof ApiError) {
        setErrorMsg(
          err.message || "Failed to sign in. Please verify your email and password."
        );
      } else {
        setErrorMsg("Failed to sign in. Please verify your password.");
      }
    } finally {
      setResuming(false);
    }
  }

  // --- Step 1: Start Registration ---
  async function handleStartRegistration(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!startForm.matric_number.trim()) {
      setErrorMsg("Please enter your existing Matriculation Number.");
      return;
    }
    if (!startForm.first_name?.trim() || !startForm.last_name?.trim()) {
      setErrorMsg("First name and Last name are required.");
      return;
    }
    if (!startForm.phone?.trim()) {
      setErrorMsg("Phone number is required.");
      return;
    }
    if (!startForm.email?.trim() || !startForm.password) {
      setErrorMsg("Email address and Password are required to secure your account.");
      return;
    }
    if (startForm.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (startForm.password !== startForm.password_confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await startLegacyRegistration(startForm);
      setRegistration(res.registration);
      populateFormFromRegistration(res.registration, programmes, sessions);
      setSuccessMsg("Account registered! Please complete your academic details.");
      await reloadRequirementsAndTimeline();
      setMaxStepReached((prev) => Math.max(prev, 2));
      setStep(2);
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = err.message || "";
        if (
          msg.toLowerCase().includes("already have an existing-student registration") ||
          msg.toLowerCase().includes("in progress")
        ) {
          try {
            const reg = await getMyLegacyRegistration();
            if (reg && reg.id) {
              setRegistration(reg);
              populateFormFromRegistration(reg, programmes, sessions);
              await reloadRequirementsAndTimeline();
              if (reg.programme && reg.date_of_birth && reg.phone) {
                setStep(3);
                setMaxStepReached(4);
              } else {
                setStep(2);
                setMaxStepReached(3);
              }
              setSuccessMsg("Resumed your active registration in progress.");
              return;
            }
          } catch {
            // fallback
          }
        }
        if (msg.toLowerCase().includes("staff accounts cannot start a student registration")) {
          clearTokens();
          setErrorMsg(
            "A previous staff session was active in your browser and has now been cleared. Please click 'Start Onboarding' again to proceed."
          );
          return;
        }
        if (
          msg.toLowerCase().includes("already exists") ||
          msg.toLowerCase().includes("log in first") ||
          msg.toLowerCase().includes("already registered")
        ) {
          if (startForm.email) setResumeEmail(startForm.email);
          setResumeMode("resume");
          setErrorMsg(
            "An account for this registration already exists. Enter your password below to resume where you left off."
          );
          return;
        }
        setErrorMsg(err.message || "Failed to start registration.");
      } else {
        setErrorMsg("Failed to connect to portal server. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resolveSessionId(text: string): number | undefined {
    const clean = text.trim().toLowerCase();
    if (!clean) return undefined;

    const exact = sessions.find((s) => s.name.toLowerCase() === clean);
    if (exact) return Number(exact.id);

    const partial = sessions.find(
      (s) => s.name.toLowerCase().startsWith(clean) || s.name.includes(clean)
    );
    if (partial) return Number(partial.id);

    return profileForm.admission_session;
  }

  // --- Step 2: Save Profile ---
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!profileForm.first_name?.trim() || !profileForm.last_name?.trim()) {
      setErrorMsg("First Name and Last Name are required.");
      return;
    }
    if (!profileForm.date_of_birth) {
      setErrorMsg("Date of Birth is required.");
      return;
    }
    if (!profileForm.phone?.trim()) {
      setErrorMsg("Phone number is required.");
      return;
    }
    if (!profileForm.state_of_origin?.trim() || !profileForm.lga?.trim()) {
      setErrorMsg("State of Origin and LGA are required.");
      return;
    }
    if (!profileForm.address?.trim()) {
      setErrorMsg("Residential Address is required.");
      return;
    }
    if (!profileForm.programme) {
      setErrorMsg("Please select your enrolled Programme of study.");
      return;
    }

    const resolvedSessionId =
      resolveSessionId(sessionInputText) || profileForm.admission_session;
    if (!resolvedSessionId) {
      setErrorMsg(
        "Please enter or select a valid Admission Session (e.g. 2021/2022)."
      );
      return;
    }

    if (!profileForm.current_level) {
      setErrorMsg("Please select your Current Academic Level.");
      return;
    }

    if (!profileForm.guardian_name?.trim() || !profileForm.guardian_phone?.trim()) {
      setErrorMsg("Guardian Full Name and Guardian Phone Number are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<LegacyProfileInput> = {
        ...profileForm,
        admission_session: resolvedSessionId,
      };

      const updated = await updateMyLegacyProfile(payload);
      setRegistration(updated);
      setProfileForm((prev) => ({
        ...prev,
        admission_session: resolvedSessionId,
      }));
      setSuccessMsg("Academic and profile details saved successfully.");
      await reloadRequirementsAndTimeline();
      setMaxStepReached((prev) => Math.max(prev, 3));
      setStep(3);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Could not save profile details.");
      } else {
        setErrorMsg("Failed to save profile. Please check all fields.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // --- Step 3: Document Uploads ---
  async function handleFileUpload(requirementId: number, file: File) {
    setErrorMsg(null);
    setSuccessMsg(null);

    const activeRequirementsList =
      requirements.length > 0 ? requirements : DEFAULT_FALLBACK_REQUIREMENTS;
    const reqItem = activeRequirementsList.find(
      (i) => i.requirement.id === requirementId
    )?.requirement;

    const allowedExts =
      reqItem?.allowed_extensions ||
      (reqItem?.allowed_file_types
        ? reqItem.allowed_file_types
            .split(",")
            .map((s) => s.trim().toLowerCase().replace(/^\./, ""))
        : null) ||
      reqItem?.allowed_formats || ["pdf", "jpg", "jpeg", "png"];
    const maxMb =
      reqItem?.max_size_mb ||
      (reqItem?.max_file_size ? Math.round(reqItem.max_file_size / (1024 * 1024)) : 5);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (allowedExts.length > 0 && !allowedExts.includes(ext)) {
      setErrorMsg(
        `Only ${allowedExts.map((e) => e.toUpperCase()).join(", ")} files are allowed.`
      );
      return;
    }

    if (file.size > maxMb * 1024 * 1024) {
      setErrorMsg(`File is too large. Maximum allowed file size is ${maxMb}MB.`);
      return;
    }

    setUploadingDocId(requirementId);
    try {
      await uploadLegacyDocument(requirementId, file);
      setSuccessMsg("Document uploaded successfully.");
      await Promise.all([
        reloadRequirementsAndTimeline(),
        getMyLegacyRegistration().then((reg) => setRegistration(reg)).catch(() => {}),
      ]);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to upload document.");
      } else {
        setErrorMsg(
          "Upload error. Please ensure file is a valid format and under the size limit."
        );
      }
    } finally {
      setUploadingDocId(null);
    }
  }

  async function handleDeleteDocument(documentId: number) {
    if (!confirm("Are you sure you want to remove this document?")) return;
    setErrorMsg(null);
    try {
      await deleteLegacyDocument(documentId);
      await Promise.all([
        reloadRequirementsAndTimeline(),
        getMyLegacyRegistration().then((reg) => setRegistration(reg)).catch(() => {}),
      ]);
      setSuccessMsg("Document removed.");
    } catch {
      setErrorMsg("Could not delete document.");
    }
  }

  // --- Step 4: Final Submit ---
  async function handleSubmitDossier(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!declarationAccepted) {
      setErrorMsg("You must check the truthfulness declaration before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitLegacyRegistration(true);
      setRegistration(res);
      setSuccessMsg(
        "Your onboarding application has been submitted to the Registry for verification."
      );
      await reloadRequirementsAndTimeline();
      setMaxStepReached(5);
      setStep(5);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(
          err.message ||
            "Could not submit registration. Ensure all required fields and documents are complete."
        );
      } else {
        setErrorMsg("Submission failed. Please check your document checklist.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container} data-wide-auth="true">
        <div className={styles.loadingBox}>
          <Loader2 className={styles.spinIcon} size={40} />
          <p>Loading digital onboarding system...</p>
        </div>
      </div>
    );
  }

  const currentStepObj = STEPS.find((s) => s.num === step) || STEPS[0];
  const progressPercent = (step / STEPS.length) * 100;

  return (
    <div className={styles.container} data-wide-auth="true">
      {/* Header Banner */}
      <header className={styles.header}>
        <div className={styles.badge}>
          <Sparkles size={13} />
          <span>Existing Student Digital Onboarding</span>
        </div>
        <h1 className={styles.title}>Digitize Your Student Record</h1>
        <p className={styles.subtitle}>
          Migrate your polytechnic or degree records, submit archive documents for registry
          verification, and activate full Student Portal access.
        </p>
      </header>

      {/* Stepper Navigation (Desktop + Mobile) */}
      <StepperNav
        step={step}
        maxStepReached={maxStepReached}
        registration={registration}
        onStepClick={goToStep}
        progressPercent={progressPercent}
        currentStepObj={currentStepObj}
      />

      {/* Feedback Alerts */}
      {errorMsg && (
        <Alert tone="error" className={styles.alert}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </Alert>
      )}
      {successMsg && (
        <Alert tone="success" className={styles.alert}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </Alert>
      )}

      {/* Step Components */}
      {step === 1 && (
        <Step1Account
          resumeMode={resumeMode}
          setResumeMode={setResumeMode}
          lookupResult={lookupResult}
          setLookupResult={setLookupResult}
          lookupLoading={lookupLoading}
          handleMatricLookup={handleMatricLookup}
          resumeEmail={resumeEmail}
          setResumeEmail={setResumeEmail}
          resumePassword={resumePassword}
          setResumePassword={setResumePassword}
          resuming={resuming}
          unverifiedEmail={unverifiedEmail}
          handleResumeRegistration={handleResumeRegistration}
          startForm={startForm}
          setStartForm={setStartForm}
          submitting={submitting}
          handleStartRegistration={handleStartRegistration}
          setErrorMsg={setErrorMsg}
        />
      )}

      {step === 2 && (
        <Step2Profile
          registration={registration}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          schools={schools}
          departments={departments}
          programmes={programmes}
          levels={levels}
          sessions={sessions}
          selectedSchoolId={selectedSchoolId}
          setSelectedSchoolId={setSelectedSchoolId}
          selectedDepartmentId={selectedDepartmentId}
          setSelectedDepartmentId={setSelectedDepartmentId}
          sessionInputText={sessionInputText}
          setSessionInputText={setSessionInputText}
          submitting={submitting}
          onBack={() => setStep(1)}
          onSubmit={handleSaveProfile}
        />
      )}

      {step === 3 && (
        <Step3Documents
          registration={registration}
          requirements={requirements}
          uploadingDocId={uploadingDocId}
          handleFileUpload={handleFileUpload}
          handleDeleteDocument={handleDeleteDocument}
          onBack={() => setStep(2)}
          onNext={() => {
            setMaxStepReached((prev) => Math.max(prev, 4));
            setStep(4);
          }}
        />
      )}

      {step === 4 && (
        <Step4Review
          registration={registration}
          startForm={startForm}
          profileForm={profileForm}
          schools={schools}
          departments={departments}
          programmes={programmes}
          levels={levels}
          sessions={sessions}
          sessionInputText={sessionInputText}
          selectedSchoolId={selectedSchoolId}
          selectedDepartmentId={selectedDepartmentId}
          requirements={requirements}
          declarationAccepted={declarationAccepted}
          setDeclarationAccepted={setDeclarationAccepted}
          submitting={submitting}
          onBack={() => setStep(3)}
          onSubmit={handleSubmitDossier}
        />
      )}

      {step === 5 && (
        <Step5Status
          registration={registration}
          timeline={timeline}
          onRefresh={async () => {
            setLoading(true);
            const reg = await getMyLegacyRegistration();
            setRegistration(reg);
            await reloadRequirementsAndTimeline();
            setLoading(false);
          }}
          onReUpload={() => setStep(3)}
          onReviewProfile={() => setStep(2)}
        />
      )}
    </div>
  );
}
