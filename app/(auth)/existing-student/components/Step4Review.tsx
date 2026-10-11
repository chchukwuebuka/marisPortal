import {
  AlertCircle,
  ArrowLeft,
  FileCheck,
  GraduationCap,
  Loader2,
  Send,
  User,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import type {
  LegacyProfileInput,
  LegacyRegistrationDetail,
  LegacyRequirementChecklistItem,
  LegacyStartInput,
} from "@/types/legacy";
import type { AcademicSession } from "@/types/domain";
import type { ApiLevel } from "@/services/catalogue";
import {
  DEFAULT_FALLBACK_REQUIREMENTS,
  type DepartmentOption,
  type FacultyOption,
  type ProgrammeOption,
} from "../types";
import styles from "../existing-student.module.css";

interface Step4ReviewProps {
  registration: LegacyRegistrationDetail | null;
  startForm: LegacyStartInput;
  profileForm: LegacyProfileInput;
  schools: FacultyOption[];
  departments: DepartmentOption[];
  programmes: ProgrammeOption[];
  levels: ApiLevel[];
  sessions: AcademicSession[];
  sessionInputText: string;
  selectedSchoolId: number | "";
  selectedDepartmentId: number | "";
  requirements: LegacyRequirementChecklistItem[];
  declarationAccepted: boolean;
  setDeclarationAccepted: (val: boolean) => void;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function Step4Review({
  registration,
  startForm,
  profileForm,
  schools,
  departments,
  programmes,
  levels,
  sessions,
  sessionInputText,
  selectedSchoolId,
  selectedDepartmentId,
  requirements,
  declarationAccepted,
  setDeclarationAccepted,
  submitting,
  onBack,
  onSubmit,
}: Step4ReviewProps) {
  const activeProg = programmes.find((p) => p.id === profileForm.programme);
  const activeDept = departments.find(
    (d) => d.id === (activeProg?.departmentId || selectedDepartmentId)
  );
  const activeSchool = schools.find(
    (s) => s.id === (activeProg?.schoolId || activeDept?.schoolId || selectedSchoolId)
  );
  const activeLevelObj = levels.find((l) => l.id === Number(profileForm.current_level));

  const activeRequirementsList =
    requirements.length > 0 ? requirements : DEFAULT_FALLBACK_REQUIREMENTS;

  return (
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
            <span className={styles.summaryVal}>
              {registration?.matric_number || startForm.matric_number}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryKey}>Full Name:</span>
            <span className={styles.summaryVal}>
              {profileForm.first_name}{" "}
              {profileForm.middle_name ? `${profileForm.middle_name} ` : ""}
              {profileForm.last_name}
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
              {activeProg
                ? `${activeProg.name} (${activeProg.type})`
                : registration?.programme_name || "Not specified"}
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
              {activeLevelObj?.name || registration?.current_level_name || "Not specified"}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryKey}>Guardian:</span>
            <span className={styles.summaryVal}>
              {profileForm.guardian_name} ({profileForm.guardian_relationship}) -{" "}
              {profileForm.guardian_phone}
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
            {activeRequirementsList.map((item) => (
              <div key={item.requirement.id} className={styles.summaryRow}>
                <span className={styles.summaryKey}>{item.requirement.name}:</span>
                <span className={styles.summaryVal}>
                  {item.document ? (
                    <span style={{ color: "#059669", fontWeight: 600 }}>
                      ✓ Uploaded ({item.document.original_filename})
                    </span>
                  ) : item.requirement.required ? (
                    <span style={{ color: "#dc2626", fontWeight: 600 }}>
                      ✗ Not Uploaded (Required)
                    </span>
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
            I solemnly declare that all information provided and documents uploaded are authentic,
            correct, and represent my true academic records at Marist Polytechnic. I understand that
            fraudulent claims are subject to immediate disqualification and disciplinary action.
          </span>
        </label>
      </div>

      <div className={styles.cardActions}>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Documents
        </Button>
        <Button
          type="button"
          disabled={submitting || !declarationAccepted}
          onClick={onSubmit}
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
  );
}
