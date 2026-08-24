"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { Alert, Button, Checkbox, Field, Input } from "@/components/ui";
import { register as registerAccount } from "@/services/auth";
import { ApiError } from "@/lib/api";
import styles from "../auth.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .regex(EMAIL_RE, "Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    agree: z.boolean().refine((v) => v === true, {
      error: "You must accept the terms to continue",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

/** Map DRF field-error keys back onto the form's field names. */
const FIELD_MAP: Record<string, keyof RegisterValues> = {
  email: "email",
  password: "password",
  password2: "confirmPassword",
  first_name: "firstName",
  last_name: "lastName",
};

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agree: false,
    },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      await registerAccount({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        password2: values.confirmPassword,
      });
      const searchParams = new URLSearchParams({ email: values.email });
      router.push(`/verify?${searchParams.toString()}`);
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        let mappedAny = false;
        for (const [key, messages] of Object.entries(err.fields)) {
          const field = FIELD_MAP[key];
          if (field && messages.length) {
            setError(field, { message: messages.join(" ") });
            mappedAny = true;
          }
        }
        if (mappedAny) return;
      }
      setFormError(
        err instanceof ApiError
          ? err.message
          : "We couldn't create your account. Please try again.",
      );
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Create your account</h2>
        <p className={styles.subtitle}>
          Register to start your application to Marist Polytechnic.
        </p>
      </div>

      {formError && (
        <Alert tone="error" className={styles.demoNote}>
          {formError}
        </Alert>
      )}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.row}>
          <Field label="First name" error={errors.firstName?.message} required>
            <Input
              autoComplete="given-name"
              placeholder="First name"
              {...register("firstName")}
            />
          </Field>
          <Field label="Last name" error={errors.lastName?.message} required>
            <Input
              autoComplete="family-name"
              placeholder="Last name"
              {...register("lastName")}
            />
          </Field>
        </div>

        <Field label="Email address" error={errors.email?.message} required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </Field>

        <Field
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters."
          required
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            {...register("password")}
          />
        </Field>

        <Field
          label="Confirm password"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            {...register("confirmPassword")}
          />
        </Field>

        <Field error={errors.agree?.message}>
          <Checkbox
            label="I agree to the Terms of Use and Privacy Policy"
            {...register("agree")}
          />
        </Field>

        <Button
          type="submit"
          fullWidth
          loading={isSubmitting}
          leftIcon={<UserPlus size={16} />}
          className={styles.submit}
        >
          Create account
        </Button>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
