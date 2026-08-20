"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, GraduationCap, Layers } from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { StepActions, StepPanel } from "@/components/application";
import { Alert, Field, Select } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import {
  findActiveSession,
  findProgramme,
  listDepartments,
  listProgrammes,
  listSchools,
} from "@/services";
import { programmeSchema, type ProgrammeFormValues } from "@/schemas";
import form from "@/components/application/formLayout.module.css";
import styles from "./programme.module.css";

export default function ProgrammeStep() {
  const router = useRouter();
  const { application, updateProgramme } = useApplication();
  const nav = stepNav("programme");
  const sel = application.programme;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProgrammeFormValues>({
    resolver: zodResolver(programmeSchema),
    defaultValues: {
      schoolId: sel?.schoolId ?? "",
      departmentId: sel?.departmentId ?? "",
      programmeId: sel?.programmeId ?? "",
    },
  });

  const schoolId = useWatch({ control, name: "schoolId" });
  const departmentId = useWatch({ control, name: "departmentId" });
  const programmeId = useWatch({ control, name: "programmeId" });

  const departments = listDepartments(schoolId);
  const programmes = listProgrammes(departmentId);
  const selectedProgramme = findProgramme(programmeId);
  const notAccepting =
    !!selectedProgramme && !selectedProgramme.acceptingApplications;

  const schoolReg = register("schoolId");
  const deptReg = register("departmentId");

  function onSubmit(values: ProgrammeFormValues) {
    const programme = findProgramme(values.programmeId);
    if (programme && !programme.acceptingApplications) return;
    updateProgramme({ ...values, sessionId: findActiveSession().id });
    router.push(nav.nextHref);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepPanel
        title="Programme Selection"
        description="Choose the school, department, and programme you are applying to."
        footer={
          <StepActions
            backHref={nav.prevHref}
            loading={isSubmitting}
            submitDisabled={notAccepting}
          />
        }
      >
        <div className={form.grid}>
          <Field
            className={form.span2}
            label="School / Faculty"
            required
            error={errors.schoolId?.message}
          >
            <Select
              {...schoolReg}
              placeholder="Select a school"
              onChange={(e) => {
                schoolReg.onChange(e);
                setValue("departmentId", "");
                setValue("programmeId", "");
              }}
              options={listSchools().map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />
          </Field>

          <Field
            label="Department"
            required
            error={errors.departmentId?.message}
          >
            <Select
              {...deptReg}
              placeholder="Select a department"
              disabled={!schoolId}
              onChange={(e) => {
                deptReg.onChange(e);
                setValue("programmeId", "");
              }}
              options={departments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
          </Field>

          <Field
            label="Programme"
            required
            error={errors.programmeId?.message}
          >
            <Select
              {...register("programmeId")}
              placeholder="Select a programme"
              disabled={!departmentId}
              options={programmes.map((prog) => ({
                value: prog.id,
                label: `${prog.level} — ${prog.name}`,
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
                <p className={styles.detailValue}>{selectedProgramme.name}</p>
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
