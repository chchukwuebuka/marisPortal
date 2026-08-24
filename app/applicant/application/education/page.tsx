"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { EducationRow, StepActions, StepPanel } from "@/components/application";
import { Alert, Button, Field, Input } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import { educationSchema, type EducationFormValues, type EducationInput } from "@/schemas";
import form from "@/components/application/formLayout.module.css";
import styles from "./education.module.css";

export default function EducationStep() {
  const router = useRouter();
  const { application, addEducation, deleteEducation, setEducation } = useApplication();
  const nav = stepNav("education");
  const records = application.education;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EducationInput, unknown, EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: "",
      qualification: "",
      startYear: "",
      endYear: "",
    },
  });

  async function onAdd(values: EducationFormValues) {
    try {
      await addEducation(values);
    } catch {
      // Fallback local update if offline or pending
      const tempId = `edu-${Date.now()}`;
      setEducation([...records, { id: tempId, ...values }]);
    }
    reset();
  }

  async function onRemove(id: string) {
    try {
      await deleteEducation(id);
    } catch {
      setEducation(records.filter((r) => r.id !== id));
    }
  }

  return (
    <StepPanel
      title="Educational Background"
      description="List the secondary or post-secondary institutions you have attended."
      footer={
        <StepActions
          backHref={nav.prevHref}
          onContinue={() => router.push(nav.nextHref)}
          submitDisabled={records.length === 0}
        />
      }
    >
      {records.length > 0 ? (
        <div className={styles.list}>
          {records.map((r) => (
            <EducationRow key={r.id} record={r} onRemove={() => onRemove(r.id)} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyWrap}>
          <Alert tone="info" title="No institutions added yet">
            Add at least one institution using the form below to continue.
          </Alert>
        </div>
      )}

      <hr className={form.divider} />

      <form onSubmit={handleSubmit(onAdd)} noValidate>
        <p className={form.sectionTitle}>Add an institution</p>
        <div className={form.grid} style={{ marginTop: 12 }}>
          <Field
            className={form.span2}
            label="Institution name"
            required
            error={errors.institution?.message}
          >
            <Input
              {...register("institution")}
              placeholder="e.g. Government Secondary School, Ikeja"
            />
          </Field>
          <Field
            className={form.span2}
            label="Qualification obtained"
            required
            error={errors.qualification?.message}
          >
            <Input
              {...register("qualification")}
              placeholder="e.g. Senior Secondary Certificate (SSCE)"
            />
          </Field>
          <Field label="Start year" required error={errors.startYear?.message}>
            <Input
              type="number"
              inputMode="numeric"
              {...register("startYear")}
              placeholder="e.g. 2016"
            />
          </Field>
          <Field label="End year" required error={errors.endYear?.message}>
            <Input
              type="number"
              inputMode="numeric"
              {...register("endYear")}
              placeholder="e.g. 2022"
            />
          </Field>
        </div>
        <div className={styles.addAction}>
          <Button
            type="submit"
            variant="secondary"
            loading={isSubmitting}
            leftIcon={<Plus size={16} />}
          >
            Add institution
          </Button>
        </div>
      </form>
    </StepPanel>
  );
}
