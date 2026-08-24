"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn } from "lucide-react";
import { Alert, Button, Checkbox, Field, Input } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import styles from "../auth.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .regex(EMAIL_RE, "Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    setUnverifiedEmail(null);
    try {
      await login(values.email, values.password);
      router.replace("/applicant/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "We couldn't sign you in. Please try again.";
      // A common cause is an unverified email — offer a way forward.
      if (/verif/i.test(message)) setUnverifiedEmail(values.email);
      setFormError(message);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>
          Sign in to continue your application.
        </p>
      </div>

      {formError && (
        <Alert tone="error" className={styles.demoNote}>
          {formError}
          {unverifiedEmail && (
            <>
              {" "}
              <Link
                href={`/verify?email=${encodeURIComponent(unverifiedEmail)}`}
                className={styles.link}
              >
                Verify your email
              </Link>
              .
            </>
          )}
        </Alert>
      )}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Email address" error={errors.email?.message} required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </Field>

        <Field label="Password" error={errors.password?.message} required>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            {...register("password")}
          />
        </Field>

        <div className={styles.metaRow}>
          <Checkbox label="Remember me" {...register("remember")} />
          <Link href="/forgot-password" className={styles.link}>
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={isSubmitting}
          leftIcon={<LogIn size={16} />}
          className={styles.submit}
        >
          Sign in
        </Button>
      </form>

      <p className={styles.switch}>
        New to Marist Polytechnic? <Link href="/register">Create an account</Link>
      </p>
    </div>
  );
}
