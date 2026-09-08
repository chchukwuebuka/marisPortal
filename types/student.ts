/**
 * Student Management System (SMS) domain types and models.
 */

export type StudentStatus =
  | 'provisional'
  | 'active'
  | 'suspended'
  | 'graduated'
  | 'withdrawn'
  | 'deferred';

export interface StudentUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
}

export interface StudentProfile {
  stateOfOrigin?: string;
  lga?: string;
  bloodGroup?: string;
  genotype?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  residentialAddress?: string;
  photoUrl?: string;
  updatedAt?: string;
}

export interface StudentGuardian {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  createdAt?: string;
}

export interface StudentStatusHistory {
  id: number;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  changedAt: string;
  changedByName?: string;
}

export interface AcademicLevel {
  id: number;
  name: string;
  code: string;
  order: number;
}

export interface AcademicSemester {
  id: number;
  name: string;
  code: string;
  order: number;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  creditUnits: number;
  departmentName?: string;
  semester?: AcademicSemester | null;
  level?: AcademicLevel | null;
  description?: string;
  isCore?: boolean;
}

export interface Student {
  id: number;
  studentId: string;
  matricNumber: string;
  status: StudentStatus;
  entryMode: string;
  currentLevel?: AcademicLevel | null;
  admittedSessionName?: string;
  programmeName?: string;
  programmeCode?: string;
  departmentName?: string;
  departmentCode?: string;
  schoolName?: string;
  schoolCode?: string;
  user: StudentUser;
  profile?: StudentProfile;
  guardians?: StudentGuardian[];
  admittedAt?: string;
  createdAt?: string;
}

export type CourseRegistrationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface CourseRegistrationItem {
  id: number;
  course: Course;
  creditUnits: number;
  isCompulsory: boolean;
  status: 'registered' | 'dropped' | 'carryover';
}

