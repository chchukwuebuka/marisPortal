import { api } from "@/lib/api";
import type {
  OfficialTranscriptData,
  AcademicLevel,
  AcademicSemester,
  AcademicStanding,
  AvailableCoursesData,
  Course,
  CourseRegistration,
  CourseRegistrationItem,
  CourseRegistrationStatus,
  CourseResult,
  CurrentRegistrationResponse,
  CurrentResultResponse,
  GradingScaleItem,
  MyResultsResponse,
  RegistrationSlipData,
  SemesterResultSlipData,
  Student,
  StudentAcademicRecord,
  StudentGuardian,
  StudentProfile,
  StudentStatusHistory,
  AdminDashboardStats,
  AdminStudent360Overview,
  FeePaymentInitResponse,
  FeePaymentVerifyResponse,
  OfficialFeeReceipt,
  StudentDocumentsResponse,
  StudentFeeInvoice,
} from "@/types/student";

// Wire shape interfaces for backend responses (snake_case)
interface WireUser {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
}

interface WireAcademicLevel {
  id?: number;
  name?: string;
  code?: string;
  order?: number;
}

interface WireAcademicSemester {
  id?: number;
  name?: string;
  code?: string;
  order?: number;
}

interface WireNamedEntity {
  id?: number;
  name?: string;
  code?: string;
}

interface WireStudentProfile {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name?: string;
  state_of_origin?: string;
  lga?: string;
  blood_group?: string;
  genotype?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  residential_address?: string;
  address?: string;
  phone?: string;
  email?: string;
  photo?: string;
  updated_at?: string;
}

interface WireStudentGuardian {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  is_primary: boolean;
  created_at?: string;
}

interface WireStatusHistory {
  id: number;
  from_status: string;
  to_status: string;
  reason?: string;
  changed_at: string;
  changed_by_name?: string;
}

interface WireCourse {
  id: number;
  code: string;
  title: string;
  credit_units: number;
  department_name?: string;
  semester?: WireAcademicSemester | null;
  level?: WireAcademicLevel | null;
  description?: string;
  is_core?: boolean;
}

interface WireStudent {
  id: number;
  student_id: string;
  matric_number: string;
  email?: string;
  status: Student["status"];
  entry_mode?: string;
  programme?: number | WireNamedEntity | null;
  programme_name?: string;
  department?: number | WireNamedEntity | null;
  department_name?: string;
  school?: number | WireNamedEntity | null;
  school_name?: string;
  session?: number | WireNamedEntity | null;
  session_name?: string;
  current_level?: number | WireAcademicLevel | null;
  level_name?: string;
  date_enrolled?: string;
  admitted_at?: string;
  created_at?: string;
  user?: WireUser;
  profile?: WireStudentProfile;
  guardians?: WireStudentGuardian[];
  status_history?: WireStatusHistory[];
}

function mapStudent(w: WireStudent): Student {
  if (!w || typeof w !== "object") {
    throw new Error("Student profile is not available. Please ensure your admission offer has been accepted.");
  }

  const profileFullName =
    w.profile?.full_name ||
    [w.profile?.first_name, w.profile?.last_name].filter(Boolean).join(" ") ||
    w.user?.full_name ||
    w.user?.email ||
    w.email ||
    "Student";

  const userObj = {
    id: (w.user && typeof w.user === "object" && typeof w.user.id === "number")
      ? w.user.id
      : (typeof w.id === "number" ? w.id : 0),
    email: w.user?.email || w.email || "",
    firstName: w.user?.first_name || w.profile?.first_name || "",
    lastName: w.user?.last_name || w.profile?.last_name || "",
    fullName: profileFullName,
    phoneNumber: w.user?.phone_number || w.profile?.phone || undefined,
  };

  const levelObj =
    w.current_level && typeof w.current_level === "object" && "id" in w.current_level && typeof w.current_level.id === "number"
      ? {
          id: w.current_level.id,
          name: w.current_level.name || "100 Level",
          code: w.current_level.code || "100",
          order: w.current_level.order || 1,
        }
      : w.level_name
      ? {
          id: typeof w.current_level === "number" ? w.current_level : 1,
          name: w.level_name,
          code: w.level_name,
          order: 1,
        }
      : null;

  const profileObj: StudentProfile = w.profile ? mapProfile(w.profile) : {};
  if (!profileObj.photoUrl) {
    const rawW = w as unknown as Record<string, unknown>;
    const rawUser = w.user as unknown as Record<string, unknown> | undefined;
    const directPhoto =
      rawW.photo ||
      rawW.photo_url ||
      rawW.passport ||
      rawW.avatar ||
      rawUser?.photo;
    if (typeof directPhoto === "string" && directPhoto.trim()) {
      profileObj.photoUrl = directPhoto.trim();
    }
  }

  return {
    id: w.id ?? 0,
    studentId: w.student_id || "",
    matricNumber: w.matric_number || "",
    status: w.status || "provisional",
    entryMode: w.entry_mode || "UTME",
    currentLevel: levelObj,
    admittedSessionName:
      w.session_name ||
      (w.session && typeof w.session === "object" && "name" in w.session ? w.session.name : undefined) ||
      "2026/2027",
    programmeName:
      w.programme_name ||
      (w.programme && typeof w.programme === "object" && "name" in w.programme ? w.programme.name : undefined) ||
      "Academic Programme",
    programmeCode:
      w.programme && typeof w.programme === "object" && "code" in w.programme ? w.programme.code : undefined,
    departmentName:
      w.department_name ||
      (w.department && typeof w.department === "object" && "name" in w.department ? w.department.name : undefined) ||
      "Department",
    departmentCode:
      w.department && typeof w.department === "object" && "code" in w.department ? w.department.code : undefined,
    schoolName:
      w.school_name ||
      (w.school && typeof w.school === "object" && "name" in w.school ? w.school.name : undefined) ||
      "School",
    user: userObj,
    profile: profileObj,
    guardians: Array.isArray(w.guardians) ? w.guardians.filter(Boolean).map(mapGuardian) : [],
    admittedAt: w.date_enrolled || w.admitted_at,
    createdAt: w.date_enrolled || w.created_at,
  };
}

