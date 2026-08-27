"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { useCatalogue } from "@/hooks/useCatalogue";
import { StepActions, StepPanel } from "@/components/application";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import { JAMB_EXAM_TYPES } from "@/types/enums";
import type { Programme } from "@/types/domain";
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
  suggestions: Programme[];
}

export default function JambStep() {
  const router = useRouter();
  const { application, updateJamb, updateProgramme } = useApplication();
  const { findProgramme, findDepartment, listProgrammes } = useCatalogue();
  const nav = stepNav("jamb");
  const j = application.jamb;

  const [cutoffRejection, setCutoffRejection] = useState<CutoffRejectionState | null>(null);
  const [switchingProgId, setSwitchingProgId] = useState<string | null>(null);

  const chosenProgramme = useMemo(() => {
    return findProgramme(application.programme?.programmeId);
  }, [findProgramme, application.programme?.programmeId]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JambInput, unknown, JambFormValues>({
    resolver: zodResolver(jambSchema),
    defaultValues: {
      registrationNumber: j?.registrationNumber ?? "",
      examYear: j?.examYear != null ? String(j.examYear) : "",
      score: j?.score != null ? String(j.score) : "",
      examType: j?.examType,
      firstChoiceInstitution: j?.firstChoiceInstitution ?? "",
      courseApplied: j?.courseApplied ?? "",
    },
  });

  const enteredScore = watch("score");

  async function onSubmit(values: JambFormValues) {
    const studentScore = Number(values.score);
    const requiredCutoff = chosenProgramme?.cutoffMark;

    // Check if student's score is below chosen programme cut-off
    if (
      requiredCutoff != null &&
      !isNaN(studentScore) &&
      studentScore < requiredCutoff
    ) {
      // Save JAMB details so applicant doesn't re-type them
      await updateJamb(values);

      // Find qualifying alternative courses
      const allProgs = listProgrammes();
      const qualifying = allProgs
        .filter((p) => p.id !== chosenProgramme?.id && p.acceptingApplications)
        .filter((p) => p.cutoffMark == null || p.cutoffMark <= studentScore)
        .sort((a, b) => (b.cutoffMark ?? 0) - (a.cutoffMark ?? 0));

      setCutoffRejection({
        programmeName: `${chosenProgramme?.level} ${chosenProgramme?.name}`,
        requiredCutoff,
        studentScore,
        suggestions: qualifying,
      });
      return;
    }

    // Normal path: score meets cut-off or course has no cut-off
    setCutoffRejection(null);
    await updateJamb(values);
    router.push(nav.nextHref);
  }

  async function handleSwitchAndContinue(suggested: Programme) {
    try {
      setSwitchingProgId(suggested.id);
      await updateProgramme({
        programmeId: suggested.id,
        departmentId: suggested.departmentId,
        schoolId: suggested.schoolId,
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
        title="JAMB Information"
        description="Provide your JAMB/UTME registration details exactly as they appear on your result slip."
        footer={
          <StepActions
            backHref={nav.prevHref}
            loading={isSubmitting || Boolean(switchingProgId)}
            submitDisabled={Boolean(cutoffRejection)}
          />
        }
      >
        {/* Cut-off rejection & suggestion block */}
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
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <AlertCircle size={24} style={{ color: "#dc2626", flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 6px 0", color: "#991b1b", fontSize: "16px", fontWeight: 700 }}>
                  Application Stopped: Cut-Off Mark Requirement Not Met
                </h4>
                <p style={{ margin: "0 0 12px 0", color: "#7f1d1d", fontSize: "14px", lineHeight: 1.5 }}>
                  Your UTME score of <strong>{cutoffRejection.studentScore}</strong> does not meet the
                  minimum cut-off mark of <strong>{cutoffRejection.requiredCutoff}</strong> required for{" "}
                  <strong>{cutoffRejection.programmeName}</strong>. You cannot continue this application
                  with this course.
                </p>

                <p style={{ margin: "0 0 12px 0", color: "#1e3a8a", fontSize: "14px", fontWeight: 600 }}>
                  Suggested courses that match your UTME score:
                </p>

                {cutoffRejection.suggestions.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#6b7280" }}>
                    No alternative programmes currently available matching your score.
                    Please contact the admissions office.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    {cutoffRejection.suggestions.slice(0, 6).map((prog) => {
                      const dept = findDepartment(prog.departmentId);
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
                              {prog.level} {prog.name}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                              {dept?.name || "Department"} •{" "}
                              <span style={{ color: "#2563eb", fontWeight: 600 }}>
                                {prog.cutoffMark ? `Cut-Off: ${prog.cutoffMark}` : "Open"}
                              </span>
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSwitchAndContinue(prog)}
                            disabled={Boolean(switchingProgId)}
                          >
                            {switchingProgId === prog.id ? "Switching..." : "Switch to this Course & Continue"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
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
                    Edit JAMB Score
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live notice about chosen course cut-off */}
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
            }}
          >
            <span>
              Applying for: <strong>{chosenProgramme.level} {chosenProgramme.name}</strong>
            </span>
            <span
              style={{
                background: "#dbeafe",
                color: "#1e3a8a",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 700,
              }}
            >
              Required Cut-Off: {chosenProgramme.cutoffMark}
            </span>
          </div>
        )}

        <div className={form.grid}>
          <Field
            className={form.span2}
            label="JAMB registration number"
            required
            error={errors.registrationNumber?.message}
          >
            <Input
              {...register("registrationNumber")}
              placeholder="e.g. 20241234567AB"
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
              placeholder="e.g. 2024"
            />
          </Field>

          <Field
            label="JAMB score"
            required
            hint="Out of 400"
            error={errors.score?.message}
          >
            <Input
              type="number"
              inputMode="numeric"
              {...register("score")}
              placeholder="e.g. 245"
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
      </StepPanel>
    </form>
  );
}
