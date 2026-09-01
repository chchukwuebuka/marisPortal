"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, CheckCircle2, GraduationCap } from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { useCatalogue } from "@/hooks/useCatalogue";
import { StepActions, StepPanel } from "@/components/application";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import { JAMB_EXAM_TYPES } from "@/types/enums";
import { UTME_SUBJECTS } from "@/lib/constants";
import { checkCutoff } from "@/services/applications";
import type { ApiCutoffCheckSuggestion } from "@/lib/api/types";
import {
  jambSchema,
  type JambFormValues,
  type JambInput,
} from "@/schemas";
import form from "@/components/application/formLayout.module.css";

interface CutoffRejectionState {
  programmeName: string;
  requiredCutoff: number;
  studentScore: number;
  message: string;
  suggestions: ApiCutoffCheckSuggestion[];
}

export default function JambStep() {
  const router = useRouter();
  const { application, updateJamb, updateProgramme } = useApplication();
  const { findProgramme, findDepartment } = useCatalogue();
  const nav = stepNav("jamb");
  const j = application.jamb;

  const [cutoffRejection, setCutoffRejection] = useState<CutoffRejectionState | null>(null);
  const [switchingProgId, setSwitchingProgId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const chosenProgramme = useMemo(() => {
    return findProgramme(application.programme?.programmeId);
  }, [findProgramme, application.programme?.programmeId]);

  const initialSubjects = useMemo(() => {
    if (j?.subjects && j.subjects.length === 4) {
      return j.subjects.map((s) => ({
        subject: s.subject || "",
        score: s.score != null ? s.score : ("" as unknown as number),
      }));
    }
    return [
      { subject: "Use of English", score: ("" as unknown as number) },
      { subject: "", score: ("" as unknown as number) },
      { subject: "", score: ("" as unknown as number) },
      { subject: "", score: ("" as unknown as number) },
    ];
  }, [j?.subjects]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JambInput, unknown, JambFormValues>({
    resolver: zodResolver(jambSchema),
    defaultValues: {
      registrationNumber: j?.registrationNumber ?? "",
      examYear: j?.examYear != null ? j.examYear : (new Date().getFullYear() as unknown as number),
      examType: j?.examType ?? "UTME",
      firstChoiceInstitution: j?.firstChoiceInstitution ?? "",
      courseApplied: j?.courseApplied ?? "",
      subjects: initialSubjects,
    },
  });

  const watchedSubjects = watch("subjects");

  // Auto-calculated total score
  const totalScore = useMemo(() => {
    if (!watchedSubjects || !Array.isArray(watchedSubjects)) return 0;
    return watchedSubjects.reduce((sum, item) => {
      const val = typeof item?.score === "number" ? item.score : parseInt(String(item?.score || ""), 10);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [watchedSubjects]);

  async function onSubmit(values: JambFormValues) {
    setServerError(null);
    setCutoffRejection(null);

    try {
      // 1. Save JAMB record (backend calculates and stores aggregate score)
      await updateJamb({
        ...values,
        score: totalScore,
      });

      // 2. Query backend cut-off validation API
      try {
        const check = await checkCutoff(application.id);
        if (!check.eligible) {
          setCutoffRejection({
            programmeName: check.programme_name || `${chosenProgramme?.level || ""} ${chosenProgramme?.name || ""}`,
            requiredCutoff: check.cutoff_mark,
            studentScore: check.student_score || totalScore,
            message: check.message,
            suggestions: check.suggestions || [],
          });
          return;
        }
      } catch (checkErr) {
        console.warn("Cut-off check fallback:", checkErr);
        // Fallback local cut-off check if endpoint call fails
        const requiredCutoff = chosenProgramme?.cutoffMark;
        if (requiredCutoff != null && totalScore < requiredCutoff) {
          setCutoffRejection({
            programmeName: `${chosenProgramme?.level || ""} ${chosenProgramme?.name || ""}`,
            requiredCutoff,
            studentScore: totalScore,
            message: `Your JAMB score of ${totalScore} does not meet the cut-off mark of ${requiredCutoff} for ${chosenProgramme?.name}.`,
            suggestions: [],
          });
          return;
        }
      }

      // Cut-off passed -> proceed
      router.push(nav.nextHref);
    } catch (err: any) {
      console.error("Failed to save JAMB information:", err);
      setServerError(err.message || "Failed to save JAMB information. Please check your inputs.");
    }
  }

  async function handleSwitchAndContinue(suggested: ApiCutoffCheckSuggestion) {
    try {
      setSwitchingProgId(String(suggested.id));
      const prog = findProgramme(String(suggested.id));
      await updateProgramme({
        programmeId: String(suggested.id),
        departmentId: prog?.departmentId,
        schoolId: prog?.schoolId,
      });
      router.push(nav.nextHref);
    } catch (err) {
      console.error("Failed to switch programme:", err);
      setSwitchingProgId(null);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepPanel
        title="JAMB / UTME Information"
        description="Enter your 4 UTME subject scores. Your total JAMB score is automatically computed."
        footer={
          <StepActions
            backHref={nav.prevHref}
            loading={isSubmitting || Boolean(switchingProgId)}
            submitDisabled={Boolean(cutoffRejection)}
          />
        }
      >
        {serverError && (
          <div style={{ marginBottom: "20px" }}>
            <Alert tone="error" title="Error">
              {serverError}
            </Alert>
          </div>
        )}

        {/* Cut-off rejection & alternative courses block */}
        {cutoffRejection && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <AlertCircle size={26} style={{ color: "#dc2626", flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 6px 0", color: "#991b1b", fontSize: "16px", fontWeight: 700 }}>
                  Cut-Off Mark Requirement Not Met
                </h4>
                <p style={{ margin: "0 0 14px 0", color: "#7f1d1d", fontSize: "14px", lineHeight: 1.5 }}>
                  {cutoffRejection.message || (
                    <>
                      Your JAMB score of <strong>{cutoffRejection.studentScore}</strong> does not meet the
                      minimum cut-off mark of <strong>{cutoffRejection.requiredCutoff}</strong> required for{" "}
                      <strong>{cutoffRejection.programmeName}</strong>.
                    </>
                  )}
                </p>

                {cutoffRejection.suggestions.length > 0 ? (
                  <>
                    <p style={{ margin: "0 0 10px 0", color: "#1e3a8a", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Suggested Programmes Matching Your Score:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                      {cutoffRejection.suggestions.map((prog) => {
                        const localProg = findProgramme(String(prog.id));
                        const dept = localProg ? findDepartment(localProg.departmentId) : null;
                        return (
                          <div
                            key={prog.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "8px",
                              background: "#ffffff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              padding: "10px 14px",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
                                {prog.programme_type ? `${prog.programme_type} ` : ""}{prog.name}
                              </div>
                              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                {dept?.name ? `${dept.name} • ` : ""}
                                <span style={{ color: "#2563eb", fontWeight: 600 }}>
                                  Cut-Off: {prog.cutoff_mark}
                                </span>
                              </div>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSwitchAndContinue(prog)}
                              disabled={Boolean(switchingProgId)}
                              rightIcon={<ArrowRight size={14} />}
                            >
                              {switchingProgId === String(prog.id) ? "Switching..." : "Switch & Continue"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "14px" }}>
                    No alternative programmes currently found matching your score. Please review your scores or contact the admissions office.
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/applicant/application/programme")}
                  >
                    Change Programme Selection
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCutoffRejection(null)}
                  >
                    Edit Subject Scores
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live cut-off reminder banner */}
        {chosenProgramme?.cutoffMark != null && !cutoffRejection && (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "6px",
              padding: "10px 16px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#1e40af",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span>
              Applying for: <strong>{chosenProgramme.level} {chosenProgramme.name}</strong>
            </span>
            <span
              style={{
                background: "#dbeafe",
                color: "#1e3a8a",
                padding: "3px 10px",
                borderRadius: "4px",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              Required Cut-Off: {chosenProgramme.cutoffMark}
            </span>
          </div>
        )}

        {/* Top Details Grid */}
        <div className={form.grid}>
          <Field
            className={form.span2}
            label="JAMB registration number"
            required
            error={errors.registrationNumber?.message}
          >
            <Input
              {...register("registrationNumber")}
              placeholder="e.g. 20261234AB"
            />
          </Field>

          <Field
            label="Exam type"
            required
            error={errors.examType?.message}
          >
            <Select
              {...register("examType")}
              placeholder="Select exam type"
              options={JAMB_EXAM_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </Field>

          <Field
            label="Exam year"
            required
            error={errors.examYear?.message}
          >
            <Input
              type="number"
              inputMode="numeric"
              {...register("examYear")}
              placeholder="e.g. 2026"
            />
          </Field>

          <Field
            label="First choice institution"
            required
            error={errors.firstChoiceInstitution?.message}
          >
            <Input
              {...register("firstChoiceInstitution")}
              placeholder="e.g. Marist Polytechnic"
            />
          </Field>

          <Field
            className={form.span2}
            label="Course applied for (on JAMB)"
            required
            error={errors.courseApplied?.message}
          >
            <Input
              {...register("courseApplied")}
              placeholder="e.g. Computer Science"
            />
          </Field>
        </div>

        <hr className={form.divider} style={{ margin: "24px 0" }} />

        {/* 4 UTME Subjects Table */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "12px" }}>
            <h3 className={form.sectionTitle}>UTME Subject Breakdown</h3>
            <p className={form.sectionSub}>
              Enter your 4 UTME subjects and the score for each (0–100). Use of English is compulsory.
            </p>
          </div>

          {errors.subjects?.message && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            >
              {errors.subjects.message}
            </div>
          )}

          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              overflow: "hidden",
              background: "var(--color-surface)",
            }}
          >
            <div
              style={{
                background: "var(--color-surface-sunken, #f9fafb)",
                padding: "10px 16px",
                display: "grid",
                gridTemplateColumns: "1fr 140px",
                gap: "16px",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--color-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span>UTME Subject</span>
              <span style={{ textAlign: "right" }}>Score (0–100)</span>
            </div>

            {[0, 1, 2, 3].map((idx) => {
              const currentSubject = watchedSubjects?.[idx]?.subject || "";
              const otherSelected = (watchedSubjects || [])
                .filter((_, i) => i !== idx)
                .map((s) => s?.subject)
                .filter(Boolean);

              const availableSubjects = UTME_SUBJECTS.filter(
                (s) => s !== "Use of English" && (!otherSelected.includes(s) || s === currentSubject)
              );

              const subjectErr = errors.subjects?.[idx]?.subject?.message;
              const scoreErr = errors.subjects?.[idx]?.score?.message;

              return (
                <div
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    display: "grid",
                    gridTemplateColumns: "1fr 140px",
                    gap: "16px",
                    alignItems: "center",
                    borderBottom: idx < 3 ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  <div>
                    {idx === 0 ? (
                      <div>
                        <input
                          type="text"
                          value="Use of English"
                          readOnly
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-surface-sunken, #f3f4f6)",
                            color: "var(--color-ink)",
                            fontWeight: 600,
                            fontSize: "14px",
                          }}
                        />
                        <span style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "2px", display: "block" }}>
                          Compulsory UTME subject
                        </span>
                      </div>
                    ) : (
                      <Controller
                        name={`subjects.${idx}.subject`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <select
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: subjectErr ? "1px solid #ef4444" : "1px solid var(--color-border)",
                                background: "var(--color-surface, #ffffff)",
                                color: "var(--color-ink)",
                                fontSize: "14px",
                              }}
                            >
                              <option value="">-- Select Subject {idx + 1} --</option>
                              {availableSubjects.map((subj) => (
                                <option key={subj} value={subj}>
                                  {subj}
                                </option>
                              ))}
                            </select>
                            {subjectErr && (
                              <span style={{ fontSize: "12px", color: "#dc2626", marginTop: "2px", display: "block" }}>
                                {subjectErr}
                              </span>
                            )}
                          </div>
                        )}
                      />
                    )}
                  </div>

                  <div>
                    <Controller
                      name={`subjects.${idx}.score`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="0–100"
                            value={
                              typeof field.value === "number" ||
                              typeof field.value === "string"
                                ? field.value
                                : ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                field.onChange("" as unknown as number);
                              } else {
                                const num = Math.max(0, Math.min(100, Number(val)));
                                field.onChange(num);
                              }
                            }}
                            style={{
                              width: "100%",
                              textAlign: "right",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: scoreErr ? "1px solid #ef4444" : "1px solid var(--color-border)",
                              background: "var(--color-surface, #ffffff)",
                              color: "var(--color-ink)",
                              fontFamily: "monospace",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          />
                          {scoreErr && (
                            <span style={{ fontSize: "11px", color: "#dc2626", textAlign: "right", display: "block" }}>
                              {scoreErr}
                            </span>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
              );
            })}

            {/* Total Score Summary Footer */}
            <div
              style={{
                background: "var(--color-primary-soft, #eff6ff)",
                borderTop: "2px solid var(--color-primary, #2563eb)",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-ink)" }}>
                  Total JAMB Score
                </span>
                <span style={{ display: "block", fontSize: "12px", color: "var(--color-muted)" }}>
                  Automatically calculated (sum of 4 subjects)
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-primary, #1e40af)", fontFamily: "monospace" }}>
                  {totalScore}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-muted)", marginLeft: "4px" }}>
                  / 400
                </span>
              </div>
            </div>
          </div>
        </div>
      </StepPanel>
    </form>
  );
}