function mapGuardian(w: WireStudentGuardian): StudentGuardian {
  if (!w || typeof w !== "object") {
    return {
      id: 0,
      name: "",
      relationship: "",
      phone: "",
      isPrimary: false,
    };
  }
  return {
    id: w.id ?? 0,
    name: w.name || "",
    relationship: w.relationship || "",
    phone: w.phone || "",
    email: w.email,
    address: w.address,
    isPrimary: Boolean(w.is_primary),
    createdAt: w.created_at,
  };
}

function mapProfile(w: WireStudentProfile): StudentProfile {
  if (!w || typeof w !== "object") {
    return {};
  }
  const rawPhoto =
    w.photo ||
    (w as Record<string, unknown>).photo_url ||
    (w as Record<string, unknown>).passport ||
    (w as Record<string, unknown>).image ||
    (w as Record<string, unknown>).avatar;

  return {
    stateOfOrigin: w.state_of_origin,
    lga: w.lga,
    bloodGroup: w.blood_group,
    genotype: w.genotype,
    emergencyContactName: w.emergency_contact_name,
    emergencyContactPhone: w.emergency_contact_phone,
    residentialAddress: w.residential_address || w.address,
    photoUrl: typeof rawPhoto === "string" && rawPhoto.trim() ? rawPhoto.trim() : undefined,
    updatedAt: w.updated_at,
  };
}

function mapCourse(w: WireCourse): Course {
  if (!w || typeof w !== "object") {
    return {
      id: 0,
      code: "",
      title: "",
      creditUnits: 0,
    };
  }
  return {
    id: w.id ?? 0,
    code: w.code || "",
    title: w.title || "",
    creditUnits: w.credit_units ?? 0,
    departmentName: w.department_name,
    semester:
      w.semester && typeof w.semester === "object" && typeof w.semester.id === "number"
        ? {
            id: w.semester.id,
            name: w.semester.name || "",
            code: w.semester.code || "",
            order: w.semester.order || 1,
          }
        : null,
    level:
      w.level && typeof w.level === "object" && typeof w.level.id === "number"
        ? {
            id: w.level.id,
            name: w.level.name || "",
            code: w.level.code || "",
            order: w.level.order || 1,
          }
        : null,
    description: w.description,
    isCore: w.is_core,
  };
}

/**
 * Automatically find the applicant's uploaded passport photograph
 * from admission applications/requirements if not yet linked to StudentProfile.
 */
