"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CheckCircle2, MailCheck } from "lucide-react";
import { Alert, Button, Field, Input, LoadingBlock } from "@/components/ui";
import { resendVerification, verifyEmail } from "@/services/auth";
import { ApiError } from "@/lib/api";
import styles from "../auth.module.css";

const verifySchema = z.object({
  token: z.string().min(1, "Enter the verification token from your email"),
});

type VerifyValues = z.infer<typeof verifySchema>;
type Status = "idle" | "verifying" | "success" | "error";

function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const urlToken = searchParams.get("token");

  const [status, setStatus] = useState<Status>(urlToken ? "verifying" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [resend, setResend] = useState<"idle" | "sending" | "sent">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { token: urlToken ?? "" },
  });

  const runVerify = useCallback(async (token: string) => {
    setError(null);
    setStatus("verifying");
    try {
      await verifyEmail(token);
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "That verification link is invalid or has expired.",
      );
      setStatus("error");
    }
  }, []);

  // A verification link lands here with ?token=… — verify it automatically.
  // Legitimate mount-time async side-effect (syncing the URL token with the
  // server); the same rule is disabled for hydration in ApplicationProvider.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (urlToken) void runVerify(urlToken);
  }, [urlToken, runVerify]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function onResend() {
    if (!email) return;
    setResend("sending");
    try {
      await resendVerification(email);
      setResend("sent");
    } catch {
      setResend("idle");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.card}>
        <div className={styles.sent}>
          <span className={styles.sentIcon}>
            <CheckCircle2 size={26} />
          </span>
          <h2 className={styles.title}>Email verified</h2>
          <p className={styles.sentText}>
            Your email has been confirmed. You can now sign in and continue your
            application.
          </p>
          <Button href="/login" rightIcon={<ArrowRight size={16} />}>
            Continue to sign in
          </Button>
        </div>
      </div>
    );
  }

  if (status === "verifying" && urlToken) {
    return (
      <div className={styles.card}>
        <div className={styles.head}>
          <h2 className={styles.title}>Verifying your email…</h2>
        </div>
        <LoadingBlock label="Confirming your verification link…" />
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Confirm your email</h2>
        <p className={styles.subtitle}>
          We&rsquo;ve sent a verification link to{" "}
          <strong>{email || "your email"}</strong>. Open it to confirm your
          account — or paste the token from that email below.
        </p>
      </div>

      {error && (
        <Alert tone="error" className={styles.demoNote}>
          {error}
        </Alert>
      )}

      <form
        className={styles.form}
        onSubmit={handleSubmit((v) => runVerify(v.token))}
        noValidate
      >
        <Field
          label="Verification token"
          error={errors.token?.message}
          required
        >
          <Input
            autoComplete="one-time-code"
            placeholder="Paste your verification token"
            {...register("token")}
          />
        </Field>

        <Button
          type="submit"
          fullWidth
          loading={isSubmitting || status === "verifying"}
          leftIcon={<CheckCircle2 size={16} />}
          className={styles.submit}
        >
          Verify email
        </Button>
      </form>

      <p className={styles.switch}>
        {resend === "sent" ? (
          <span className={styles.resendSent}>
            <MailCheck size={15} /> A new verification email is on its way.
          </span>
        ) : email ? (
          <>
            Didn&rsquo;t receive it?{" "}
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => void onResend()}
              disabled={resend === "sending"}
            >
              {resend === "sending" ? "Sending…" : "Resend email"}
            </button>
          </>
        ) : (
          <>
            Already verified? <Link href="/login">Sign in</Link>
          </>
        )}
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}
