"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApplication } from "@/hooks/useApplication";
import { StepActions, StepPanel } from "@/components/application";
import { Field, Input, Select } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import { JAMB_EXAM_TYPES } from "@/types/enums";
import {
  jambSchema,
  type JambFormValues,
  type JambInput,
} from "@/schemas";
import form from "@/components/application/formLayout.module.css";

export default function JambStep() {
  const router = useRouter();
  const { application, updateJamb } = useApplication();
  const nav = stepNav("jamb");
  const j = application.jamb;

  const {
    register,
    handleSubmit,
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

  async function onSubmit(values: JambFormValues) {
    await updateJamb(values);
    router.push(nav.nextHref);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepPanel
        title="JAMB Information"
        description="Provide your JAMB/UTME registration details exactly as they appear on your result slip."
        footer={
          <StepActions backHref={nav.prevHref} loading={isSubmitting} />
        }
      >
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
