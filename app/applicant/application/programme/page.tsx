"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  CalendarClock,
  GraduationCap,
  Layers,
  Scroll,
} from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { useCatalogue } from "@/hooks/useCatalogue";
import { StepActions, StepPanel } from "@/components/application";
import { Alert, Field, LoadingBlock, Select } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import { formatNaira } from "@/lib/format";
import { ENTRY_MODE_OPTIONS, type EntryMode } from "@/types/enums";
import form from "@/components/application/formLayout.module.css";
import styles from "./programme.module.css";

function formatProgrammeLevel(level?: string): string {
  if (!level) return "ND";
  const up = level.toUpperCase();
  if (up === "BSC" || up === "B.SC" || up === "DEGREE") return "B.Sc.";
  if (up === "BENG" || up === "B.ENG") return "B.Eng.";
  if (up === "ND") return "National Diploma (ND)";
  if (up === "CERT") return "Certificate";
  return level;
}

function isDegreeProg(p: { level?: string } | undefined | null): boolean {
  if (!p || !p.level) return false;
  const up = String(p.level).trim().toUpperCase();
  return (
    up === "BSC" ||
    up === "BENG" ||
    up === "DEGREE" ||
    up.includes("B.SC") ||
    up.includes("B.ENG")
  );
}

function formatProgrammeOptionLabel(prog: {
  name: string;
  level?: string;
  option?: string | null;
  cutoffMark?: number | null;
}): string {
  const formattedLvl = formatProgrammeLevel(prog.level);
  let name = prog.name || "";
  if (name.startsWith(formattedLvl)) {
    name = name.slice(formattedLvl.length).trim();
  }
  const cutoff = prog.cutoffMark ? ` (Cut-Off: ${prog.cutoffMark})` : "";
  const opt = prog.option ? ` (${prog.option})` : "";
  return `${formattedLvl} ${name}${opt}${cutoff}`;
}

function getBadgeClass(mode: EntryMode) {
  switch (mode) {
    case "UTME":
      return styles.entryBadgePrimary;
    case "DE":
      return styles.entryBadgePurple;
    case "INTERNATIONAL":
      return styles.entryBadgeSecondary;
    case "JUPEB":
      return styles.entryBadgeGreen;
    case "TRANSFER":
      return styles.entryBadgePrimary;
    default:
      return "";
  }
}

const ND_ENTRY_MODES: {
  value: EntryMode;
  label: string;
  badge: string;
  description: string;
}[] = [
  {
    value: "UTME",
    label: "JAMB UTME (Standard Entry)",
    badge: "JAMB UTME",
    description:
      "Standard polytechnic admission for candidates with official JAMB UTME score for National Diploma.",
  },
  {
    value: "TRANSFER",
    label: "Inter-Polytechnic Transfer",
    badge: "Transfer",
    description:
      "For students currently enrolled in another accredited polytechnic seeking transfer into an ND programme.",
  },
];

