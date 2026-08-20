"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Plus, X } from "lucide-react";
import type { OLevelResult } from "@/types/domain";
import type { ExamType } from "@/types/enums";
import { EXAM_TYPES, OLEVEL_GRADES } from "@/types/enums";
import { OLEVEL_SUBJECTS } from "@/lib/constants";
import { Button, Field, Input, Select } from "@/components/ui";
import { olevelSubjectSchema, type OlevelSubjectFormValues } from "@/schemas";
import { SubjectRow } from "./SubjectRow";
import form from "./formLayout.module.css";
import styles from "./SittingCard.module.css";

const CURRENT_YEAR = new Date().getFullYear();

interface SittingCardProps {
  index: number;
  sitting: OLevelResult;
  onChangeMeta: (patch: Partial<OLevelResult>) => void;
  onAddSubject: (values: OlevelSubjectFormValues) => void;
  onRemoveSubject: (subjectId: string) => void;
}

export function SittingCard({
  index,
  sitting,
  onChangeMeta,
  onAddSubject,
  onRemoveSubject,
}: SittingCardProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<OlevelSubjectFormValues>({
    resolver: zodResolver(olevelSubjectSchema),
    defaultValues: { subject: "" },
  });

  const names = sitting.subjects.map((s) => s.subject.toLowerCase());
  const count = sitting.subjects.length;
  const hasEnglish = names.includes("english language");
  const hasMaths = names.includes("mathematics");

  const available = OLEVEL_SUBJECTS.filter(
    (s) => !sitting.subjects.some((x) => x.subject === s),
  );

  function onAdd(values: OlevelSubjectFormValues) {
    if (names.includes(values.subject.toLowerCase())) {
      setError("subject", { message: "This subject has already been added" });
      return;
    }
    if (count >= 9) {
      setError("subject", { message: "You can enter at most 9 subjects" });
      return;
    }
    onAddSubject(values);
    reset();
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h3 className={styles.title}>Sitting {index + 1}</h3>
      </div>

      <div className={form.grid}>
        <Field label="Examination type" required>
          <Select
            placeholder="Select exam body"
            value={sitting.examType ?? ""}
            onChange={(e) =>
              onChangeMeta({ examType: e.target.value as ExamType })
            }
            options={EXAM_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </Field>

        <Field label="Examination year" required>
          <Input
            type="number"
            inputMode="numeric"
            min={1990}
            max={CURRENT_YEAR}
            placeholder="e.g. 2024"
            value={sitting.examYear ? String(sitting.examYear) : ""}
            onChange={(e) =>
              onChangeMeta({ examYear: Number(e.target.value) || 0 })
            }
          />
        </Field>

        <Field label="Examination number" required>
          <Input
            placeholder="e.g. 4250101234"
            value={sitting.examNumber ?? ""}
            onChange={(e) => onChangeMeta({ examNumber: e.target.value })}
          />
        </Field>

        <Field label="Examination centre" required>
          <Input
            placeholder="e.g. Marist College, Uturu"
            value={sitting.examCentre ?? ""}
            onChange={(e) => onChangeMeta({ examCentre: e.target.value })}
          />
        </Field>
      </div>

      <hr className={form.divider} />

      <div className={styles.subjectsHead}>
        <p className={form.sectionTitle}>Subjects &amp; grades</p>
        <ul className={styles.checks}>
          <li className={count >= 5 ? styles.ok : styles.pending}>
            {count >= 5 ? <Check size={14} /> : <X size={14} />}
            {count}/5 minimum
          </li>
          <li className={hasEnglish ? styles.ok : styles.pending}>
            {hasEnglish ? <Check size={14} /> : <X size={14} />}
            English Language
          </li>
          <li className={hasMaths ? styles.ok : styles.pending}>
            {hasMaths ? <Check size={14} /> : <X size={14} />}
            Mathematics
          </li>
        </ul>
      </div>

      {sitting.subjects.length > 0 && (
        <div className={styles.subjectList}>
          {sitting.subjects.map((s) => (
            <SubjectRow
              key={s.id}
              subject={s}
              onRemove={() => onRemoveSubject(s.id)}
            />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onAdd)} noValidate className={styles.adder}>
        <Field
          className={styles.adderSubject}
          label="Subject"
          error={errors.subject?.message}
        >
          <Select
            {...register("subject")}
            placeholder="Select a subject"
            options={available.map((s) => ({ value: s, label: s }))}
          />
        </Field>
        <Field
          className={styles.adderGrade}
          label="Grade"
          error={errors.grade?.message}
        >
          <Select
            {...register("grade")}
            placeholder="Grade"
            options={OLEVEL_GRADES.map((g) => ({ value: g, label: g }))}
          />
        </Field>
        <Button
          type="submit"
          variant="secondary"
          leftIcon={<Plus size={16} />}
          className={styles.adderBtn}
        >
          Add
        </Button>
      </form>
    </div>
  );
}
