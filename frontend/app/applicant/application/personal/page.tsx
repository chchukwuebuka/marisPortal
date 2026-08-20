"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApplication } from "@/hooks/useApplication";
import { StepActions, StepPanel } from "@/components/application";
import { Field, Input, Select, Textarea } from "@/components/ui";
import {
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  NIGERIAN_STATES,
} from "@/lib/constants";
import { stepNav } from "@/lib/flow";
import { GENDERS, MARITAL_STATUSES } from "@/types/enums";
import { personalSchema, type PersonalFormValues } from "@/schemas";
import form from "@/components/application/formLayout.module.css";

export default function PersonalStep() {
  const router = useRouter();
  const { application, applicant, updatePersonal } = useApplication();
  const nav = stepNav("personal");
  const p = application.personal;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonalFormValues>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      firstName: p?.firstName ?? applicant.firstName ?? "",
      middleName: p?.middleName ?? "",
      lastName: p?.lastName ?? applicant.lastName ?? "",
      dateOfBirth: p?.dateOfBirth ?? "",
      gender: p?.gender,
      nationality: p?.nationality ?? "Nigerian",
      stateOfOrigin: p?.stateOfOrigin ?? "",
      lga: p?.lga ?? "",
      maritalStatus: p?.maritalStatus,
      residentialAddress: p?.residentialAddress ?? "",
    },
  });

  function onSubmit(values: PersonalFormValues) {
    updatePersonal(values);
    router.push(nav.nextHref);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepPanel
        title="Personal Information"
        description="Tell us who you are. Use your names exactly as they appear on your certificates."
        footer={<StepActions backHref={nav.prevHref} loading={isSubmitting} />}
      >
        <div className={form.grid}>
          <Field label="First name" required error={errors.firstName?.message}>
            <Input {...register("firstName")} placeholder="e.g. John" />
          </Field>
          <Field label="Middle name" error={errors.middleName?.message}>
            <Input {...register("middleName")} placeholder="Optional" />
          </Field>
          <Field label="Last name" required error={errors.lastName?.message}>
            <Input {...register("lastName")} placeholder="e.g. Doe" />
          </Field>
          <Field
            label="Date of birth"
            required
            error={errors.dateOfBirth?.message}
          >
            <Input type="date" {...register("dateOfBirth")} />
          </Field>
          <Field label="Gender" required error={errors.gender?.message}>
            <Select
              {...register("gender")}
              placeholder="Select gender"
              options={GENDERS.map((g) => ({
                value: g,
                label: GENDER_LABELS[g],
              }))}
            />
          </Field>
          <Field
            label="Marital status"
            required
            error={errors.maritalStatus?.message}
          >
            <Select
              {...register("maritalStatus")}
              placeholder="Select status"
              options={MARITAL_STATUSES.map((m) => ({
                value: m,
                label: MARITAL_STATUS_LABELS[m],
              }))}
            />
          </Field>
          <Field
            label="Nationality"
            required
            error={errors.nationality?.message}
          >
            <Input {...register("nationality")} />
          </Field>
          <Field
            label="State of origin"
            required
            error={errors.stateOfOrigin?.message}
          >
            <Select
              {...register("stateOfOrigin")}
              placeholder="Select state"
              options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
            />
          </Field>
          <Field
            label="Local Government Area"
            required
            error={errors.lga?.message}
          >
            <Input {...register("lga")} placeholder="e.g. Ikeja" />
          </Field>
          <Field
            className={form.span2}
            label="Residential address"
            required
            error={errors.residentialAddress?.message}
          >
            <Textarea
              {...register("residentialAddress")}
              placeholder="House number, street, city, state"
            />
          </Field>
        </div>
      </StepPanel>
    </form>
  );
}
