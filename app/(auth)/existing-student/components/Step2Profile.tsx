import { ArrowLeft, ArrowRight, GraduationCap, Loader2, User, Users } from "lucide-react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import type { LegacyProfileInput, LegacyRegistrationDetail } from "@/types/legacy";
import type { AcademicSession } from "@/types/domain";
import type { ApiLevel } from "@/services/catalogue";
import {
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  RELIGION_OPTIONS,
  RELATIONSHIP_OPTIONS,
  NIGERIAN_STATES,
  type FacultyOption,
  type DepartmentOption,
  type ProgrammeOption,
} from "../types";
import styles from "../existing-student.module.css";

interface Step2ProfileProps {
  registration: LegacyRegistrationDetail | null;
  profileForm: LegacyProfileInput;
  setProfileForm: React.Dispatch<React.SetStateAction<LegacyProfileInput>>;
  schools: FacultyOption[];
  departments: DepartmentOption[];
  programmes: ProgrammeOption[];
  levels: ApiLevel[];
  sessions: AcademicSession[];
  selectedSchoolId: number | "";
  setSelectedSchoolId: (id: number | "") => void;
  selectedDepartmentId: number | "";
  setSelectedDepartmentId: (id: number | "") => void;
  sessionInputText: string;
  setSessionInputText: (text: string) => void;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function Step2Profile({
  registration,
  profileForm,
  setProfileForm,
  schools,
  departments,
  programmes,
  levels,
  sessions,
  selectedSchoolId,
  setSelectedSchoolId,
  selectedDepartmentId,
  setSelectedDepartmentId,
  sessionInputText,
  setSessionInputText,
  submitting,
  onBack,
  onSubmit,
}: Step2ProfileProps) {
  // Cascading lists
  const filteredDepartments = selectedSchoolId
    ? departments.filter((d) => d.schoolId === selectedSchoolId)
    : departments;

  const filteredProgrammes = selectedDepartmentId
    ? programmes.filter((p) => p.departmentId === selectedDepartmentId)
    : selectedSchoolId
    ? programmes.filter((p) => p.schoolId === selectedSchoolId)
    : programmes;

  const activeProg = programmes.find((p) => p.id === profileForm.programme);
  const isDegreeProgramme =
    activeProg?.type === "BSC" ||
    activeProg?.type === "BENG" ||
    activeProg?.type === "DEGREE" ||
    activeProg?.type === "DIRECT_ENTRY";
  const isHndProgramme = activeProg?.type === "HND";
  const isNdProgramme = activeProg?.type === "ND";

  const levelSelectOptions = [
    { value: "", label: "Select Current Academic Level" },
    ...levels
      .filter((lvl) => {
        const num = lvl.numeric_value || parseInt(lvl.code, 10) || lvl.id;
        if (isNdProgramme) return num === 100 || num === 200 || lvl.id === 1 || lvl.id === 2;
        if (isHndProgramme) return num === 300 || num === 400 || lvl.id === 3 || lvl.id === 4;
        return true;
      })
      .map((lvl) => {
        const num = lvl.numeric_value || parseInt(lvl.code, 10) || lvl.id;
        let formattedLabel = lvl.name;

        if (isDegreeProgramme) {
          if (num === 100 || lvl.code === "100" || lvl.id === 1)
            formattedLabel = `${lvl.name} (Year 1 / Fresh Entry)`;
          else if (num === 200 || lvl.code === "200" || lvl.id === 2)
            formattedLabel = `${lvl.name} (Year 2 / Direct Entry)`;
          else if (num === 300 || lvl.code === "300" || lvl.id === 3)
            formattedLabel = `${lvl.name} (Year 3)`;
          else if (num === 400 || lvl.code === "400" || lvl.id === 4)
            formattedLabel = `${lvl.name} (Year 4)`;
          else if (num === 500 || lvl.code === "500" || lvl.id === 5)
            formattedLabel = `${lvl.name} (Year 5 / Final Year)`;
          else formattedLabel = `${lvl.name}`;
        } else if (isNdProgramme) {
          if (num === 100 || lvl.code === "100" || lvl.id === 1)
            formattedLabel = `ND I (${lvl.name})`;
          else if (num === 200 || lvl.code === "200" || lvl.id === 2)
            formattedLabel = `ND II (${lvl.name})`;
          else formattedLabel = `ND - ${lvl.name}`;
        } else if (isHndProgramme) {
          if (num === 300 || lvl.code === "300" || lvl.id === 3)
            formattedLabel = `HND I (${lvl.name})`;
          else if (num === 400 || lvl.code === "400" || lvl.id === 4)
            formattedLabel = `HND II (${lvl.name})`;
          else formattedLabel = `HND - ${lvl.name}`;
        } else {
          if (num === 100 || lvl.code === "100" || lvl.id === 1)
            formattedLabel = `ND I / ${lvl.name}`;
          else if (num === 200 || lvl.code === "200" || lvl.id === 2)
            formattedLabel = `ND II / ${lvl.name}`;
          else if (num === 300 || lvl.code === "300" || lvl.id === 3)
            formattedLabel = `HND I / ${lvl.name}`;
          else if (num === 400 || lvl.code === "400" || lvl.id === 4)
            formattedLabel = `HND II / ${lvl.name}`;
          else if (num === 500 || lvl.code === "500" || lvl.id === 5)
            formattedLabel = `${lvl.name} (B.Sc / B.Eng Final Year)`;
        }

        return {
          value: String(lvl.id),
          label: formattedLabel,
        };
      }),
  ];

  return (
    <Card className={styles.card}>
      {/* Session Datalist for Historical / Custom Sessions */}
      <datalist id="session-datalist">
        {sessions.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>

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

      <form onSubmit={onSubmit} className={styles.form}>
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
          <Button type="button" variant="outline" onClick={onBack}>
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
  );
}