async function fetchPassportPhotoFallback(): Promise<string | undefined> {
  try {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("maris_student_avatar");
      if (cached) return cached;
    }

    const apps = await api.get<Array<{ id: number; status?: string }>>("/applications/");
    if (!Array.isArray(apps) || apps.length === 0) return undefined;

    const primaryApp =
      apps.find((a) => a.status === "admitted" || a.status === "accepted") ||
      apps[0];
    if (!primaryApp?.id) return undefined;

    const raw = await api.get<unknown>(`/applications/${primaryApp.id}/requirements/`);
    if (!Array.isArray(raw)) return undefined;

    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const req = (rec.requirement && typeof rec.requirement === "object"
        ? rec.requirement
        : rec) as Record<string, unknown>;
      const doc = (rec.document && typeof rec.document === "object"
        ? rec.document
        : rec.uploaded_document && typeof rec.uploaded_document === "object"
        ? rec.uploaded_document
        : rec.application_document && typeof rec.application_document === "object"
        ? rec.application_document
        : rec) as Record<string, unknown>;

      const reqCode = String(req.code || doc.requirement_code || "").toLowerCase();
      const reqName = String(req.name || doc.requirement_name || "").toLowerCase();
      const fileName = String(doc.original_filename || doc.fileName || doc.file_name || "").toLowerCase();

      const isPassport =
        reqCode.includes("passport") ||
        reqCode.includes("photo") ||
        reqName.includes("passport") ||
        reqName.includes("photo") ||
        fileName.includes("passport") ||
        fileName.includes("photo");

      if (isPassport) {
        const fileUrl =
          (doc.file_url as string) ||
          (doc.file as string) ||
          (doc.objectUrl as string) ||
          (doc.url as string);
        if (fileUrl && typeof fileUrl === "string" && fileUrl.trim()) {
          const finalUrl = fileUrl.trim();
          if (typeof window !== "undefined") {
            sessionStorage.setItem("maris_student_avatar", finalUrl);
          }
          return finalUrl;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to fetch passport photo fallback:", err);
  }
  return undefined;
}

/* ---- API Methods ---------------------------------------------- */

/** GET /students/me/ - Fetch current student record */
export async function getMyStudent(): Promise<Student> {
  const res = await api.get<WireStudent | { data: WireStudent } | { results: WireStudent[] }>("/students/me/");
  const wire =
    res && typeof res === "object" && "data" in res && res.data
      ? (res.data as WireStudent)
      : res && typeof res === "object" && "results" in res && Array.isArray(res.results)
      ? res.results[0]
      : (res as WireStudent);

  const student = mapStudent(wire);

  if (!student.profile?.photoUrl) {
    const fallbackPhoto = await fetchPassportPhotoFallback();
    if (fallbackPhoto) {
      if (!student.profile) {
        student.profile = {};
      }
      student.profile.photoUrl = fallbackPhoto;
    }
  }

  return student;
}

/** GET /students/me/profile/ - Fetch student biodata profile */
export async function getMyProfile(): Promise<StudentProfile> {
  const wire = await api.get<WireStudentProfile>("/students/me/profile/");
  const prof = mapProfile(wire);
  if (!prof.photoUrl) {
    const fallbackPhoto = await fetchPassportPhotoFallback();
    if (fallbackPhoto) {
      prof.photoUrl = fallbackPhoto;
    }
  }
  return prof;
}

/** PATCH /students/me/profile/ - Update student biodata profile */
export async function updateMyProfile(
  payload: Partial<StudentProfile>,
): Promise<StudentProfile> {
  const wirePayload: Partial<WireStudentProfile> = {
    state_of_origin: payload.stateOfOrigin,
    lga: payload.lga,
    blood_group: payload.bloodGroup,
    genotype: payload.genotype,
    emergency_contact_name: payload.emergencyContactName,
    emergency_contact_phone: payload.emergencyContactPhone,
    residential_address: payload.residentialAddress,
    address: payload.residentialAddress,
  };
  const wire = await api.patch<WireStudentProfile>(
    "/students/me/profile/",
    wirePayload,
  );
  const updated = mapProfile(wire);
  if (!updated.photoUrl && payload.photoUrl) {
    updated.photoUrl = payload.photoUrl;
  }
  return updated;
}

/** GET /students/me/guardians/ - List student guardians */
export async function getMyGuardians(): Promise<StudentGuardian[]> {
  const res = await api.get<WireStudentGuardian[] | { results: WireStudentGuardian[] }>("/students/me/guardians/");
  const items = Array.isArray(res) ? res : (res && typeof res === "object" && "results" in res && Array.isArray(res.results)) ? res.results : [];
  return items.filter(Boolean).map(mapGuardian);
}

/** POST /students/me/guardians/ - Add a guardian */
export async function addGuardian(
  payload: Omit<StudentGuardian, "id" | "createdAt">,
): Promise<StudentGuardian> {
  const wirePayload: Partial<WireStudentGuardian> = {
    name: payload.name,
    relationship: payload.relationship,
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
    is_primary: payload.isPrimary,
  };
  const wire = await api.post<WireStudentGuardian>(
    "/students/me/guardians/",
    wirePayload,
  );
  return mapGuardian(wire);
}

/** DELETE /students/me/guardians/{id}/ - Remove a guardian */
export async function deleteGuardian(id: number): Promise<void> {
  await api.del(`/students/me/guardians/${id}/`);
}

/** GET /students/me/status-history/ - Timeline of status changes */
export async function getMyStatusHistory(): Promise<StudentStatusHistory[]> {
  const res = await api.get<WireStatusHistory[] | { results: WireStatusHistory[] }>("/students/me/status-history/");
  const items = Array.isArray(res) ? res : (res && typeof res === "object" && "results" in res && Array.isArray(res.results)) ? res.results : [];
  return items.filter(Boolean).map((h) => ({
    id: h?.id ?? 0,
    fromStatus: h?.from_status || "",
    toStatus: h?.to_status || "",
    reason: h?.reason,
    changedAt: h?.changed_at || "",
    changedByName: h?.changed_by_name,
  }));
}

/** GET /academics/courses/ - View academic courses */
export async function getAcademicCourses(params?: {
  level?: number;
  semester?: number;
  department?: number;
}): Promise<Course[]> {
  const res = await api.get<WireCourse[] | { results: WireCourse[] }>(
    "/academics/courses/",
    { query: params },
  );
  const items = Array.isArray(res) ? res : (res && typeof res === "object" && "results" in res && Array.isArray(res.results)) ? res.results : [];
  return items.filter(Boolean).map(mapCourse);
}

/** GET /academics/levels/ - List levels */
export async function getAcademicLevels(): Promise<AcademicLevel[]> {
  return api.get<AcademicLevel[]>("/academics/levels/");
}

/** GET /academics/semesters/ - List semesters */
export async function getAcademicSemesters(): Promise<AcademicSemester[]> {
  return api.get<AcademicSemester[]>("/academics/semesters/");
}


/* ---- Course Registration Mappers & Methods ----------------------- */

interface WireRegistrationItem {
  id: number;
  course: WireCourse;
  credit_units: number;
  is_compulsory: boolean;
  status: 'registered' | 'dropped' | 'carryover';
}

interface WireRegistration {
  id: number;
  status: CourseRegistrationStatus;
  total_credits: number;
  session_name?: string;
  semester_name?: string;
  level_name?: string;
  submitted_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  items?: WireRegistrationItem[];
  created_at: string;
  updated_at: string;
}

function mapRegistrationItem(w: WireRegistrationItem): CourseRegistrationItem {
  return {
    id: w.id,
    course: mapCourse(w.course),
    creditUnits: w.credit_units,
    isCompulsory: w.is_compulsory,
    status: w.status,
  };
}

function mapRegistration(w: WireRegistration): CourseRegistration {
  return {
    id: w.id,
    status: w.status,
    totalCredits: w.total_credits || 0,
    sessionName: w.session_name,
    semesterName: w.semester_name,
    levelName: w.level_name,
    submittedAt: w.submitted_at,
    approvedAt: w.approved_at,
    rejectionReason: w.rejection_reason,
    items: Array.isArray(w.items) ? w.items.map(mapRegistrationItem) : [],
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

/** GET /course-registrations/available/ - Curriculum courses for active semester */
export async function getAvailableCourses(): Promise<AvailableCoursesData> {
  const res = await api.get<{
    session: { id: number; name: string } | null;
    semester: { id: number; name: string; code: string } | null;
    level: { id: number; name: string } | null;
    is_registration_open: boolean;
    min_credits: number;
    max_credits: number;
    compulsory_courses: Array<{
      id: number;
      programme: number;
      programme_name: string;
      course: number;
      course_code: string;
      course_title: string;
      credit_units: number;
      level: number;
      level_name: string;
      semester: string;
      semester_display: string;
      is_compulsory: boolean;
      prerequisite_code?: string | null;
    }>;
    elective_courses: Array<{
      id: number;
      programme: number;
      programme_name: string;
      course: number;
      course_code: string;
      course_title: string;
      credit_units: number;
      level: number;
      level_name: string;
      semester: string;
      semester_display: string;
      is_compulsory: boolean;
      prerequisite_code?: string | null;
    }>;
  }>("/course-registrations/available/");

  return {
    session: res.session,
    semester: res.semester,
    level: res.level,
    isRegistrationOpen: res.is_registration_open,
    minCredits: res.min_credits,
    maxCredits: res.max_credits,
    compulsoryCourses: (res.compulsory_courses || []).map((c) => ({
      id: c.id,
      programme: c.programme,
      programmeName: c.programme_name,
      course: c.course,
      courseCode: c.course_code,
      courseTitle: c.course_title,
      creditUnits: c.credit_units,
      level: c.level,
      levelName: c.level_name,
      semester: c.semester,
      semesterDisplay: c.semester_display,
      isCompulsory: c.is_compulsory,
      prerequisiteCode: c.prerequisite_code,
    })),
    electiveCourses: (res.elective_courses || []).map((c) => ({
      id: c.id,
      programme: c.programme,
      programmeName: c.programme_name,
      course: c.course,
      courseCode: c.course_code,
      courseTitle: c.course_title,
      creditUnits: c.credit_units,
      level: c.level,
      levelName: c.level_name,
      semester: c.semester,
      semesterDisplay: c.semester_display,
      isCompulsory: c.is_compulsory,
      prerequisiteCode: c.prerequisite_code,
    })),
  };
}

/** GET /course-registrations/current/ - Active semester registration */
export async function getCurrentRegistration(): Promise<CurrentRegistrationResponse> {
  const res = await api.get<{
    registered: boolean;
    registration: WireRegistration | null;
    session_name?: string;
    semester_name?: string;
    is_registration_open: boolean;
  }>("/course-registrations/current/");

  return {
    registered: res.registered,
    registration: res.registration ? mapRegistration(res.registration) : null,
    sessionName: res.session_name,
    semesterName: res.semester_name,
    isRegistrationOpen: res.is_registration_open,
  };
}

/** POST /course-registrations/save-draft/ - Save course draft */
export async function saveRegistrationDraft(courseIds: number[]): Promise<CourseRegistration> {
  const res = await api.post<WireRegistration>("/course-registrations/save-draft/", {
    course_ids: courseIds,
  });
  return mapRegistration(res);
}

/** POST /course-registrations/submit/ - Validate & submit course registration */
export async function submitRegistration(courseIds: number[]): Promise<CourseRegistration> {
  const res = await api.post<WireRegistration>("/course-registrations/submit/", {
    course_ids: courseIds,
  });
  return mapRegistration(res);
}

/** GET /course-registrations/history/ - All past registrations */
export async function getRegistrationHistory(): Promise<CourseRegistration[]> {
  const res = await api.get<WireRegistration[] | { results: WireRegistration[] }>("/course-registrations/history/");
  const items = Array.isArray(res) ? res : res?.results || [];
  return items.map(mapRegistration);
}

/** GET /course-registrations/{id}/slip/ - Printable slip data */
export async function getRegistrationSlip(id: number): Promise<RegistrationSlipData> {
  const res = await api.get<{
    registration_id: number;
    status: CourseRegistrationStatus;
    status_display: string;
    submitted_at?: string;
    approved_at?: string;
    rejection_reason?: string;
    session: string;
    semester: string;
    level: string;
    student: {
      matric_number: string;
      student_id: string;
      full_name: string;
      programme: string;
      department: string;
      school: string;
      photo?: string | null;
    };
    total_credits: number;
    courses: Array<{
      code: string;
      title: string;
      credit_units: number;
      is_compulsory: boolean;
      status: string;
    }>;
  }>(`/course-registrations/${id}/slip/`);

  return {
    registrationId: res.registration_id,
    status: res.status,
    statusDisplay: res.status_display,
    submittedAt: res.submitted_at,
    approvedAt: res.approved_at,
    rejectionReason: res.rejection_reason,
    session: res.session,
    semester: res.semester,
    level: res.level,
    student: {
      matricNumber: res.student.matric_number,
      studentId: res.student.student_id,
      fullName: res.student.full_name,
      programme: res.student.programme,
      department: res.student.department,
      school: res.student.school,
      photo: res.student.photo,
    },
    totalCredits: res.total_credits,
    courses: (res.courses || []).map((c) => ({
      code: c.code,
      title: c.title,
      creditUnits: c.credit_units,
      isCompulsory: c.is_compulsory,
      status: c.status,
    })),
  };
}


/* ---- Results Management API Methods ----------------------------- */

/** GET /results/my-results/ - All published semester records and CGPA */
export async function getMyResults(): Promise<MyResultsResponse> {
  const res = await api.get<{
    student: {
      matric_number: string;
      student_id: string;
      programme: string;
      department: string;
      school: string;
      current_level?: string | null;
    };
    overall_cgpa: number;
    overall_standing: string;
    semesters: Array<{
      id: number;
      session: number;
      session_name: string;
      semester: number;
      semester_name: string;
      level: number;
      level_name: string;
      registered_credits: number;
      earned_credits: number;
      total_quality_points: number;
      gpa: number;
      cumulative_registered_credits: number;
      cumulative_earned_credits: number;
      cumulative_quality_points: number;
      cgpa: number;
      academic_standing: AcademicStanding;
      academic_standing_display: string;
      is_published: boolean;
      published_at?: string;
    }>;
  }>("/results/my-results/");

  return {
    student: {
      matricNumber: res.student.matric_number,
      studentId: res.student.student_id,
      programme: res.student.programme,
      department: res.student.department,
      school: res.student.school,
      currentLevel: res.student.current_level,
    },
    overallCgpa: res.overall_cgpa,
    overallStanding: res.overall_standing,
    semesters: (res.semesters || []).map((s) => ({
      id: s.id,
      session: s.session,
      sessionName: s.session_name,
      semester: s.semester,
      semesterName: s.semester_name,
      level: s.level,
      levelName: s.level_name,
      registeredCredits: s.registered_credits,
      earnedCredits: s.earned_credits,
      totalQualityPoints: Number(s.total_quality_points),
      gpa: Number(s.gpa),
      cumulativeRegisteredCredits: s.cumulative_registered_credits,
      cumulativeEarnedCredits: s.cumulative_earned_credits,
      cumulativeQualityPoints: Number(s.cumulative_quality_points),
      cgpa: Number(s.cgpa),
      academicStanding: s.academic_standing,
      academicStandingDisplay: s.academic_standing_display,
      isPublished: s.is_published,
      publishedAt: s.published_at,
    })),
  };
}

/** GET /results/current/ - Active semester results breakdown */
export async function getCurrentResult(): Promise<CurrentResultResponse> {
  const res = await api.get<{
    published: boolean;
    detail?: string;
    record: {
      id: number;
      session: number;
      session_name: string;
      semester: number;
      semester_name: string;
      level: number;
      level_name: string;
      registered_credits: number;
      earned_credits: number;
      total_quality_points: number;
      gpa: number;
      cumulative_registered_credits: number;
      cumulative_earned_credits: number;
      cumulative_quality_points: number;
      cgpa: number;
      academic_standing: AcademicStanding;
      academic_standing_display: string;
      is_published: boolean;
      published_at?: string;
    } | null;
    courses: Array<{
      id: number;
      course: number;
      course_code: string;
      course_title: string;
      credit_units: number;
      ca_score: number;
      exam_score: number;
      total_score: number;
      grade: string;
      grade_point: number;
      quality_points: number;
      is_passed: boolean;
      status: string;
      session_name?: string;
      semester_name?: string;
    }>;
  }>("/results/current/");

  return {
    published: res.published,
    detail: res.detail,
    record: res.record
      ? {
          id: res.record.id,
          session: res.record.session,
          sessionName: res.record.session_name,
          semester: res.record.semester,
          semesterName: res.record.semester_name,
          level: res.record.level,
          levelName: res.record.level_name,
          registeredCredits: res.record.registered_credits,
          earnedCredits: res.record.earned_credits,
          totalQualityPoints: Number(res.record.total_quality_points),
          gpa: Number(res.record.gpa),
          cumulativeRegisteredCredits: res.record.cumulative_registered_credits,
          cumulativeEarnedCredits: res.record.cumulative_earned_credits,
          cumulativeQualityPoints: Number(res.record.cumulative_quality_points),
          cgpa: Number(res.record.cgpa),
          academicStanding: res.record.academic_standing,
          academicStandingDisplay: res.record.academic_standing_display,
          isPublished: res.record.is_published,
          publishedAt: res.record.published_at,
        }
      : null,
    courses: (res.courses || []).map((c) => ({
      id: c.id,
      courseId: c.course,
      courseCode: c.course_code,
      courseTitle: c.course_title,
      creditUnits: c.credit_units,
      caScore: Number(c.ca_score),
      examScore: Number(c.exam_score),
      totalScore: Number(c.total_score),
      grade: c.grade,
      gradePoint: Number(c.grade_point),
      qualityPoints: Number(c.quality_points),
      isPassed: c.is_passed,
      status: c.status,
      sessionName: c.session_name,
      semesterName: c.semester_name,
    })),
  };
}

/** GET /results/{session_id}/{semester_id}/slip/ - Official Result Slip */
export async function getResultSlip(
  sessionId: number,
  semesterId: number,
): Promise<SemesterResultSlipData> {
  const res = await api.get<{
    session: string;
    semester: string;
    level: string;
    is_published: boolean;
    published_at?: string;
    student: {
      matric_number: string;
      student_id: string;
      full_name: string;
      programme: string;
      programme_type: string;
      department: string;
      school: string;
      photo?: string | null;
    };
    semester_summary: {
      registered_credits: number;
      earned_credits: number;
      total_quality_points: number;
      gpa: number;
    };
    cumulative_summary: {
      cumulative_registered_credits: number;
      cumulative_earned_credits: number;
      cumulative_quality_points: number;
      cgpa: number;
      academic_standing: string;
      academic_standing_display: string;
    };
    courses: Array<{
      code: string;
      title: string;
      credit_units: number;
      ca_score: number;
      exam_score: number;
      total_score: number;
      grade: string;
      grade_point: number;
      quality_points: number;
      is_passed: boolean;
    }>;
  }>(`/results/${sessionId}/${semesterId}/slip/`);

  return {
    session: res.session,
    semester: res.semester,
    level: res.level,
    isPublished: res.is_published,
    publishedAt: res.published_at,
    student: {
      matricNumber: res.student.matric_number,
      studentId: res.student.student_id,
      fullName: res.student.full_name,
      programme: res.student.programme,
      programmeType: res.student.programme_type,
      department: res.student.department,
      school: res.student.school,
      photo: res.student.photo,
    },
    semesterSummary: {
      registeredCredits: res.semester_summary.registered_credits,
      earnedCredits: res.semester_summary.earned_credits,
      totalQualityPoints: res.semester_summary.total_quality_points,
      gpa: res.semester_summary.gpa,
    },
    cumulativeSummary: {
      cumulativeRegisteredCredits: res.cumulative_summary.cumulative_registered_credits,
      cumulativeEarnedCredits: res.cumulative_summary.cumulative_earned_credits,
      cumulativeQualityPoints: res.cumulative_summary.cumulative_quality_points,
      cgpa: res.cumulative_summary.cgpa,
      academicStanding: res.cumulative_summary.academic_standing,
      academicStandingDisplay: res.cumulative_summary.academic_standing_display,
    },
    courses: (res.courses || []).map((c) => ({
      code: c.code,
      title: c.title,
      creditUnits: c.credit_units,
      caScore: c.ca_score,
      examScore: c.exam_score,
      totalScore: c.total_score,
      grade: c.grade,
      gradePoint: c.grade_point,
      qualityPoints: c.quality_points,
      isPassed: c.is_passed,
    })),
  };
}

/** GET /results/grading-scales/ - Institutional grading reference */
export async function getGradingScales(): Promise<GradingScaleItem[]> {
  const res = await api.get<
    Array<{
      id: number;
      grade: string;
      min_score: number;
      max_score: number;
      grade_point: number;
      description: string;
      is_pass: boolean;
      order: number;
    }>
  >("/results/grading-scales/");

  return (res || []).map((g) => ({
    id: g.id,
    grade: g.grade,
    minScore: Number(g.min_score),
    maxScore: Number(g.max_score),
    gradePoint: Number(g.grade_point),
    description: g.description,
    isPass: g.is_pass,
    order: g.order,
  }));
}


// ========================================================
// Item 24 & 25: Student Fee Invoices, Payments & Receipts
// ========================================================

interface WireStudentFeeInvoice {
  id: number;
  invoice_number: string;
  student: number;
  student_matric: string;
  student_id: string;
  session: number;
  session_name: string;
  semester?: number | null;
  semester_name?: string | null;
  level: number;
  level_name: string;
  total_amount: string | number;
  amount_paid: string | number;
  balance_due: string | number;
  status: string;
  status_display: string;
  is_cleared: boolean;
  due_date?: string | null;
  paid_at?: string | null;
  created_at: string;
  payments: Array<{
    id: number;
    reference: string;
    receipt_number: string;
    amount: string | number;
    gateway: string;
    gateway_display: string;
    status: string;
    status_display: string;
    authorization_url?: string;
    access_code?: string;
    paid_at?: string;
    created_at: string;
  }>;
  fee_breakdown: Array<{
    id?: number;
    category: string;
    code?: string;
    fee_type?: string;
    description?: string;
    amount: number;
    amount_paid?: number;
    balance_due?: number;
    is_cleared?: boolean;
  }>;
  tutor_fee?: {
    name: string;
    description: string;
    amount: number;
    amount_paid: number;
    balance_due: number;
    is_cleared: boolean;
  };
  hostel_fee?: {
    name: string;
    description: string;
    amount: number;
    amount_paid: number;
    balance_due: number;
    is_cleared: boolean;
    is_applicable?: boolean;
  };
  other_fees?: Array<{
    id?: number;
    category: string;
    code?: string;
    fee_type?: string;
    description?: string;
    amount: number;
    amount_paid?: number;
    balance_due?: number;
    is_cleared?: boolean;
  }>;
  fee_summary?: {
    tutor_subtotal: number;
    hostel_subtotal: number;
    other_subtotal: number;
    grand_total: number;
    total_paid: number;
    total_balance_due: number;
    is_cleared: boolean;
  };
}

function adaptFeeInvoice(w: WireStudentFeeInvoice): StudentFeeInvoice {
  return {
    id: w.id,
    invoiceNumber: w.invoice_number,
    student: w.student,
    studentMatric: w.student_matric,
    studentId: w.student_id,
    session: w.session,
    sessionName: w.session_name,
    semester: w.semester,
    semesterName: w.semester_name,
    level: w.level,
    levelName: w.level_name,
    totalAmount: Number(w.total_amount),
    amountPaid: Number(w.amount_paid),
    balanceDue: Number(w.balance_due),
    status: w.status as any,
    statusDisplay: w.status_display,
    isCleared: w.is_cleared,
    dueDate: w.due_date,
    paidAt: w.paid_at,
    createdAt: w.created_at,
    payments: (w.payments || []).map((p) => ({
      id: p.id,
      reference: p.reference,
      receiptNumber: p.receipt_number,
      amount: Number(p.amount),
      gateway: p.gateway,
      gatewayDisplay: p.gateway_display,
      status: p.status,
      statusDisplay: p.status_display,
      authorizationUrl: p.authorization_url,
      accessCode: p.access_code,
      paidAt: p.paid_at,
      createdAt: p.created_at,
    })),
    feeBreakdown: (w.fee_breakdown || []).map((item) => ({
      id: item.id,
      category: item.category,
      code: item.code,
      feeType: item.fee_type,
      description: item.description,
      amount: Number(item.amount),
      amountPaid: item.amount_paid !== undefined ? Number(item.amount_paid) : undefined,
      balanceDue: item.balance_due !== undefined ? Number(item.balance_due) : undefined,
      isCleared: item.is_cleared,
    })),
    tutorFee: w.tutor_fee
      ? {
          name: w.tutor_fee.name,
          description: w.tutor_fee.description,
          amount: Number(w.tutor_fee.amount),
          amountPaid: Number(w.tutor_fee.amount_paid),
          balanceDue: Number(w.tutor_fee.balance_due),
          isCleared: w.tutor_fee.is_cleared,
        }
      : undefined,
    hostelFee: w.hostel_fee
      ? {
          name: w.hostel_fee.name,
          description: w.hostel_fee.description,
          amount: Number(w.hostel_fee.amount),
          amountPaid: Number(w.hostel_fee.amount_paid),
          balanceDue: Number(w.hostel_fee.balance_due),
          isCleared: w.hostel_fee.is_cleared,
          isApplicable: w.hostel_fee.is_applicable,
        }
      : undefined,
    otherFees: (w.other_fees || []).map((item) => ({
      id: item.id,
      category: item.category,
      code: item.code,
      feeType: item.fee_type || "other",
      description: item.description,
      amount: Number(item.amount),
      amountPaid: item.amount_paid !== undefined ? Number(item.amount_paid) : undefined,
      balanceDue: item.balance_due !== undefined ? Number(item.balance_due) : undefined,
      isCleared: item.is_cleared,
    })),
    feeSummary: w.fee_summary
      ? {
          tutorSubtotal: Number(w.fee_summary.tutor_subtotal),
          hostelSubtotal: Number(w.fee_summary.hostel_subtotal),
          otherSubtotal: Number(w.fee_summary.other_subtotal),
          grandTotal: Number(w.fee_summary.grand_total),
          totalPaid: Number(w.fee_summary.total_paid),
          totalBalanceDue: Number(w.fee_summary.total_balance_due),
          isCleared: w.fee_summary.is_cleared,
        }
      : undefined,
  };
}

/** GET /fees/my-invoices/ - List of all invoices for student */
export async function getMyFeeInvoices(): Promise<StudentFeeInvoice[]> {
  const res = await api.get<WireStudentFeeInvoice[]>("/fees/my-invoices/");
  return (res || []).map(adaptFeeInvoice);
}

/** GET /fees/current/ - Active session/semester fee invoice */
export async function getCurrentFeeInvoice(): Promise<StudentFeeInvoice | null> {
  try {
    const res = await api.get<WireStudentFeeInvoice>("/fees/current/");
    if (!res || !res.id) return null;
    return adaptFeeInvoice(res);
  } catch {
    return null;
  }
}

/** POST /fees/pay/ - Initialize payment with Paystack */
export async function initializeFeePayment(payload: {
  amount: number;
  invoice_id?: number;
  callback_url?: string;
  fee_type?: string;
  description?: string;
}): Promise<FeePaymentInitResponse> {
  const res = await api.post<{
    reference: string;
    authorization_url: string;
    access_code: string;
    amount: string | number;
  }>("/fees/pay/", payload);

  return {
    reference: res.reference,
    authorizationUrl: res.authorization_url,
    accessCode: res.access_code,
    amount: Number(res.amount),
  };
}

/** GET /fees/verify/{reference}/ - Verify transaction with payment gateway */
export async function verifyFeePayment(
  reference: string,
): Promise<FeePaymentVerifyResponse> {
  const res = await api.get<{
    status: string;
    reference: string;
    amount: string | number;
    paid_at?: string | null;
    receipt_number: string;
    invoice_cleared: boolean;
    balance_due: string | number;
  }>(`/fees/verify/${reference}/`);

  return {
    status: res.status,
    reference: res.reference,
    amount: Number(res.amount),
    paidAt: res.paid_at,
    receiptNumber: res.receipt_number,
    invoiceCleared: res.invoice_cleared,
    balanceDue: Number(res.balance_due),
  };
}

/** GET /fees/receipts/{receiptNumber}/ - Retrieve official SMS-FR01 fee receipt */
export async function getOfficialFeeReceipt(
  receiptNumber: string,
): Promise<OfficialFeeReceipt> {
  const res = await api.get<{
    receipt_number: string;
    reference: string;
    date_paid: string;
    amount_paid: number;
    gateway: string;
    channel: string;
    status: string;
    total_invoice_amount: number;
    total_paid_so_far: number;
    balance_remaining: number;
    is_cleared: boolean;
    session: string;
    semester: string;
    level: string;
    student: {
      matric_number: string;
      student_id: string;
      full_name: string;
      email: string;
      programme: string;
      department: string;
      school: string;
      photo?: string | null;
    };
    breakdown: Array<{
      category: string;
      amount: number;
    }>;
  }>(`/fees/receipts/${receiptNumber}/`);

  return {
    receiptNumber: res.receipt_number,
    reference: res.reference,
    datePaid: res.date_paid,
    amountPaid: res.amount_paid,
    gateway: res.gateway,
    channel: res.channel,
    status: res.status,
    totalInvoiceAmount: res.total_invoice_amount,
    totalPaidSoFar: res.total_paid_so_far,
    balanceRemaining: res.balance_remaining,
    isCleared: res.is_cleared,
    session: res.session,
    semester: res.semester,
    level: res.level,
    student: {
      matricNumber: res.student.matric_number,
      studentId: res.student.student_id,
      fullName: res.student.full_name,
      email: res.student.email,
      programme: res.student.programme,
      department: res.student.department,
      school: res.student.school,
      photo: res.student.photo,
    },
    breakdown: res.breakdown || [],
  };
}

// ========================================================
// Item 26: Student Document Centre
// ========================================================

/** GET /students/me/documents/ - Unified student document repository */
export async function getMyDocuments(): Promise<StudentDocumentsResponse> {
  const res = await api.get<any>("/students/me/documents/");

  return {
    admissionLetter: {
      available: res.admission_letter?.available ?? false,
      title: res.admission_letter?.title || "Provisional Admission Letter",
      referenceNumber: res.admission_letter?.reference_number,
      admissionDate: res.admission_letter?.admission_date,
      downloadUrl: res.admission_letter?.download_url,
    },
    idCard: {
      available: res.id_card?.available ?? true,
      title: res.id_card?.title || "Digital Student ID Card",
      studentId: res.id_card?.student_id || "",
      matricNumber: res.id_card?.matric_number || "",
      fullName: res.id_card?.full_name || "",
      programme: res.id_card?.programme || "",
      department: res.id_card?.department || "",
      school: res.id_card?.school || "",
      photo: res.id_card?.photo,
    },
    registrationForms: (res.registration_forms || []).map((rf: any) => ({
      id: rf.id,
      title: rf.title,
      type: rf.type,
      formCode: rf.form_code || "SMS-CR01",
      session: rf.session,
      semester: rf.semester,
      level: rf.level,
      totalCredits: rf.total_credits,
      status: rf.status,
      approvedAt: rf.approved_at,
      slipUrl: rf.slip_url,
      frontendUrl: rf.frontend_url,
    })),
    feeReceipts: (res.fee_receipts || []).map((fr: any) => ({
      title: fr.title,
      type: fr.type,
      formCode: fr.form_code || "SMS-FR01",
      receiptNumber: fr.receipt_number,
      reference: fr.reference,
      amount: Number(fr.amount),
      paidAt: fr.paid_at,
      session: fr.session,
      balanceDue: Number(fr.balance_due),
      isCleared: fr.is_cleared,
      receiptUrl: fr.receipt_url,
      frontendUrl: fr.frontend_url,
    })),
    resultSlips: (res.result_slips || []).map((rs: any) => ({
      title: rs.title,
      type: rs.type,
      formCode: rs.form_code || "SMS-RS01",
      session: rs.session,
      semester: rs.semester,
      level: rs.level,
      gpa: Number(rs.gpa),
      cgpa: Number(rs.cgpa),
      standing: rs.standing,
      publishedAt: rs.published_at,
      slipUrl: rs.slip_url,
      frontendUrl: rs.frontend_url,
    })),
    counts: res.counts || {
      registrationForms: 0,
      feeReceipts: 0,
      resultSlips: 0,
      totalDocuments: 0,
    },
  };
}

// ========================================================
// Item 29 & 30: Admin Dashboard Stats & 360 Student Overview
// ========================================================

/** GET /admin/dashboard/stats/ - Top level institutional metrics */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const res = await api.get<any>("/admin/dashboard/stats/");
  return {
    studentManagement: {
      totalStudents: res.student_management?.total_students || 0,
      activeStudents: res.student_management?.active_students || 0,
      newEnrollments: res.student_management?.new_enrollments || 0,
      graduatingStudents: res.student_management?.graduating_students || 0,
      suspendedStudents: res.student_management?.suspended_students || 0,
    },
    academics: {
      currentSession: res.academics?.current_session || "",
      currentSemester: res.academics?.current_semester || "",
      courseRegistrationsPending: res.academics?.course_registrations_pending || 0,
      courseRegistrationsApproved: res.academics?.course_registrations_approved || 0,
      courseRegistrationsRejected: res.academics?.course_registrations_rejected || 0,
    },
    finance: {
      expectedFees: Number(res.finance?.expected_fees || 0),
      collectedFees: Number(res.finance?.collected_fees || 0),
      outstandingFees: Number(res.finance?.outstanding_fees || 0),
      collectionRatePercent: Number(res.finance?.collection_rate_percent || 0),
    },
  };
}

/** GET /admin/students/{id}/overview/ - 360-degree student record */
export async function getAdminStudentOverview(
  studentId: number,
): Promise<AdminStudent360Overview> {
  const res = await api.get<any>(`/admin/students/${studentId}/overview/`);
  return {
    studentId: res.student_id,
    personalInfo: {
      firstName: res.personal_info?.first_name || "",
      middleName: res.personal_info?.middle_name || "",
      lastName: res.personal_info?.last_name || "",
      fullName: res.personal_info?.full_name || "",
      email: res.personal_info?.email || "",
      phoneNumber: res.personal_info?.phone_number || "",
      gender: res.personal_info?.gender || "",
      dateOfBirth: res.personal_info?.date_of_birth,
      stateOfOrigin: res.personal_info?.state_of_origin || "",
      lga: res.personal_info?.lga || "",
      address: res.personal_info?.address || "",
      photo: res.personal_info?.photo,
      guardians: res.personal_info?.guardians || [],
    },
    academicInfo: {
      studentId: res.academic_info?.student_id || "",
      matricNumber: res.academic_info?.matric_number || "",
      programme: res.academic_info?.programme || "",
      programmeType: res.academic_info?.programme_type || "",
      department: res.academic_info?.department || "",
      school: res.academic_info?.school || "",
      level: res.academic_info?.level || "",
      session: res.academic_info?.session || "",
      status: res.academic_info?.status || "",
      statusDisplay: res.academic_info?.status_display || "",
    },
    courseRegistrations: (res.course_registrations || []).map((cr: any) => ({
      id: cr.id,
      session: cr.session,
      semester: cr.semester,
      level: cr.level,
      status: cr.status,
      statusDisplay: cr.status_display,
      totalCredits: cr.total_credits,
      submittedAt: cr.submitted_at,
      approvedAt: cr.approved_at,
      courses: cr.courses || [],
    })),
    results: {
      semesterRecords: (res.results?.semester_records || []).map((sr: any) => ({
        session: sr.session,
        semester: sr.semester,
        level: sr.level,
        registeredCredits: sr.registered_credits,
        earnedCredits: sr.earned_credits,
        failedCredits: sr.failed_credits,
        gpa: Number(sr.gpa),
        cgpa: Number(sr.cgpa),
        standing: sr.standing,
        isPublished: sr.is_published,
      })),
      courseResults: (res.results?.course_results || []).map((cor: any) => ({
        courseCode: cor.course_code,
        courseTitle: cor.course_title,
        session: cor.session,
        semester: cor.semester,
        caScore: Number(cor.ca_score),
        examScore: Number(cor.exam_score),
        totalScore: Number(cor.total_score),
        grade: cor.grade,
        gradePoint: Number(cor.grade_point),
        credits: cor.credits,
        qualityPoints: Number(cor.quality_points),
        isPassed: cor.is_passed,
        status: cor.status,
      })),
    },
    fees: (res.fees || []).map((f: any) => ({
      invoiceNumber: f.invoice_number,
      session: f.session,
      semester: f.semester,
      totalAmount: Number(f.total_amount),
      amountPaid: Number(f.amount_paid),
      balanceDue: Number(f.balance_due),
      status: f.status,
      statusDisplay: f.status_display,
      isCleared: f.is_cleared,
    })),
    payments: (res.payments || []).map((p: any) => ({
      reference: p.reference,
      receiptNumber: p.receipt_number,
      amount: Number(p.amount),
      gateway: p.gateway,
      status: p.status,
      paidAt: p.paid_at,
      session: p.session,
    })),
    statusHistory: (res.status_history || []).map((sh: any) => ({
      fromStatus: sh.from_status,
      toStatus: sh.to_status,
      reason: sh.reason,
      changedBy: sh.changed_by,
      createdAt: sh.created_at,
    })),
    auditHistory: (res.audit_history || []).map((ah: any) => ({
      action: ah.action,
      timestamp: ah.timestamp,
      ipAddress: ah.ip_address,
      metadata: ah.metadata,
    })),
  };
}

/**
 * GET /api/students/me/transcript/
 * Pull official multi-semester academic transcript (Form SMS-TR01).
 */
export async function getOfficialTranscript(): Promise<OfficialTranscriptData> {
  return api.get<OfficialTranscriptData>("/students/me/transcript/");
}


/**
 * GET /api/course-registrations/add-drop/
 * Fetch student's course add/drop requests.
 */
export async function getAddDropRequests(): Promise<any[]> {
  const res = await api.get<any>('/course-registrations/add-drop/');
  const list = Array.isArray(res) ? res : (res?.results || []);
  return list.map((item: any) => ({
    id: item.id,
    semester: item.semester,
    course: item.course,
    action: item.action,
    actionDisplay: item.action === 'ADD' ? 'Add Course' : 'Drop Course',
    reason: item.reason,
    status: item.status,
    statusDisplay: item.status,
    reviewerName: item.reviewer_name,
    reviewNotes: item.review_notes,
    reviewedAt: item.reviewed_at,
    createdAt: item.created_at,
    courseDetail: item.course_detail ? {
      id: item.course_detail.id,
      code: item.course_detail.code,
      title: item.course_detail.title,
      creditUnits: item.course_detail.credit_units,
    } : undefined,
  }));
}

/**
 * POST /api/course-registrations/add-drop/
 * Submit a request to add or drop a registered course.
 */
export async function submitAddDropRequest(data: {
  semester: number;
  course: number;
  action: 'ADD' | 'DROP';
  reason: string;
}): Promise<any> {
  return api.post<any>('/course-registrations/add-drop/', data);
}

/**
 * GET /api/students/me/clearance/status/
 * Check real-time departmental clearance status.
 */
export async function getMyClearanceStatus(): Promise<any | null> {
  try {
    const res = await api.get<any>('/students/me/clearance/status/');
    if (!res || !res.id) return null;
    return {
      id: res.id,
      clearanceTypeName: res.clearance_type_name,
      status: res.status,
      overallStatusDisplay: res.overall_status_display,
      financeAutoCleared: Boolean(res.finance_auto_cleared),
      completionPercentage: Number(res.completion_percentage || 0),
      createdAt: res.created_at,
      items: (res.items || []).map((it: any) => ({
        id: it.id,
        department: it.department,
        departmentDisplay: it.department_display,
        status: it.status,
        statusDisplay: it.status_display,
        reviewerName: it.reviewer_name,
        remarks: it.remarks,
        reviewedAt: it.reviewed_at,
      })),
    };
  } catch (err: any) {
    if (err?.status === 404) return null;
    throw err;
  }
}

/**
 * POST /api/students/me/clearance/initiate/
 * Initiate clearance process (e.g. GRADUATION, FINAL, SEMESTER).
 */
export async function initiateClearance(clearanceTypeName = 'GRADUATION'): Promise<any> {
  return api.post<any>('/students/me/clearance/initiate/', {
    clearance_type_name: clearanceTypeName,
  });
}
