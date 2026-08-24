"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApplication } from "@/hooks/useApplication";
import { StepActions, StepPanel } from "@/components/application";
import { Field, Input, Textarea } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import { contactSchema, type ContactFormValues } from "@/schemas";
import form from "@/components/application/formLayout.module.css";

export default function ContactStep() {
  const router = useRouter();
  const { application, updateContact } = useApplication();
  const nav = stepNav("contact");
  const c = application.contact;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      phone: c?.phone ?? "",
      altPhone: c?.altPhone ?? "",
      email: c?.email ?? "",
      residentialAddress:
        c?.residentialAddress ?? application.personal?.residentialAddress ?? "",
      emergencyContactName: c?.emergencyContactName ?? "",
      emergencyContactPhone: c?.emergencyContactPhone ?? "",
      emergencyContactRelationship: c?.emergencyContactRelationship ?? "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    await updateContact(values);
    router.push(nav.nextHref);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepPanel
        title="Contact Information"
        description="How we reach you, and who to contact in an emergency."
        footer={<StepActions backHref={nav.prevHref} loading={isSubmitting} />}
      >
        <div className={form.grid}>
          <Field label="Phone number" required error={errors.phone?.message}>
            <Input
              type="tel"
              {...register("phone")}
              placeholder="e.g. 0803 000 0000"
            />
          </Field>
          <Field
            label="Alternate phone"
            error={errors.altPhone?.message}
          >
            <Input type="tel" {...register("altPhone")} placeholder="Optional" />
          </Field>
          <Field
            className={form.span2}
            label="Email address"
            required
            error={errors.email?.message}
          >
            <Input type="email" {...register("email")} placeholder="e.g. you@example.com" />
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

          <div className={form.span2}>
            <p className={form.sectionTitle}>Emergency contact</p>
            <p className={form.sectionSub}>
              A parent, guardian, or next of kin we can reach if needed.
            </p>
          </div>

          <Field
            label="Contact name"
            required
            error={errors.emergencyContactName?.message}
          >
            <Input {...register("emergencyContactName")} />
          </Field>
          <Field
            label="Contact phone"
            required
            error={errors.emergencyContactPhone?.message}
          >
            <Input type="tel" {...register("emergencyContactPhone")} />
          </Field>
          <Field
            className={form.span2}
            label="Relationship"
            required
            error={errors.emergencyContactRelationship?.message}
          >
            <Input
              {...register("emergencyContactRelationship")}
              placeholder="e.g. Parent, Guardian, Sibling"
            />
          </Field>
        </div>
      </StepPanel>
    </form>
  );
}