export interface CourseRegistration {
  id: number;
  status: CourseRegistrationStatus;
  totalCredits: number;
  sessionName?: string;
  semesterName?: string;
  levelName?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  items: CourseRegistrationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AvailableCourseEntry {
  id: number;
  programme: number;
  programmeName: string;
  course: number;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  level: number;
  levelName: string;
  semester: string;
  semesterDisplay: string;
  isCompulsory: boolean;
  prerequisiteCode?: string | null;
}

export interface AvailableCoursesData {
  session: { id: number; name: string } | null;
  semester: { id: number; name: string; code: string } | null;
  level: { id: number; name: string } | null;
  isRegistrationOpen: boolean;
  minCredits: number;
  maxCredits: number;
  compulsoryCourses: AvailableCourseEntry[];
  electiveCourses: AvailableCourseEntry[];
}

export interface RegistrationSlipCourse {
  code: string;
  title: string;
  creditUnits: number;
  isCompulsory: boolean;
  status: string;
}

export interface RegistrationSlipData {
  registrationId: number;
  status: CourseRegistrationStatus;
  statusDisplay: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  session: string;
  semester: string;
  level: string;
  student: {
    matricNumber: string;
    studentId: string;
    fullName: string;
    programme: string;
    department: string;
    school: string;
    photo?: string | null;
  };
  totalCredits: number;
  courses: RegistrationSlipCourse[];
}

export interface CurrentRegistrationResponse {
  registered: boolean;
  registration: CourseRegistration | null;
  sessionName?: string;
  semesterName?: string;
  isRegistrationOpen: boolean;
}


export type AcademicStanding =
  | 'distinction'
  | 'upper_credit'
  | 'lower_credit'
  | 'pass'
  | 'probation'
  | 'withdrawal';

export interface CourseResult {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gradePoint: number;
  qualityPoints: number;
  isPassed: boolean;
  status: string;
  sessionName?: string;
  semesterName?: string;
}

export interface StudentAcademicRecord {
  id: number;
  session: number;
  sessionName: string;
  semester: number;
  semesterName: string;
  level: number;
  levelName: string;
  registeredCredits: number;
  earnedCredits: number;
  totalQualityPoints: number;
  gpa: number;
  cumulativeRegisteredCredits: number;
  cumulativeEarnedCredits: number;
  cumulativeQualityPoints: number;
  cgpa: number;
  academicStanding: AcademicStanding;
  academicStandingDisplay: string;
  isPublished: boolean;
  publishedAt?: string;
}

export interface MyResultsResponse {
  student: {
    matricNumber: string;
    studentId: string;
    programme: string;
    department: string;
    school: string;
    currentLevel?: string | null;
  };
  overallCgpa: number;
  overallStanding: string;
  semesters: StudentAcademicRecord[];
}

export interface CurrentResultResponse {
  published: boolean;
  detail?: string;
  record: StudentAcademicRecord | null;
  courses: CourseResult[];
}

export interface SemesterResultSlipCourse {
  code: string;
  title: string;
  creditUnits: number;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gradePoint: number;
  qualityPoints: number;
  isPassed: boolean;
}

export interface SemesterResultSlipData {
  session: string;
  semester: string;
  level: string;
  isPublished: boolean;
  publishedAt?: string;
  student: {
    matricNumber: string;
    studentId: string;
    fullName: string;
    programme: string;
    programmeType: string;
    department: string;
    school: string;
    photo?: string | null;
  };
  semesterSummary: {
    registeredCredits: number;
    earnedCredits: number;
    totalQualityPoints: number;
    gpa: number;
  };
  cumulativeSummary: {
    cumulativeRegisteredCredits: number;
    cumulativeEarnedCredits: number;
    cumulativeQualityPoints: number;
    cgpa: number;
    academicStanding: string;
    academicStandingDisplay: string;
  };
  courses: SemesterResultSlipCourse[];
}

export interface GradingScaleItem {
  id: number;
  grade: string;
  minScore: number;
  maxScore: number;
  gradePoint: number;
  description: string;
  isPass: boolean;
  order: number;
}


// ==========================================
// Item 24 & 25: Student Fees & Invoices Types
// ==========================================

export type FeeInvoiceStatus = 'pending' | 'partial' | 'paid' | 'cancelled';

export interface FeeCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface FeeScheduleItem {
  id: number;
  category: number;
  categoryName: string;
  amount: number;
}

export interface FeeSchedule {
  id: number;
  session: number;
  sessionName: string;
  programme: number;
  programmeName: string;
  level: number;
  levelName: string;
  title: string;
  totalAmount: number;
  items: FeeScheduleItem[];
  isActive: boolean;
}

export interface StudentFeePaymentItem {
  id: number;
  reference: string;
  receiptNumber: string;
  amount: number;
  gateway: string;
  gatewayDisplay: string;
  status: string;
  statusDisplay: string;
  authorizationUrl?: string;
  accessCode?: string;
  paidAt?: string;
  createdAt: string;
}

export interface StudentFeeInvoice {
  id: number;
  invoiceNumber: string;
  student: number;
  studentMatric: string;
  studentId: string;
  session: number;
  sessionName: string;
  semester?: number | null;
  semesterName?: string | null;
  level: number;
  levelName: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: FeeInvoiceStatus;
  statusDisplay: string;
  isCleared: boolean;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt: string;
  payments: StudentFeePaymentItem[];
  feeBreakdown: Array<{
    category: string;
    amount: number;
  }>;
}

export interface FeePaymentInitResponse {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
  amount: number;
}

export interface FeePaymentVerifyResponse {
  status: string;
  reference: string;
  amount: number;
  paidAt?: string | null;
  receiptNumber: string;
  invoiceCleared: boolean;
  balanceDue: number;
}

export interface OfficialFeeReceipt {
  receiptNumber: string;
  reference: string;
  datePaid: string;
  amountPaid: number;
  gateway: string;
  channel: string;
  status: string;
  totalInvoiceAmount: number;
  totalPaidSoFar: number;
  balanceRemaining: number;
  isCleared: boolean;
  session: string;
  semester: string;
  level: string;
  student: {
    matricNumber: string;
    studentId: string;
    fullName: string;
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
}

// ==========================================
// Item 26: Student Document Centre Types
// ==========================================

export interface AdmissionLetterDoc {
  available: boolean;
  title: string;
  referenceNumber?: string;
  admissionDate?: string;
  downloadUrl?: string;
}

export interface StudentIdCardDoc {
  available: boolean;
  title: string;
  studentId: string;
  matricNumber: string;
  fullName: string;
  programme: string;
  department: string;
  school: string;
  photo?: string | null;
}

export interface RegistrationFormDoc {
  id: number;
  title: string;
  type: string;
  formCode: string;
  session: string;
  semester: string;
  level: string;
  totalCredits: number;
  status: string;
  approvedAt?: string;
  slipUrl: string;
  frontendUrl: string;
}

export interface FeeReceiptDoc {
  title: string;
  type: string;
  formCode: string;
  receiptNumber: string;
  reference: string;
  amount: number;
  paidAt: string;
  session: string;
  balanceDue: number;
  isCleared: boolean;
  receiptUrl: string;
  frontendUrl: string;
}

export interface ResultSlipDoc {
  title: string;
  type: string;
  formCode: string;
  session: string;
  semester: string;
  level: string;
  gpa: number;
  cgpa: number;
  standing: string;
  publishedAt?: string;
  slipUrl: string;
  frontendUrl: string;
}

export interface StudentDocumentsResponse {
  admissionLetter: AdmissionLetterDoc;
  idCard: StudentIdCardDoc;
  registrationForms: RegistrationFormDoc[];
  feeReceipts: FeeReceiptDoc[];
  resultSlips: ResultSlipDoc[];
  counts: {
    registrationForms: number;
    feeReceipts: number;
    resultSlips: number;
    totalDocuments: number;
  };
}

// ==========================================
// Item 29 & 30: Admin Dashboard Stats & 360 Overview
// ==========================================

export interface AdminDashboardStats {
  studentManagement: {
    totalStudents: number;
    activeStudents: number;
    newEnrollments: number;
    graduatingStudents: number;
    suspendedStudents: number;
  };
  academics: {
    currentSession: string;
    currentSemester: string;
    courseRegistrationsPending: number;
    courseRegistrationsApproved: number;
    courseRegistrationsRejected: number;
  };
  finance: {
    expectedFees: number;
    collectedFees: number;
    outstandingFees: number;
    collectionRatePercent: number;
  };
}

export interface AdminStudent360Overview {
  studentId: number;
  personalInfo: {
    firstName: string;
    middleName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    gender: string;
    dateOfBirth?: string | null;
    stateOfOrigin: string;
    lga: string;
    address: string;
    photo?: string | null;
    guardians: Array<{
      name: string;
      relationship: string;
      phone: string;
      email?: string;
      isPrimary: boolean;
    }>;
  };
  academicInfo: {
    studentId: string;
    matricNumber: string;
    programme: string;
    programmeType: string;
    department: string;
    school: string;
    level: string;
    session: string;
    status: string;
    statusDisplay: string;
  };
  courseRegistrations: Array<{
    id: number;
    session: string;
    semester: string;
    level: string;
    status: string;
    statusDisplay: string;
    totalCredits: number;
    submittedAt?: string;
    approvedAt?: string;
    courses: Array<{
      code: string;
      title: string;
      credits: number;
      status: string;
      isCompulsory: boolean;
    }>;
  }>;
  results: {
    semesterRecords: Array<{
      session: string;
      semester: string;
      level: string;
      registeredCredits: number;
      earnedCredits: number;
      failedCredits: number;
      gpa: number;
      cgpa: number;
      standing: string;
      isPublished: boolean;
    }>;
    courseResults: Array<{
      courseCode: string;
      courseTitle: string;
      session: string;
      semester: string;
      caScore: number;
      examScore: number;
      totalScore: number;
      grade: string;
      gradePoint: number;
      credits: number;
      qualityPoints: number;
      isPassed: boolean;
      status: string;
    }>;
  };
  fees: Array<{
    invoiceNumber: string;
    session: string;
    semester: string;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    status: string;
    statusDisplay: string;
    isCleared: boolean;
  }>;
  payments: Array<{
    reference: string;
    receiptNumber: string;
    amount: number;
    gateway: string;
    status: string;
    paidAt?: string;
    session: string;
  }>;
  statusHistory: Array<{
    fromStatus: string;
    toStatus: string;
    reason: string;
    changedBy: string;
    createdAt: string;
  }>;
  auditHistory: Array<{
    action: string;
    timestamp: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface OfficialTranscriptCourse {
  code: string;
  title: string;
  units: number;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  grade_point: number;
  quality_points: number;
  is_passed: boolean;
}

export interface OfficialTranscriptSemester {
  session_id: number;
  session_name: string;
  semester_id: number;
  semester_name: string;
  level_name: string;
  courses: OfficialTranscriptCourse[];
  semester_summary: {
    registered_units: number;
    earned_units: number;
    quality_points: number;
    gpa: number;
    standing: string;
  };
  cumulative_summary: {
    registered_units: number;
    earned_units: number;
    quality_points: number;
    cgpa: number;
  };
}

export interface OfficialTranscriptData {
  institution: {
    name: string;
    tagline: string;
    address: string;
    office: string;
    form_code: string;
  };
  student: {
    student_id: string;
    matric_number: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    gender: string;
    date_of_birth: string | null;
    state_of_origin: string;
    nationality: string;
    programme: string;
    programme_type: string;
    department: string;
    school: string;
    session_admitted: string;
    current_level: string;
    status: string;
    status_display: string;
    photo: string | null;
  };
  academic_summary: {
    total_registered_units: number;
    total_earned_units: number;
    total_quality_points: number;
    final_cgpa: number;
    diploma_class: string;
    total_semesters: number;
    remarks: string;
    is_graduated: boolean;
  };
  semesters: OfficialTranscriptSemester[];
  verification: {
    code: string;
    issued_at: string;
    registrar_signature: string;
  };
}
