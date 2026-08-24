"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { requestPasswordReset } from "@/services/auth";
import { ApiError } from "@/lib/api";
import styles from "../auth.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .regex(EMAIL_RE, "Enter a valid email address"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotValues) {
    setFormError(null);
    try {
      await requestPasswordReset(values.email);
      setSentTo(values.email);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "We couldn't send the reset link. Please try again.",
      );
    }
  }

  if (sentTo) {
    return (
      <div className={styles.card}>
        <div className={styles.sent}>
          <span className={styles.sentIcon}>
            <MailCheck size={26} />
          </span>
          <h2 className={styles.title}>Check your email</h2>
          <p className={styles.sentText}>
            If an account exists for{" "}
            <span className={styles.sentEmail}>{sentTo}</span>, we&rsquo;ve sent
            a link to reset your password.
          </p>
          <Button href="/login" variant="outline" leftIcon={<ArrowLeft size={16} />}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Reset your password</h2>
        <p className={styles.subtitle}>
          Enter your email and we&rsquo;ll send you a link to reset your
          password.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <Alert tone="error" className={styles.demoNote}>
            {formError}
          </Alert>
        )}
        <Field label="Email address" error={errors.email?.message} required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </Field>

        <Button
          type="submit"
          fullWidth
          loading={isSubmitting}
          leftIcon={<Send size={16} />}
          className={styles.submit}
        >
          Send reset link
        </Button>
      </form>

      <p className={styles.switch}>
        Remembered it? <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
