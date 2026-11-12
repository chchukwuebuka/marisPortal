"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, BookOpen, CalendarClock, Check, GraduationCap, Layers } from "lucide-react";
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

export default function ProgrammeStep() {
  const router = useRouter();
  const { application, updateProgramme } = useApplication();
  const {
    loading,
    error: catalogueError,
    findActiveSession,
    findProgramme,
    listDepartments,
    listProgrammes,
    listSchools,
  } = useCatalogue();
  const nav = stepNav("programme");
  const sel = application.programme;

  const currentMode = (application.entryMode || sel?.entryMode || "UTME") as EntryMode;
  const [selectedEntryMode, setSelectedEntryMode] = useState<EntryMode>(currentMode);
  const [programmeFilter, setProgrammeFilter] = useState<"ALL" | "DEGREE" | "ND">("ALL");

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

  // Sync initial values if application loads after initial render
  useEffect(() => {
    if (application.entryMode && application.entryMode !== selectedEntryMode) {
      setSelectedEntryMode(application.entryMode as EntryMode);
    }
  }, [application.entryMode, selectedEntryMode]);

  useEffect(() => {
    if (sel?.schoolId && !selectedSchoolId) {
      setSelectedSchoolId(sel.schoolId);
    }
    if (sel?.departmentId && !selectedDepartmentId) {
      setSelectedDepartmentId(sel.departmentId);
    }
    if (sel?.programmeId && !selectedProgrammeId) {
      setSelectedProgrammeId(sel.programmeId);
    }
  }, [sel, selectedSchoolId, selectedDepartmentId, selectedProgrammeId]);

  const schools = listSchools();
  const availableDepartments = listDepartments(selectedSchoolId);
  const rawProgrammes = listProgrammes(selectedDepartmentId);

  // Filter programmes based on user level filter (ALL, DEGREE, ND)
  const availableProgrammes = useMemo(() => {
    if (programmeFilter === "ALL") return rawProgrammes;
    if (programmeFilter === "DEGREE") {
      return rawProgrammes.filter(
        (p) => p.level === "BSC" || p.level === "BENG" || p.level === "DEGREE",
      );
    }
    if (programmeFilter === "ND") {
      return rawProgrammes.filter((p) => p.level === "ND");
    }
    return rawProgrammes;
  }, [rawProgrammes, programmeFilter]);

  const selectedProgramme = findProgramme(selectedProgrammeId);
  const notAccepting =
    !!selectedProgramme && !selectedProgramme.acceptingApplications;

  const isDegreeProgramme =
    selectedProgramme?.level === "BSC" ||
    selectedProgramme?.level === "BENG" ||
    selectedProgramme?.level === "DEGREE";

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

  if (loading && schools.length === 0) {
    return <LoadingBlock label="Loading academic programmes…" />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepPanel
        title="Programme & Entry Mode Selection"
        description="Select your admission track and the programme you wish to apply for at Marist Polytechnic / AE-FUNAI."
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

        {/* 1. Admission Category / Entry Mode Selector */}
        <div className={styles.entryModeSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>1. Admission Track / Entry Mode</h3>
            <p className={styles.sectionSubtitle}>
              Choose how you are applying. Document requirements and qualification checks are tailored to this mode.
            </p>
          </div>

          <div className={styles.entryModeGrid}>
            {ENTRY_MODE_OPTIONS.map((opt) => {
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

        {/* 2. Programme Filter Pills */}
        <div className={styles.sectionHeader} style={{ marginTop: "24px" }}>
          <h3 className={styles.sectionTitle}>2. Academic Programme Selection</h3>
          <p className={styles.sectionSubtitle}>
            Filter between Degree programmes and National Diploma programmes, then select your faculty and department.
          </p>
        </div>

        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Filter:</span>
          <button
            type="button"
            className={`${styles.filterPill} ${programmeFilter === "ALL" ? styles.filterPillActive : ""}`}
            onClick={() => setProgrammeFilter("ALL")}
          >
            All Programmes
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${programmeFilter === "DEGREE" ? styles.filterPillActive : ""}`}
            onClick={() => setProgrammeFilter("DEGREE")}
          >
            🎓 Degree (B.Sc. & B.Eng.)
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${programmeFilter === "ND" ? styles.filterPillActive : ""}`}
            onClick={() => setProgrammeFilter("ND")}
          >
            📜 National Diploma (ND)
          </button>
        </div>

        {/* 3. School, Department, Programme Dropdowns */}
        <div className={form.grid}>
          <Field
            className={form.span2}
            label="School / Faculty"
            required
            error={error && !selectedSchoolId ? error : undefined}
          >
            <Select
              value={selectedSchoolId}
              placeholder="Select a school / faculty"
              onChange={handleSchoolChange}
              options={schools.map((s) => ({
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
              options={availableDepartments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
          </Field>

          <Field
            label="Programme"
            required
            error={error && selectedDepartmentId && !selectedProgrammeId ? error : undefined}
          >
            <Select
              value={selectedProgrammeId}
              placeholder="Select a programme"
              disabled={!selectedDepartmentId}
              onChange={handleProgrammeChange}
              options={availableProgrammes.map((prog) => {
                const formattedLvl = formatProgrammeLevel(prog.level);
                const cutoff = prog.cutoffMark ? ` (Cut-Off: ${prog.cutoffMark})` : "";
                const opt = prog.option ? ` (${prog.option})` : "";
                return {
                  value: prog.id,
                  label: `${formattedLvl} ${prog.name}${opt}${cutoff}`,
                  disabled: !prog.acceptingApplications,
                };
              })}
            />
          </Field>
        </div>

        {/* AE-FUNAI Affiliation Banner for Degree Programmes */}
        {isDegreeProgramme && (
          <div className={styles.affiliationNotice}>
            <Award size={24} style={{ color: "#2563eb", flexShrink: 0 }} />
            <div>
              <strong>Degree Programme (Affiliation with AE-FUNAI):</strong> This B.Sc. / B.Eng. degree programme is offered by Marist in academic affiliation with Alex Ekwueme Federal University Ndufu-Alike (AE-FUNAI).
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
                <p className={styles.detailLabel}>Award / Level</p>
                <p className={styles.detailValue}>
                  {formatProgrammeLevel(selectedProgramme.level)}
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
