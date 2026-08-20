"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { DRAFT_STORAGE_KEY } from "@/lib/constants";
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

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
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
    // Clear any existing application draft so the new user starts fresh
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    
    // Mock registration: delay, then go to verification.
    await new Promise((r) => setTimeout(r, 700));
    const searchParams = new URLSearchParams({ email: values.email });
    router.push(`/verify?${searchParams.toString()}`);
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Create your account</h2>
        <p className={styles.subtitle}>
          Register to start your application to Marist Polytechnic.
        </p>
      </div>

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