export default function ProgrammeStep() {
  const router = useRouter();
  const { application, updateProgramme } = useApplication();
  const {
    loading: catalogueLoading,
    error: catalogueError,
    findActiveSession,
    findProgramme,
    listDepartments,
    listProgrammes,
    listSchools,
  } = useCatalogue();
  const nav = stepNav("programme");
  const sel = application.programme;

  const initialProg = findProgramme(sel?.programmeId);
  const isInitiallyDegree =
    initialProg?.level === "BSC" ||
    initialProg?.level === "BENG" ||
    initialProg?.level === "DEGREE";

  // Category: "ND" (National Diploma) or "DEGREE" (B.Sc. & B.Eng.)
  const [programmeCategory, setProgrammeCategory] = useState<"ND" | "DEGREE">(
    isInitiallyDegree ? "DEGREE" : "ND",
  );

  const [selectedEntryMode, setSelectedEntryMode] = useState<EntryMode>(
    (application.entryMode || sel?.entryMode || "UTME") as EntryMode,
  );

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    sel?.schoolId ?? "",
  );
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    sel?.departmentId ?? "",
  );
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(
    sel?.programmeId ?? "",
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProgForCategory = useCallback(
    (p: { level?: string } | undefined | null, cat: "ND" | "DEGREE") => {
      const isDeg = isDegreeProg(p);
      return cat === "DEGREE" ? isDeg : !isDeg;
    },
    [],
  );

  // Sync initial values from application once catalogue is loaded
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (catalogueLoading || !application.id) return;
    if (!hasInitializedRef.current) {
      if (application.entryMode) {
        setSelectedEntryMode(application.entryMode as EntryMode);
      }
      if (sel?.programmeId) {
        const prog = findProgramme(sel.programmeId);
        if (prog) {
          const isDeg = isDegreeProg(prog);
          setProgrammeCategory(isDeg ? "DEGREE" : "ND");
          setSelectedProgrammeId(String(prog.id));
          if (prog.schoolId) setSelectedSchoolId(String(prog.schoolId));
          if (prog.departmentId) setSelectedDepartmentId(String(prog.departmentId));
          hasInitializedRef.current = true;
          return;
        }
      }
      if (sel?.schoolId) setSelectedSchoolId(String(sel.schoolId));
      if (sel?.departmentId) setSelectedDepartmentId(String(sel.departmentId));
      if (sel?.programmeId) setSelectedProgrammeId(String(sel.programmeId));
      hasInitializedRef.current = true;
    }
  }, [catalogueLoading, application.id, application.entryMode, sel, findProgramme]);

  // Handle switching between ND and DEGREE
  const handleCategoryChange = (newCat: "ND" | "DEGREE") => {
    setProgrammeCategory(newCat);
    setError(null);

    // If switching to ND and current entry mode is degree-only, default to UTME
    if (
      newCat === "ND" &&
      (selectedEntryMode === "DE" ||
        selectedEntryMode === "JUPEB" ||
        selectedEntryMode === "INTERNATIONAL" ||
        selectedEntryMode === "TRANSFER")
    ) {
      setSelectedEntryMode("UTME");
    }

    // Reset cascade selections when switching categories
    setSelectedSchoolId("");
    setSelectedDepartmentId("");
    setSelectedProgrammeId("");
  };

  const allSchools = listSchools();

  // Filter schools that have programmes matching the active category
  const filteredSchools = useMemo(() => {
    return allSchools.filter((s) => {
      const depts = listDepartments(s.id);
      return depts.some((d) => {
        const progs = listProgrammes(d.id);
        return progs.some((p) => isProgForCategory(p, programmeCategory));
      });
    });
  }, [allSchools, listDepartments, listProgrammes, programmeCategory, isProgForCategory]);

  const rawDepartments = listDepartments(selectedSchoolId);

  // Show all departments belonging to the selected faculty/school from the handbook
  const filteredDepartments = useMemo(() => {
    if (!selectedSchoolId) return [];
    return rawDepartments;
  }, [rawDepartments, selectedSchoolId]);

  const rawProgrammes = listProgrammes(selectedDepartmentId);

  // Filter programmes strictly matching the active category
  const availableProgrammes = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return rawProgrammes.filter((p) => isProgForCategory(p, programmeCategory));
  }, [rawProgrammes, selectedDepartmentId, programmeCategory, isProgForCategory]);

  const selectedProgramme = findProgramme(selectedProgrammeId);
  const notAccepting =
    !!selectedProgramme && !selectedProgramme.acceptingApplications;

  const isDegreeProgramme =
    programmeCategory === "DEGREE" ||
    selectedProgramme?.level === "BSC" ||
    selectedProgramme?.level === "BENG" ||
    selectedProgramme?.level === "DEGREE";

  const visibleEntryOptions =
    programmeCategory === "DEGREE" ? ENTRY_MODE_OPTIONS : ND_ENTRY_MODES;

  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSchoolId(e.target.value);
    setSelectedDepartmentId("");
    setSelectedProgrammeId("");
    setError(null);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartmentId(e.target.value);
    setSelectedProgrammeId("");
    setError(null);
  };

  const handleProgrammeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgrammeId(e.target.value);
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEntryMode) {
      setError("Please choose your admission category / entry mode.");
      return;
    }
    if (!selectedSchoolId) {
      setError("Please select a school / faculty.");
      return;
    }
    if (!selectedDepartmentId) {
      setError("Please select a department.");
      return;
    }
    if (!selectedProgrammeId) {
      setError("Please select a programme.");
      return;
    }
    if (notAccepting) {
      setError("This programme is currently not accepting applications.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updateProgramme({
        schoolId: selectedSchoolId,
        departmentId: selectedDepartmentId,
        programmeId: selectedProgrammeId,
        sessionId: findActiveSession().id,
        entryMode: selectedEntryMode,
      });
      router.push(nav.nextHref);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save programme selection. Please try again.",
      );
      setSubmitting(false);
    }
  }

  if (catalogueLoading && allSchools.length === 0) {
    return <LoadingBlock label="Loading academic programmes…" />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepPanel
        title="Programme & Entry Mode Selection"
        description="Choose whether you are applying for a National Diploma (ND) or Degree programme, select your admission track, and choose your course of study."
        footer={
          <StepActions
            backHref={nav.prevHref}
            loading={submitting}
            submitDisabled={!selectedProgrammeId || notAccepting}
          />
        }
      >
        {catalogueError && (
          <div style={{ marginBottom: 16 }}>
            <Alert tone="warning" title="Notice">
              {catalogueError}
            </Alert>
          </div>
        )}

        {/* STEP 1: Programme Category (National Diploma vs Degree) */}
        <div className={styles.categorySection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>1. Choose Programme Category</h3>
            <p className={styles.sectionSubtitle}>
              Select the qualification level you wish to study for at Marist.
            </p>
          </div>

          <div className={styles.categoryGrid}>
            {/* National Diploma Card */}
            <div
              role="button"
              tabIndex={0}
              className={`${styles.categoryCard} ${programmeCategory === "ND" ? styles.categoryCardSelected : ""}`}
              onClick={() => handleCategoryChange("ND")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleCategoryChange("ND");
                }
              }}
            >
              <div className={styles.categoryHeader}>
                <div className={styles.categoryIconWrap}>
                  <Scroll size={22} />
                </div>
                <span className={`${styles.categoryBadge} ${styles.categoryBadgeND}`}>
                  National Diploma
                </span>
              </div>
              <h4 className={styles.categoryTitle}>National Diploma (ND)</h4>
              <p className={styles.categorySubtitle}>Awarded by Marist Polytechnic</p>
              <p className={styles.categoryDesc}>
                2-year polytechnic National Diploma programmes across Engineering, Computing, Applied Sciences, Environmental, and Business & Management.
              </p>
            </div>

            {/* Degree Programme Card */}
            <div
              role="button"
              tabIndex={0}
              className={`${styles.categoryCard} ${programmeCategory === "DEGREE" ? styles.categoryCardSelected : ""}`}
              onClick={() => handleCategoryChange("DEGREE")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleCategoryChange("DEGREE");
                }
              }}
            >
              <div className={styles.categoryHeader}>
                <div className={styles.categoryIconWrap}>
                  <GraduationCap size={22} />
                </div>
                <span className={`${styles.categoryBadge} ${styles.categoryBadgeDegree}`}>
                  B.Sc. & B.Eng. Degrees
                </span>
              </div>
              <h4 className={styles.categoryTitle}>Degree Programmes</h4>
              <p className={styles.categorySubtitle}>In affiliation with AE-FUNAI</p>
              <p className={styles.categoryDesc}>
                4 to 5-year university Bachelor of Science (B.Sc.) and Bachelor of Engineering (B.Eng.) programmes in academic affiliation with Alex Ekwueme Federal University.
              </p>
            </div>
          </div>
        </div>

        {/* STEP 2: Admission Category / Entry Mode Selector */}
        <div className={styles.entryModeSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              2. {programmeCategory === "DEGREE" ? "Degree Admission Track" : "ND Admission Track"}
            </h3>
            <p className={styles.sectionSubtitle}>
              {programmeCategory === "DEGREE"
                ? "Choose how you are applying for the Degree programme. Document requirements adapt to this mode."
                : "Choose your admission mode for the National Diploma programme."}
            </p>
          </div>

          <div className={styles.entryModeGrid}>
            {visibleEntryOptions.map((opt) => {
              const isSelected = selectedEntryMode === opt.value;
              return (
                <div
                  key={opt.value}
                  role="button"
                  tabIndex={0}
                  className={`${styles.entryCard} ${isSelected ? styles.entryCardSelected : ""}`}
                  onClick={() => {
                    setSelectedEntryMode(opt.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedEntryMode(opt.value);
                      setError(null);
                    }
                  }}
                >
                  <div className={styles.radioIndicator}>
                    {isSelected && <span className={styles.radioDot} />}
                  </div>
                  <div className={styles.entryContent}>
                    <div className={styles.entryTopRow}>
                      <span className={styles.entryLabel}>{opt.label}</span>
                      <span className={`${styles.entryBadge} ${getBadgeClass(opt.value)}`}>
                        {opt.badge}
                      </span>
                    </div>
                    <p className={styles.entryDesc}>{opt.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 3: School, Department, Programme Dropdowns */}
        <div className={styles.sectionHeader} style={{ marginTop: "24px" }}>
          <h3 className={styles.sectionTitle}>
            3. Select Course of Study ({programmeCategory === "DEGREE" ? "Degree Offerings" : "National Diploma Offerings"})
          </h3>
          <p className={styles.sectionSubtitle}>
            Showing {programmeCategory === "DEGREE" ? "B.Sc. and B.Eng. degree" : "National Diploma (ND)"} programmes.
          </p>
        </div>

        <div className={form.grid}>
          <Field
            className={form.span2}
            label={programmeCategory === "DEGREE" ? "Faculty / School" : "School"}
            required
            error={error && !selectedSchoolId ? error : undefined}
          >
            <Select
              value={selectedSchoolId}
              placeholder={programmeCategory === "DEGREE" ? "Select a faculty" : "Select a school"}
              onChange={handleSchoolChange}
              options={filteredSchools.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />
          </Field>

          <Field
            label="Department"
            required
            error={error && selectedSchoolId && !selectedDepartmentId ? error : undefined}
          >
            <Select
              value={selectedDepartmentId}
              placeholder="Select a department"
              disabled={!selectedSchoolId}
              onChange={handleDepartmentChange}
              options={filteredDepartments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
          </Field>

          <Field
            label={programmeCategory === "DEGREE" ? "Degree Programme" : "ND Programme"}
            required
            error={error && selectedDepartmentId && !selectedProgrammeId ? error : undefined}
          >
            <Select
              value={selectedProgrammeId}
              placeholder={
                programmeCategory === "DEGREE"
                  ? "Select a degree programme"
                  : "Select an ND programme"
              }
              disabled={!selectedDepartmentId || availableProgrammes.length === 0}
              onChange={handleProgrammeChange}
              options={
                availableProgrammes.length === 0 && selectedDepartmentId
                  ? [
                      {
                        value: "",
                        label: `No ${programmeCategory === "DEGREE" ? "degree" : "ND"} programmes currently open in this department`,
                        disabled: true,
                      },
                    ]
                  : availableProgrammes.map((prog) => ({
                      value: prog.id,
                      label: formatProgrammeOptionLabel(prog),
                      disabled: !prog.acceptingApplications,
                    }))
              }
            />
          </Field>
        </div>

        {/* AE-FUNAI Affiliation Banner for Degree Programmes */}
        {isDegreeProgramme && (
          <div className={styles.affiliationNotice}>
            <Award size={26} style={{ color: "#2563eb", flexShrink: 0 }} />
            <div>
              <strong>Degree Programme (In Affiliation with AE-FUNAI):</strong> This university degree programme is awarded in academic affiliation with Alex Ekwueme Federal University Ndufu-Alike (AE-FUNAI).
            </div>
          </div>
        )}

        {/* Selected Programme Summary Card */}
        {selectedProgramme && (
          <div className={styles.detail}>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>
                <GraduationCap size={18} />
              </span>
              <div>
                <p className={styles.detailLabel}>Programme</p>
                <p className={styles.detailValue}>
                  {formatProgrammeLevel(selectedProgramme.level)} {selectedProgramme.name}
                  {selectedProgramme.option && ` (${selectedProgramme.option})`}
                </p>
              </div>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>
                <Layers size={18} />
              </span>
              <div>
                <p className={styles.detailLabel}>Qualification</p>
                <p className={styles.detailValue}>
                  {formatProgrammeLevel(selectedProgramme.level)}
                  {selectedProgramme.level === "BSC" || selectedProgramme.level === "BENG"
                    ? " (AE-FUNAI)"
                    : ""}
                </p>
              </div>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>
                <BookOpen size={18} />
              </span>
              <div>
                <p className={styles.detailLabel}>Admission Track</p>
                <p className={styles.detailValue}>
                  {ENTRY_MODE_OPTIONS.find((m) => m.value === selectedEntryMode)?.label || selectedEntryMode}
                </p>
              </div>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>
                <CalendarClock size={18} />
              </span>
              <div>
                <p className={styles.detailLabel}>Duration</p>
                <p className={styles.detailValue}>
                  {selectedProgramme.durationYears}{" "}
                  {selectedProgramme.durationYears === 1 ? "year" : "years"}
                </p>
              </div>
            </div>

            {selectedProgramme.totalFee && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>₦</span>
                <div>
                  <p className={styles.detailLabel}>Application Fee</p>
                  <p className={styles.detailValue}>
                    {formatNaira(Number(selectedProgramme.totalFee))}
                  </p>
                </div>
              </div>
            )}

            {selectedEntryMode === "UTME" && selectedProgramme.cutoffMark != null && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>🎯</span>
                <div>
                  <p className={styles.detailLabel}>Minimum UTME Cut-Off</p>
                  <p className={styles.detailValue} style={{ fontWeight: 700, color: "#2563eb" }}>
                    {selectedProgramme.cutoffMark} Aggregate
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className={styles.alertWrap}>
            <Alert tone="error" title="Selection required">
              {error}
            </Alert>
          </div>
        )}

        {selectedEntryMode === "UTME" &&
          selectedProgramme?.cutoffMark != null &&
          application.jamb?.score != null &&
          application.jamb.score < selectedProgramme.cutoffMark && (
            <div className={styles.alertWrap}>
              <Alert tone="warning" title="Score Below Programme Cut-Off">
                Your JAMB score of {application.jamb.score} is below the minimum
                cut-off mark ({selectedProgramme.cutoffMark}) for {selectedProgramme.name}.
                You will be required to choose an alternative qualifying course before final submission.
              </Alert>
            </div>
          )}

        {notAccepting && (
          <div className={styles.alertWrap}>
            <Alert tone="warning" title="Applications closed for this programme">
              This programme is not currently accepting applications. Please
              choose a different programme to continue.
            </Alert>
          </div>
        )}
      </StepPanel>
    </form>
  );
}
