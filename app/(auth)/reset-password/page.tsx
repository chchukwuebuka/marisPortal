"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, KeyRound } from "lucide-react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { confirmPasswordReset } from "@/services/auth";
import { ApiError } from "@/lib/api";
import styles from "../auth.module.css";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof resetSchema>;

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetValues) {
    setFormError(null);
    if (!token) {
      setFormError(
        "This reset link is missing its token. Please use the link from your email, or request a new one.",
      );
      return;
    }
    try {
      await confirmPasswordReset(token, values.password, values.confirmPassword);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        const pw = err.fields.password ?? err.fields.password2;
        const tok = err.fields.token;
        if (pw?.length) setError("password", { message: pw.join(" ") });
        if (tok?.length) setFormError(tok.join(" "));
        if (pw?.length || tok?.length) return;
      }
      setFormError(
        err instanceof ApiError
          ? err.message
          : "We couldn't reset your password. The link may have expired.",
      );
    }
  }

  if (done) {
    return (
      <div className={styles.card}>
        <div className={styles.sent}>
          <span className={styles.sentIcon}>
            <KeyRound size={26} />
          </span>
          <h2 className={styles.title}>Password updated</h2>
          <p className={styles.sentText}>
            Your password has been changed. You can now sign in with your new
            password.
          </p>
          <Button href="/login" rightIcon={<ArrowRight size={16} />}>
            Continue to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Set a new password</h2>
        <p className={styles.subtitle}>
          Choose a new password for your account.
        </p>
      </div>

      {formError && (
        <Alert tone="error" className={styles.demoNote}>
          {formError}
        </Alert>
      )}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field
          label="New password"
          error={errors.password?.message}
          hint="At least 8 characters."
          required
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Create a new password"
            {...register("password")}
          />
        </Field>

        <Field
          label="Confirm new password"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            {...register("confirmPassword")}
          />
        </Field>

        <Button
          type="submit"
          fullWidth
          loading={isSubmitting}
          leftIcon={<KeyRound size={16} />}
          className={styles.submit}
        >
          Reset password
        </Button>
      </form>

      <p className={styles.switch}>
        Remembered it? <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetForm />
    </Suspense>
  );
}
