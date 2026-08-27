"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, GraduationCap, Layers } from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { useCatalogue } from "@/hooks/useCatalogue";
import { StepActions, StepPanel } from "@/components/application";
import { Alert, Button, Field, LoadingBlock, Select } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import { formatNaira } from "@/lib/format";
import form from "@/components/application/formLayout.module.css";
import styles from "./programme.module.css";

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
  const availableProgrammes = listProgrammes(selectedDepartmentId);
  const selectedProgramme = findProgramme(selectedProgrammeId);
  const notAccepting =
    !!selectedProgramme && !selectedProgramme.acceptingApplications;

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
        title="Programme Selection"
        description="Choose the school, department, and programme you are applying to."
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

        <div className={form.grid}>
          <Field
            className={form.span2}
            label="School / Faculty"
            required
            error={error && !selectedSchoolId ? error : undefined}
          >
            <Select
              value={selectedSchoolId}
              placeholder="Select a school"
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
              options={availableProgrammes.map((prog) => ({
                value: prog.id,
                label: `${prog.level} ${prog.name}${prog.option ? ` (${prog.option})` : ""}${prog.cutoffMark ? ` (Cut-Off: ${prog.cutoffMark})` : ""}`,
                disabled: !prog.acceptingApplications,
              }))}
            />
          </Field>
        </div>

        {selectedProgramme && (
          <div className={styles.detail}>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>
                <GraduationCap size={18} />
              </span>
              <div>
                <p className={styles.detailLabel}>Programme</p>
                <p className={styles.detailValue}>
                  {selectedProgramme.level} {selectedProgramme.name}
                  {selectedProgramme.option && ` (${selectedProgramme.option})`}
                </p>
              </div>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>
                <Layers size={18} />
              </span>
              <div>
                <p className={styles.detailLabel}>Level</p>
                <p className={styles.detailValue}>{selectedProgramme.level}</p>
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
                <span className={styles.detailIcon}>
                  ₦
                </span>
                <div>
                  <p className={styles.detailLabel}>Application Fee</p>
                  <p className={styles.detailValue}>
                    {formatNaira(Number(selectedProgramme.totalFee))}
                  </p>
                </div>
              </div>
            )}
          
            {selectedProgramme.cutoffMark != null && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>
                  🎯
                </span>
                <div>
                  <p className={styles.detailLabel}>Minimum UTME Cut-Off</p>
                  <p className={styles.detailValue} style={{ fontWeight: 700, color: "#274088" }}>
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

        {selectedProgramme?.cutoffMark != null &&
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
