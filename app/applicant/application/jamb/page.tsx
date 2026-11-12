"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight } from "lucide-react";
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
  const { findProgramme, findDepartment, listProgrammes } = useCatalogue();
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
  }, [j]);

  const isInternational = application.entryMode === "INTERNATIONAL";
  const isDirectTrack =
    application.entryMode === "DE" ||
    application.entryMode === "JUPEB" ||
    application.entryMode === "TRANSFER";

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JambInput, unknown, JambFormValues>({
    resolver: zodResolver(jambSchema),
    defaultValues: {
      registrationNumber:
        j?.registrationNumber ??
        (isInternational ? "INTERNATIONAL-EXEMPT" : ""),
      examYear:
        j?.examYear != null
          ? j.examYear
          : (new Date().getFullYear() as unknown as number),
      examType:
        j?.examType ?? (isDirectTrack || isInternational ? "Direct Entry" : "UTME"),
      firstChoiceInstitution:
        j?.firstChoiceInstitution ??
        (isInternational ? "Marist Polytechnic / AE-FUNAI" : ""),
      courseApplied: j?.courseApplied ?? chosenProgramme?.name ?? "",
      subjects: initialSubjects,
    },
  });

  const watchedSubjects = useWatch({ control, name: "subjects" });
  const watchedExamType = useWatch({ control, name: "examType" });
  const [liveScores, setLiveScores] = useState<Record<number, number | "">>({});

  const resolvedScores: Array<number | ""> = [0, 1, 2, 3].map((idx) => {
    if (idx in liveScores) {
      return liveScores[idx];
    }
    const raw = watchedSubjects?.[idx]?.score ?? initialSubjects[idx]?.score;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw;
    }
    const parsed = parseInt(String(raw ?? ""), 10);
    return Number.isFinite(parsed) ? parsed : "";
  });

  // Immediately calculated total score on every keystroke
  const totalScore = resolvedScores.reduce<number>(
    (sum, s) => sum + (typeof s === "number" ? s : 0),
    0
  );

  const enteredScoresCount = resolvedScores.filter((s) => typeof s === "number").length;

  // Live cut-off evaluation while typing (without waiting for Save & continue)
  const liveCutoffWarning = useMemo<CutoffRejectionState | null>(() => {
    if (watchedExamType === "Direct Entry") return null;
    if (cutoffRejection) return cutoffRejection;
    const requiredCutoff = chosenProgramme?.cutoffMark;
    if (requiredCutoff == null || enteredScoresCount < 4) return null;
    if (totalScore >= requiredCutoff) return null;

    const allProgs = listProgrammes();
    const suggestions: ApiCutoffCheckSuggestion[] = allProgs
      .filter(
        (p) =>
          p.id !== chosenProgramme?.id &&
          p.cutoffMark != null &&
          p.cutoffMark <= totalScore
      )
      .map((p) => ({
        id: Number(p.id),
        name: p.name,
        code: p.code,
        programme_type: p.level,
        cutoff_mark: p.cutoffMark ?? 0,
      }));

    return {
      programmeName: `${chosenProgramme?.level || ""} ${chosenProgramme?.name || ""}`.trim(),
      requiredCutoff,
      studentScore: totalScore,
      message: `Your JAMB score of ${totalScore} does not meet the minimum cut-off mark of ${requiredCutoff} required for ${chosenProgramme?.level || ""} ${chosenProgramme?.name || ""}.`,
      suggestions,
    };
  }, [
    cutoffRejection,
    chosenProgramme,
    enteredScoresCount,
    totalScore,
    listProgrammes,
  ]);

  async function onSubmit(values: JambFormValues) {
    setServerError(null);
    setCutoffRejection(null);

    try {
      if (values.examType === "Direct Entry" || isDirectTrack || isInternational) {
        await updateJamb({
          ...values,
          registrationNumber:
            values.registrationNumber || (isInternational ? "INTERNATIONAL-EXEMPT" : ""),
          examType: "Direct Entry",
          subjects: [],
          score: undefined,
        });
        router.push(nav.nextHref);
        return;
      }

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
    } catch (err: unknown) {
      console.error("Failed to save JAMB information:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save JAMB information. Please check your inputs.";
      setServerError(message);
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
        {liveCutoffWarning && (
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
                  {liveCutoffWarning.message || (
                    <>
                      Your JAMB score of <strong>{liveCutoffWarning.studentScore}</strong> does not meet the
                      minimum cut-off mark of <strong>{liveCutoffWarning.requiredCutoff}</strong> required for{" "}
                      <strong>{liveCutoffWarning.programmeName}</strong>.
                    </>
                  )}
                </p>

                {liveCutoffWarning.suggestions.length > 0 ? (
                  <>
                    <p style={{ margin: "0 0 10px 0", color: "#1e3a8a", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Suggested Programmes Matching Your Score:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                      {liveCutoffWarning.suggestions.map((prog) => {
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
                  {cutoffRejection && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCutoffRejection(null)}
                    >
                      Edit Subject Scores
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live cut-off reminder banner */}
        {chosenProgramme?.cutoffMark != null && !liveCutoffWarning && (
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

        {/* Direct Entry / Exemption Notice OR 4 UTME Subjects Table */}
        {watchedExamType === "Direct Entry" || isDirectTrack || isInternational ? (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <h4 style={{ color: "#1e40af", fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0" }}>
              {isInternational
                ? "International Student Track (JAMB Exemption)"
                : application.entryMode === "JUPEB"
                ? "JUPEB / IJMB Foundation (Direct Entry Track)"
                : application.entryMode === "TRANSFER"
                ? "Inter-University Transfer Track"
                : "Direct Entry (200 Level Admission Track)"}
            </h4>
            <p style={{ color: "#1e3a8a", fontSize: "14px", lineHeight: 1.6, margin: "0 0 12px 0" }}>
              {isInternational
                ? "As an international applicant applying with foreign secondary/high school credentials, you are exempt from Nigerian JAMB examinations. Your admission into the Degree Programme is evaluated based on your high school transcript, international passport, and credential evaluation."
                : application.entryMode === "JUPEB"
                ? "As a JUPEB / IJMB applicant, your admission into the 200 Level Degree Programme is evaluated based on your Advanced Level point score together with your 5 qualifying O'Level credit passes."
                : application.entryMode === "TRANSFER"
                ? "As an Inter-University / Inter-Polytechnic Transfer applicant, your admission is evaluated based on your official academic transcript and transfer clearance from your former institution."
                : "As a Direct Entry applicant into the Degree Programme (200 Level), your admission is evaluated based on your qualifying tertiary credential (National Diploma, NCE, HND, or A-Levels) along with your 5 O'Level credit passes."}
            </p>
            <p style={{ color: "#1e40af", fontSize: "13px", margin: 0, fontWeight: 600 }}>
              ✓ You do not need to enter 4 UTME subject test scores. Please verify your prior institution details in the Educational Background step, and upload your qualifying credentials in the Documents step.
            </p>
          </div>
        ) : (
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
                            inputMode="numeric"
                            min={0}
                            max={100}
                            placeholder="0–100"
                            value={resolvedScores[idx]}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (cutoffRejection) {
                                setCutoffRejection(null);
                              }
                              if (val === "") {
                                setLiveScores((prev) => ({
                                  ...prev,
                                  [idx]: "",
                                }));
                                field.onChange("" as unknown as number);
                              } else {
                                const parsed = parseInt(val, 10);
                                const num = Number.isNaN(parsed)
                                  ? ("" as const)
                                  : Math.max(0, Math.min(100, parsed));
                                setLiveScores((prev) => ({
                                  ...prev,
                                  [idx]: num,
                                }));
                                field.onChange(
                                  num === "" ? ("" as unknown as number) : num
                                );
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
                background:
                  chosenProgramme?.cutoffMark != null &&
                  enteredScoresCount === 4 &&
                  totalScore < chosenProgramme.cutoffMark
                    ? "#fef2f2"
                    : "var(--color-primary-soft, #eff6ff)",
                borderTop:
                  chosenProgramme?.cutoffMark != null &&
                  enteredScoresCount === 4 &&
                  totalScore < chosenProgramme.cutoffMark
                    ? "2px solid #dc2626"
                    : "2px solid var(--color-primary, #2563eb)",
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
                  {chosenProgramme?.cutoffMark != null && enteredScoresCount > 0 ? (
                    totalScore >= chosenProgramme.cutoffMark ? (
                      <span style={{ color: "#15803d", fontWeight: 600 }}>
                        Meets required cut-off mark ({chosenProgramme.cutoffMark})
                      </span>
                    ) : (
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>
                        Required cut-off: {chosenProgramme.cutoffMark} ({chosenProgramme.cutoffMark - totalScore} more point{chosenProgramme.cutoffMark - totalScore === 1 ? "" : "s"} needed)
                      </span>
                    )
                  ) : (
                    "Automatically calculated as you type (sum of 4 subjects)"
                  )}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color:
                      chosenProgramme?.cutoffMark != null &&
                      enteredScoresCount === 4 &&
                      totalScore < chosenProgramme.cutoffMark
                        ? "#dc2626"
                        : "var(--color-primary, #1e40af)",
                    fontFamily: "monospace",
                  }}
                >
                  {totalScore}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-muted)", marginLeft: "4px" }}>
                  / 400
                </span>
              </div>
            </div>
          </div>
        </div>
        )}
      </StepPanel>
    </form>
  );
}
