"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  GraduationCap,
  Info,
  Loader2,
  Lock,
  Phone,
  RefreshCw,
  School as SchoolIcon,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  Users,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  DocStatusTag,
  Field,
  FileUpload,
  Input,
  Select,
} from "@/components/ui";
import {
  deleteLegacyDocument,
  getLegacyRequirements,
  getLegacyTimeline,
  getMyLegacyRegistration,
  startLegacyRegistration,
  submitLegacyRegistration,
  updateMyLegacyProfile,
  uploadLegacyDocument,
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
import { ApiError } from "@/lib/api";
import type {
  LegacyProfileInput,
  LegacyRegistrationDetail,
  LegacyRegistrationEvent,
  LegacyRequirementChecklistItem,
  LegacyStartInput,
} from "@/types/legacy";
import type { AcademicSession } from "@/types/domain";
import styles from "./existing-student.module.css";

interface FacultyOption {
  id: number;
  name: string;
  code?: string;
}

interface DepartmentOption {
  id: number;
  name: string;
  code?: string;
  schoolId: number;
}

interface ProgrammeOption {
  id: number;
  name: string;
  type?: string;
  departmentId: number;
  departmentName?: string;
  schoolId: number;
  schoolName?: string;
  duration_years?: number;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const MARITAL_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

const RELIGION_OPTIONS = [
  { value: "Christianity", label: "Christianity" },
  { value: "Islam", label: "Islam" },
  { value: "Other", label: "Other" },
];

const RELATIONSHIP_OPTIONS = [
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

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const STEPS = [
  { num: 1, label: "Matric & Account", shortTitle: "Account Setup" },
  { num: 2, label: "Profile & Academic", shortTitle: "Profile & Academic" },
  { num: 3, label: "Documents", shortTitle: "Upload Documents" },
  { num: 4, label: "Review & Submit", shortTitle: "Review & Submit" },
  { num: 5, label: "Status & Approval", shortTitle: "Status Tracker" },
];

const DEFAULT_FALLBACK_REQUIREMENTS: LegacyRequirementChecklistItem[] = [
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

export default function ExistingStudentOnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
        // Case 1: User already has an active registration
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
        // Case 2: Stale staff session in browser
        if (msg.toLowerCase().includes("staff accounts cannot start a student registration")) {
          clearTokens();
          setErrorMsg(
            "A previous staff session was active in your browser and has now been cleared. Please click 'Start Onboarding' again to proceed."
          );
          return;
        }
        // Case 3: Email already registered in accounts
        if (msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("log in first")) {
          setErrorMsg(
            "An account with this email address already exists. If you already registered, please log in with your password to resume your registration."
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

  // Helper to resolve session ID from text input
  function resolveSessionId(text: string): number | undefined {
    const clean = text.trim().toLowerCase();
    if (!clean) return undefined;

    // 1. Direct match by name
    const exact = sessions.find((s) => s.name.toLowerCase() === clean);
    if (exact) return Number(exact.id);

    // 2. Partial year match e.g. "2021" matches "2021/2022"
    const partial = sessions.find(
      (s) => s.name.toLowerCase().startsWith(clean) || s.name.includes(clean)
    );
    if (partial) return Number(partial.id);

    // 3. Fallback to existing profile session ID
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
      (reqItem?.max_file_size
        ? Math.round(reqItem.max_file_size / (1024 * 1024))
        : 5);

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
    } catch (err) {
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
      setSuccessMsg("Your onboarding application has been submitted to the Registry for verification.");
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

  // Filtered dropdown lists based on cascading selection
  const filteredDepartments = selectedSchoolId
    ? departments.filter((d) => d.schoolId === selectedSchoolId)
    : departments;

  const filteredProgrammes = selectedDepartmentId
    ? programmes.filter((p) => p.departmentId === selectedDepartmentId)
    : selectedSchoolId
    ? programmes.filter((p) => p.schoolId === selectedSchoolId)
    : programmes;

  // Selected programme, department, and faculty details
  const activeProg = programmes.find((p) => p.id === profileForm.programme);
  const activeDept = departments.find(
    (d) => d.id === (activeProg?.departmentId || selectedDepartmentId)
  );
  const activeSchool = schools.find(
    (s) => s.id === (activeProg?.schoolId || activeDept?.schoolId || selectedSchoolId)
  );

  // Dynamic level options formatted directly from backend Level objects
  const isDegreeProgramme =
    activeProg?.type === "BSC" ||
    activeProg?.type === "BENG" ||
    activeProg?.type === "DEGREE" ||
    activeProg?.type === "DIRECT_ENTRY";
  const isHndProgramme = activeProg?.type === "HND";
  const isNdProgramme = activeProg?.type === "ND";

  // Build options dynamically from live backend levels list
  const levelSelectOptions = [
    { value: "", label: "Select Current Academic Level" },
    ...levels
      .filter((lvl) => {
        const num = lvl.numeric_value || parseInt(lvl.code, 10) || lvl.id;
        if (isNdProgramme) return num === 100 || num === 200 || lvl.id === 1 || lvl.id === 2;
        if (isHndProgramme) return num === 300 || num === 400 || lvl.id === 3 || lvl.id === 4;
        return true; // For BSC, BENG, Degree, and unselected programme, show all levels from backend
      })
      .map((lvl) => {
        const num = lvl.numeric_value || parseInt(lvl.code, 10) || lvl.id;
        let formattedLabel = lvl.name;

        if (isDegreeProgramme) {
          if (num === 100 || lvl.code === "100" || lvl.id === 1) formattedLabel = `${lvl.name} (Year 1 / Fresh Entry)`;
          else if (num === 200 || lvl.code === "200" || lvl.id === 2) formattedLabel = `${lvl.name} (Year 2 / Direct Entry)`;
          else if (num === 300 || lvl.code === "300" || lvl.id === 3) formattedLabel = `${lvl.name} (Year 3)`;
          else if (num === 400 || lvl.code === "400" || lvl.id === 4) formattedLabel = `${lvl.name} (Year 4)`;
          else if (num === 500 || lvl.code === "500" || lvl.id === 5) formattedLabel = `${lvl.name} (Year 5 / Final Year)`;
          else formattedLabel = `${lvl.name}`;
        } else if (isNdProgramme) {
          if (num === 100 || lvl.code === "100" || lvl.id === 1) formattedLabel = `ND I (${lvl.name})`;
          else if (num === 200 || lvl.code === "200" || lvl.id === 2) formattedLabel = `ND II (${lvl.name})`;
          else formattedLabel = `ND - ${lvl.name}`;
        } else if (isHndProgramme) {
          if (num === 300 || lvl.code === "300" || lvl.id === 3) formattedLabel = `HND I (${lvl.name})`;
          else if (num === 400 || lvl.code === "400" || lvl.id === 4) formattedLabel = `HND II (${lvl.name})`;
          else formattedLabel = `HND - ${lvl.name}`;
        } else {
          // General / Polytechnic & University combined fallback
          if (num === 100 || lvl.code === "100" || lvl.id === 1) formattedLabel = `ND I / ${lvl.name}`;
          else if (num === 200 || lvl.code === "200" || lvl.id === 2) formattedLabel = `ND II / ${lvl.name}`;
          else if (num === 300 || lvl.code === "300" || lvl.id === 3) formattedLabel = `HND I / ${lvl.name}`;
          else if (num === 400 || lvl.code === "400" || lvl.id === 4) formattedLabel = `HND II / ${lvl.name}`;
          else if (num === 500 || lvl.code === "500" || lvl.id === 5) formattedLabel = `${lvl.name} (B.Sc / B.Eng Final Year)`;
        }

        return {
          value: String(lvl.id),
          label: formattedLabel,
        };
      }),
  ];

  // Lookup active level name for display
  const activeLevelObj = levels.find(
    (l) => l.id === Number(profileForm.current_level)
  );

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
          Migrate your polytechnic or degree records, submit archive documents for registry verification, and activate full Student Portal access.
        </p>
      </header>

      {/* Desktop Stepper */}
      <nav className={styles.stepperDesktop} aria-label="Onboarding Progress">
        {STEPS.map((s, idx) => {
          const active = step === s.num;
          const completed = step > s.num || (step === 5 && s.num < 5);
          const isClickable = s.num <= maxStepReached || (registration && s.num <= 4);

          return (
            <div key={s.num} style={{ display: "flex", alignItems: "center", flex: idx === STEPS.length - 1 ? 0 : 1 }}>
              <button
                type="button"
                onClick={() => isClickable && goToStep(s.num)}
                disabled={!isClickable}
                className={`${styles.stepItem} ${active ? styles.stepActive : ""} ${
                  completed ? styles.stepCompleted : ""
                } ${isClickable ? styles.stepItemClickable : ""}`}
                title={s.label}
              >
                <div className={styles.stepCircle}>
                  {completed ? <Check size={14} strokeWidth={3} /> : s.num}
                </div>
                <span>{s.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={`${styles.stepDivider} ${
                    completed ? styles.stepDividerFilled : ""
                  }`}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Mobile Stepper */}
      <div className={styles.stepperMobile}>
        <div className={styles.stepperMobileTop}>
          <span className={styles.stepperMobileBadge}>
            Step {step} of {STEPS.length}
          </span>
          <span className={styles.stepperMobileTitle}>{currentStepObj.shortTitle}</span>
        </div>
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className={styles.stepperMobileDots}>
          {STEPS.map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            const isClickable = s.num <= maxStepReached || (registration && s.num <= 4);

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => isClickable && goToStep(s.num)}
                disabled={!isClickable}
                className={`${styles.mobileDot} ${
                  isActive
                    ? styles.mobileDotActive
                    : isCompleted
                    ? styles.mobileDotCompleted
                    : ""
                }`}
              >
                {isCompleted ? "✓" : s.num}
              </button>
            );
          })}
        </div>
      </div>

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

      {/* Datalist for Historical Sessions */}
      <datalist id="session-datalist">
        {sessions.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>

      {/* ========================================================= */}
      {/* STEP 1: Matric Number & Account Creation                 */}
      {/* ========================================================= */}
      {step === 1 && (
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIconBox}>
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Step 1: Enter Your Matriculation Number</h2>
              <p className={styles.cardDesc}>
                Provide your existing matric number and create secure credentials for portal access.
              </p>
            </div>
          </div>

          <div className={styles.infoCallout}>
            <Info size={18} />
            <span>
              <strong>Important:</strong> Your matriculation number will be cross-referenced with Marist Polytechnic's historical records. Ensure your name and phone match your official admission credentials.
            </span>
          </div>

          <form onSubmit={handleStartRegistration} className={styles.form}>
            <div className={styles.formGrid2}>
              <Field label="Institutional Matriculation Number" required>
                <Input
                  placeholder="e.g. MAP/ND/CS/2022/0042"
                  value={startForm.matric_number}
                  onChange={(e) =>
                    setStartForm({ ...startForm, matric_number: e.target.value.toUpperCase() })
                  }
                  autoCapitalize="characters"
                  required
                />
              </Field>
              <Field label="Phone Number" required>
                <Input
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={startForm.phone}
                  onChange={(e) =>
                    setStartForm({ ...startForm, phone: e.target.value })
                  }
                  required
                />
              </Field>
            </div>

            <div className={styles.formGrid2}>
              <Field label="First Name" required>
                <Input
                  placeholder="First name"
                  value={startForm.first_name}
                  onChange={(e) =>
                    setStartForm({ ...startForm, first_name: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Last Name" required>
                <Input
                  placeholder="Last name"
                  value={startForm.last_name}
                  onChange={(e) =>
                    setStartForm({ ...startForm, last_name: e.target.value })
                  }
                  required
                />
              </Field>
            </div>

            <Field label="Email Address (Used for Login & Registry Notifications)" required>
              <Input
                type="email"
                placeholder="student@example.com"
                value={startForm.email}
                onChange={(e) =>
                  setStartForm({ ...startForm, email: e.target.value })
                }
                required
              />
            </Field>

            <div className={styles.formGrid2}>
              <Field label="Portal Password" required>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={startForm.password}
                  onChange={(e) =>
                    setStartForm({ ...startForm, password: e.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Confirm Password" required>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={startForm.password_confirm}
                  onChange={(e) =>
                    setStartForm({
                      ...startForm,
                      password_confirm: e.target.value,
                    })
                  }
                  required
                />
              </Field>
            </div>

            <div className={styles.cardActions}>
              <Link href="/login" className={styles.cancelLink}>
                Already have an active account? Log in →
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className={styles.spinIcon} size={16} /> Validating Record...
                  </>
                ) : (
                  <>
                    Start Onboarding <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ========================================================= */}
      {/* STEP 2: Personal, Academic & Guardian Information        */}
      {/* ========================================================= */}
      {step === 2 && (
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIconBox}>
              <User size={22} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Step 2: Personal & Academic Details</h2>
              <p className={styles.cardDesc}>
                Select your Faculty/School, Department, Programme, enter your Admission Session, and choose your academic level.
              </p>
            </div>
          </div>

          {registration?.matric_number && (
            <div className={styles.claimBanner}>
              <span className={styles.claimLabel}>Matriculation Claim:</span>
              <span className={styles.claimValue}>{registration.matric_number}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className={styles.form}>
            {/* Academic Enrolment Details */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <GraduationCap size={16} />
                <span>Academic Enrolment & Placement</span>
              </div>

              {/* Faculty / School and Department (Cascading Dropdowns) */}
              <div className={styles.formGrid2}>
                <Field label="Faculty / School" required>
                  <Select
                    value={selectedSchoolId ? String(selectedSchoolId) : ""}
                    onChange={(e) => {
                      const newSchoolId = Number(e.target.value) || "";
                      setSelectedSchoolId(newSchoolId);
                      setSelectedDepartmentId("");
                      setProfileForm((prev) => ({ ...prev, programme: undefined }));
                    }}
                    options={[
                      { value: "", label: "Select Faculty / School" },
                      ...schools.map((s) => ({
                        value: String(s.id),
                        label: s.name,
                      })),
                    ]}
                    required
                  />
                </Field>

                <Field label="Department" required>
                  <Select
                    value={selectedDepartmentId ? String(selectedDepartmentId) : ""}
                    onChange={(e) => {
                      const newDeptId = Number(e.target.value) || "";
                      setSelectedDepartmentId(newDeptId);
                      if (newDeptId) {
                        const dept = departments.find((d) => d.id === newDeptId);
                        if (dept && (!selectedSchoolId || selectedSchoolId !== dept.schoolId)) {
                          setSelectedSchoolId(dept.schoolId);
                        }
                      }
                      setProfileForm((prev) => ({ ...prev, programme: undefined }));
                    }}
                    options={[
                      {
                        value: "",
                        label: selectedSchoolId
                          ? "Select Department"
                          : "Select School first or pick Department",
                      },
                      ...filteredDepartments.map((d) => ({
                        value: String(d.id),
                        label: d.name,
                      })),
                    ]}
                    required
                  />
                </Field>
              </div>

              {/* Programme, Session (Section Input), and Live Backend Levels */}
              <div className={styles.formGrid3}>
                <Field label="Programme of Study" required>
                  <Select
                    value={profileForm.programme ? String(profileForm.programme) : ""}
                    onChange={(e) => {
                      const newProgId = Number(e.target.value) || undefined;
                      const prog = programmes.find((p) => p.id === newProgId);

                      // Check if existing level selection is valid for the new programme
                      let updatedLevel = profileForm.current_level;
                      if (prog && updatedLevel) {
                        const lvlObj = levels.find((l) => l.id === updatedLevel);
                        const lvlNum =
                          lvlObj?.numeric_value ||
                          parseInt(lvlObj?.code || "", 10) ||
                          lvlObj?.id ||
                          0;
                        if (prog.type === "ND" && (lvlNum > 200 || updatedLevel > 2)) {
                          updatedLevel = undefined;
                        } else if (prog.type === "HND" && (lvlNum < 300 || lvlNum > 400)) {
                          updatedLevel = undefined;
                        }
                      }

                      setProfileForm((prev) => ({
                        ...prev,
                        programme: newProgId,
                        current_level: updatedLevel,
                      }));

                      if (newProgId && prog) {
                        setSelectedDepartmentId(prog.departmentId);
                        setSelectedSchoolId(prog.schoolId);
                      }
                    }}
                    options={[
                      {
                        value: "",
                        label: selectedDepartmentId
                          ? "Select Programme"
                          : "Select Department first or pick Programme",
                      },
                      ...filteredProgrammes.map((p) => ({
                        value: String(p.id),
                        label: `${p.name} (${p.type || "ND"})`,
                      })),
                    ]}
                    required
                  />
                </Field>

                {/* Admission Session Input with DataList for Historical / Custom Sessions */}
                <Field label="Admission Session (Year of Entry)" required>
                  <Input
                    type="text"
                    list="session-datalist"
                    placeholder="e.g. 2021/2022, 2019/2020"
                    value={sessionInputText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSessionInputText(val);
                      const matched = sessions.find(
                        (s) => s.name.toLowerCase() === val.trim().toLowerCase()
                      );
                      setProfileForm((prev) => ({
                        ...prev,
                        admission_session: matched ? Number(matched.id) : prev.admission_session,
                      }));
                    }}
                    required
                  />
                </Field>

                {/* Current Level loaded directly from backend Level objects */}
                <Field label="Current Academic Level" required>
                  <Select
                    value={profileForm.current_level ? String(profileForm.current_level) : ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        current_level: Number(e.target.value) || undefined,
                      })
                    }
                    options={levelSelectOptions}
                    required
                  />
                </Field>
              </div>
            </div>

            {/* Personal & Contact Information */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <User size={16} />
                <span>Personal & Contact Information</span>
              </div>

              <div className={styles.formGrid3}>
                <Field label="First Name" required>
                  <Input
                    placeholder="e.g. John"
                    value={profileForm.first_name || ""}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, first_name: e.target.value })
                    }
                    required
                  />
                </Field>

                <Field label="Middle Name">
                  <Input
                    placeholder="e.g. Chukwu"
                    value={profileForm.middle_name || ""}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, middle_name: e.target.value })
                    }
                  />
                </Field>

                <Field label="Last Name" required>
                  <Input
                    placeholder="e.g. Okoro"
                    value={profileForm.last_name || ""}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, last_name: e.target.value })
                    }
                    required
                  />
                </Field>
              </div>

              <div className={styles.formGrid3}>
                <Field label="Date of Birth" required>
                  <Input
                    type="date"
                    value={profileForm.date_of_birth || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        date_of_birth: e.target.value,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="Gender" required>
                  <Select
                    value={profileForm.gender || "male"}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, gender: e.target.value })
                    }
                    options={GENDER_OPTIONS}
                    required
                  />
                </Field>

                <Field label="Marital Status" required>
                  <Select
                    value={profileForm.marital_status || "single"}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        marital_status: e.target.value,
                      })
                    }
                    options={MARITAL_OPTIONS}
                    required
                  />
                </Field>
              </div>

              <div className={styles.formGrid3}>
                <Field label="Phone Number" required>
                  <Input
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={profileForm.phone || ""}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    required
                  />
                </Field>

                <Field label="Email Address" required>
                  <Input
                    type="email"
                    placeholder="student@example.com"
                    value={profileForm.email || ""}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    required
                  />
                </Field>

                <Field label="Religion" required>
                  <Select
                    value={profileForm.religion || "Christianity"}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        religion: e.target.value,
                      })
                    }
                    options={RELIGION_OPTIONS}
                    required
                  />
                </Field>
              </div>

              <div className={styles.formGrid3}>
                <Field label="Nationality" required>
                  <Input
                    placeholder="e.g. Nigerian"
                    value={profileForm.nationality || "Nigerian"}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        nationality: e.target.value,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="State of Origin" required>
                  <Select
                    value={profileForm.state_of_origin || "Enugu"}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        state_of_origin: e.target.value,
                      })
                    }
                    options={NIGERIAN_STATES.map((st) => ({
                      value: st,
                      label: st,
                    }))}
                    required
                  />
                </Field>

                <Field label="Local Government Area (LGA)" required>
                  <Input
                    placeholder="e.g. Nkanu West"
                    value={profileForm.lga || ""}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, lga: e.target.value })
                    }
                    required
                  />
                </Field>
              </div>

              <Field label="Residential Address" required>
                <Input
                  placeholder="e.g. 12 Ogui Road, Enugu"
                  value={profileForm.address || ""}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  required
                />
              </Field>
            </div>

            {/* Next of Kin / Guardian Information */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <Users size={16} />
                <span>Next of Kin / Guardian Details</span>
              </div>

              <div className={styles.formGrid3}>
                <Field label="Guardian Full Name" required>
                  <Input
                    placeholder="e.g. Chief B. Okonkwo"
                    value={profileForm.guardian_name || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        guardian_name: e.target.value,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="Relationship to Student" required>
                  <Select
                    value={profileForm.guardian_relationship || "Parent"}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        guardian_relationship: e.target.value,
                      })
                    }
                    options={RELATIONSHIP_OPTIONS}
                    required
                  />
                </Field>

                <Field label="Guardian Phone Number" required>
                  <Input
                    type="tel"
                    placeholder="e.g. 08031234567"
                    value={profileForm.guardian_phone || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        guardian_phone: e.target.value,
                      })
                    }
                    required
                  />
                </Field>
              </div>
            </div>

            <div className={styles.cardActions}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={16} /> Back
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className={styles.spinIcon} size={16} /> Saving Details...
                  </>
                ) : (
                  <>
                    Continue to Document Uploads <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ========================================================= */}
      {/* STEP 3: Required Supporting Documents Checklist          */}
      {/* ========================================================= */}
      {step === 3 && (
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIconBox}>
              <UploadCloud size={22} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Step 3: Upload Supporting Documents</h2>
              <p className={styles.cardDesc}>
                Upload clear scans or photos of your credentials for verification against school physical archives.
              </p>
            </div>
          </div>

          {/* Upload Progress Status Banner */}
          {(() => {
            const activeRequirementsList =
              requirements.length > 0 ? requirements : DEFAULT_FALLBACK_REQUIREMENTS;
            const requiredRequirements = activeRequirementsList.filter(
              (item) => item.requirement.required
            );
            const uploadedRequiredCount = requiredRequirements.filter(
              (item) => item.document && Boolean(item.document.id)
            ).length;
            const totalRequiredCount = requiredRequirements.length;
            const allRequiredUploaded =
              totalRequiredCount > 0 && uploadedRequiredCount === totalRequiredCount;

            return (
              <>
                <div className={styles.docSummaryBanner}>
                  <Alert
                    tone={allRequiredUploaded ? "success" : "info"}
                    title={
                      allRequiredUploaded
                        ? "All required documents uploaded"
                        : `${uploadedRequiredCount} of ${totalRequiredCount} required documents uploaded`
                    }
                  >
                    {allRequiredUploaded
                      ? "You can replace any file before submitting your application to the Registry."
                      : "Upload every required document to continue. Optional documents can be added if you have them."}
                  </Alert>
                </div>

                <div className={styles.docList}>
                  {activeRequirementsList.map((item) => {
                    const req = item.requirement;
                    const doc = item.document;
                    const isUploading = uploadingDocId === req.id;
                    const allowedExts =
                      req.allowed_extensions ||
                      (req.allowed_file_types
                        ? req.allowed_file_types
                            .split(",")
                            .map((s) => s.trim().toLowerCase().replace(/^\./, ""))
                        : null) ||
                      req.allowed_formats || ["pdf", "jpg", "jpeg", "png"];
                    const acceptStr = allowedExts.map((e) => `.${e}`).join(",");
                    const typesUpper = allowedExts.map((e) => e.toUpperCase()).join(", ");
                    const maxMb =
                      req.max_size_mb ||
                      (req.max_file_size
                        ? Math.round(req.max_file_size / (1024 * 1024))
                        : 5);

                    return (
                      <div
                        key={req.id}
                        className={`${styles.docItem} ${doc ? styles.docItemUploaded : ""}`}
                      >
                        <div className={styles.docHeaderRow}>
                          <div className={styles.docTitleBox}>
                            <div className={styles.docTitleWithBadge}>
                              <span className={styles.docName}>{req.name}</span>
                              <Badge tone={req.required ? "info" : "neutral"}>
                                {req.required ? "Required" : "Optional"}
                              </Badge>
                            </div>
                            {req.description && (
                              <p className={styles.docDescription}>{req.description}</p>
                            )}
                            <span className={styles.docMeta}>
                              Accepted Formats: {typesUpper} · Max {maxMb}MB
                            </span>
                          </div>
                        </div>

                        {/* Uploaded File Row */}
                        {doc && (
                          <div className={styles.docUploadedBox}>
                            <div className={styles.docFileInfo}>
                              <div className={styles.docFileIcon}>
                                <FileCheck size={20} />
                              </div>
                              <div className={styles.docFileDetails}>
                                <span className={styles.fileName} title={doc.original_filename}>
                                  {doc.original_filename || "Uploaded Document"}
                                </span>
                                <span className={styles.docUploadMeta}>
                                  Uploaded on {new Date(doc.created_at || Date.now()).toLocaleDateString()}
                                </span>
                              </div>
                              <div className={styles.docStatusBadge}>
                                <DocStatusTag status={doc.status} />
                              </div>
                            </div>

                            <button
                              type="button"
                              className={styles.deleteIconButton}
                              onClick={() => handleDeleteDocument(doc.id)}
                              title="Remove document"
                            >
                              <Trash2 size={15} /> <span>Remove</span>
                            </button>
                          </div>
                        )}

                        {/* Dropzone Upload Component */}
                        <div className={styles.docUploadArea}>
                          <FileUpload
                            disabled={isUploading}
                            loading={isUploading}
                            accept={acceptStr}
                            onSelect={(file) => handleFileUpload(req.id, file)}
                            hint={
                              <>
                                {typesUpper} up to {maxMb} MB
                                {doc && " · uploading a new file replaces the current one"}
                              </>
                            }
                          />
                        </div>

                        {doc?.review_comment && (
                          <div className={styles.docReviewNote}>
                            <strong>Registry Note:</strong> {doc.review_comment}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          <div className={styles.cardActions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
            >
              <ArrowLeft size={16} /> Back to Profile
            </Button>
            <Button
              type="button"
              onClick={() => {
                setMaxStepReached((prev) => Math.max(prev, 4));
                setStep(4);
              }}
            >
              Review & Submit <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* STEP 4: Review and Declaration Submission               */}
      {/* ========================================================= */}
      {step === 4 && (
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardIconBox}>
              <FileCheck size={22} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Step 4: Review Claim & Submit for Verification</h2>
              <p className={styles.cardDesc}>
                Double-check your academic claim before sending it to the Registry.
              </p>
            </div>
          </div>

          <div className={styles.summaryGrid}>
            {/* Identity & Personal Info */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardTitle}>
                <User size={15} />
                <span>Identity & Personal Details</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Matric Number:</span>
                <span className={styles.summaryVal}>{registration?.matric_number || startForm.matric_number}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Full Name:</span>
                <span className={styles.summaryVal}>
                  {profileForm.first_name} {profileForm.middle_name ? `${profileForm.middle_name} ` : ""}{profileForm.last_name}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Date of Birth:</span>
                <span className={styles.summaryVal}>{profileForm.date_of_birth || "Not set"}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Gender & Marital:</span>
                <span className={styles.summaryVal}>
                  {profileForm.gender?.toUpperCase()}, {profileForm.marital_status?.toUpperCase()}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Phone & Email:</span>
                <span className={styles.summaryVal}>
                  {profileForm.phone} / {profileForm.email}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Origin & LGA:</span>
                <span className={styles.summaryVal}>
                  {profileForm.state_of_origin}, {profileForm.lga}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Residential Address:</span>
                <span className={styles.summaryVal}>{profileForm.address || "Not set"}</span>
              </div>
            </div>

            {/* Academic Claims */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardTitle}>
                <GraduationCap size={15} />
                <span>Academic & Placement Claims</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Faculty / School:</span>
                <span className={styles.summaryVal}>
                  {activeSchool?.name || registration?.school_name || "Not specified"}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Department:</span>
                <span className={styles.summaryVal}>
                  {activeDept?.name || registration?.department_name || "Not specified"}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Programme:</span>
                <span className={styles.summaryVal}>
                  {activeProg ? `${activeProg.name} (${activeProg.type})` : registration?.programme_name || "Not specified"}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Admission Session:</span>
                <span className={styles.summaryVal}>
                  {sessionInputText ||
                    sessions.find((s) => s.id === String(profileForm.admission_session))?.name ||
                    registration?.admission_session_name ||
                    "Not specified"}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Current Level:</span>
                <span className={styles.summaryVal}>
                  {activeLevelObj?.name ||
                    registration?.current_level_name ||
                    "Not specified"}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Guardian:</span>
                <span className={styles.summaryVal}>
                  {profileForm.guardian_name} ({profileForm.guardian_relationship}) - {profileForm.guardian_phone}
                </span>
              </div>
            </div>

            {/* Uploaded Documents Summary */}
            <div className={styles.summaryCard} style={{ gridColumn: "1 / -1" }}>
              <div className={styles.summaryCardTitle}>
                <FileCheck size={15} />
                <span>Uploaded Documents & Credentials</span>
              </div>
              <div className={styles.formGrid2}>
                {(requirements.length > 0 ? requirements : DEFAULT_FALLBACK_REQUIREMENTS).map((item) => (
                  <div key={item.requirement.id} className={styles.summaryRow}>
                    <span className={styles.summaryKey}>{item.requirement.name}:</span>
                    <span className={styles.summaryVal}>
                      {item.document ? (
                        <span style={{ color: "#059669", fontWeight: 600 }}>✓ Uploaded ({item.document.original_filename})</span>
                      ) : item.requirement.required ? (
                        <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ Not Uploaded (Required)</span>
                      ) : (
                        <span style={{ color: "#64748b" }}>Not uploaded (Optional)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Missing Checklist Guard */}
          {registration?.missing &&
            (registration.missing.fields.length > 0 ||
              registration.missing.documents.length > 0) && (
              <div className={styles.missingBox}>
                <div className={styles.missingHead}>
                  <AlertCircle size={18} />
                  <span>Incomplete Submission Warning</span>
                </div>
                {registration.missing.fields.length > 0 && (
                  <p>Missing profile fields: {registration.missing.fields.join(", ")}</p>
                )}
                {registration.missing.documents.length > 0 && (
                  <p>Missing documents: {registration.missing.documents.join(", ")}</p>
                )}
              </div>
            )}

          {/* Declaration Checkbox */}
          <div className={styles.declarationBox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
              />
              <span>
                I solemnly declare that all information provided and documents uploaded are authentic, correct, and represent my true academic records at Marist Polytechnic. I understand that fraudulent claims are subject to immediate disqualification and disciplinary action.
              </span>
            </label>
          </div>

          <div className={styles.cardActions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(3)}
            >
              <ArrowLeft size={16} /> Back to Documents
            </Button>
            <Button
              type="button"
              disabled={submitting || !declarationAccepted}
              onClick={handleSubmitDossier}
            >
              {submitting ? (
                <>
                  <Loader2 className={styles.spinIcon} size={16} /> Submitting Dossier...
                </>
              ) : (
                <>
                  <Send size={16} /> Submit for Verification
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* STEP 5: Live Dossier Status Tracker & Outcome            */}
      {/* ========================================================= */}
      {step === 5 && (
        <Card className={styles.card}>
          <div className={styles.statusHero}>
            <div
              className={`${styles.statusHeroBadge} ${
                styles[registration?.status || "submitted"]
              }`}
            >
              {registration?.status === "submitted" && <Clock size={18} />}
              {registration?.status === "under_review" && (
                <RefreshCw size={18} className={styles.spinIcon} />
              )}
              {registration?.status === "correction_required" && <AlertCircle size={18} />}
              {registration?.status === "approved" && <CheckCircle2 size={18} />}
              <span>{registration?.status_display || registration?.status?.toUpperCase() || "SUBMITTED"}</span>
            </div>

            <h2 className={styles.statusTitle}>
              {registration?.status === "approved"
                ? "Your Student Record Has Been Approved & Activated!"
                : registration?.status === "under_review"
                ? "Dossier Under Verification Against Physical Archives"
                : registration?.status === "correction_required"
                ? "Registry Requested Updates / Corrections"
                : "Application Submitted to Registry"}
            </h2>

            <p className={styles.statusMessage}>
              {registration?.status === "approved"
                ? "Your official student profile and portal credentials have been fully activated. You now have full access to course registration, results, fee receipts, and student services."
                : registration?.status === "correction_required"
                ? `Correction instructions: ${
                    registration?.correction_note || "Please update your details and resubmit."
                  }`
                : "Our verification team is cross-checking your submitted matriculation number and credentials against institutional archives. You will be notified once approved."}
            </p>

            <div className={styles.statusActions}>
              {registration?.status === "approved" ? (
                <Button
                  size="lg"
                  onClick={() => router.push("/student/dashboard")}
                >
                  Proceed to Student Portal <ArrowRight size={18} />
                </Button>
              ) : registration?.status === "correction_required" ? (
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  Edit Details & Fix Issues <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={async () => {
                    setLoading(true);
                    const reg = await getMyLegacyRegistration();
                    setRegistration(reg);
                    await reloadRequirementsAndTimeline();
                    setLoading(false);
                  }}
                >
                  <RefreshCw size={16} /> Refresh Status
                </Button>
              )}
            </div>
          </div>

          {/* Audit Timeline */}
          {timeline.length > 0 && (
            <div className={styles.timelineSection}>
              <div className={styles.timelineTitle}>
                <Clock size={16} />
                <span>Verification Activity Log</span>
              </div>
              <div className={styles.timelineList}>
                {timeline.map((item) => (
                  <div key={item.id} className={styles.timelineItem}>
                    <div className={styles.timelinePoint} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHead}>
                        <strong>{item.action.replace(/_/g, " ").toUpperCase()}</strong>
                        <span className={styles.timelineDate}>
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      {item.note && <p className={styles.timelineNote}>{item.note}</p>}
                      {item.actor_email && (
                        <span className={styles.timelineActor}>
                          Logged by {item.actor_email}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
