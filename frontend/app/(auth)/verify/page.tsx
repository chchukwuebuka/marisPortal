"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import styles from "../auth.module.css";

const verifySchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits").regex(/^\d+$/, "Code must contain only numbers"),
});

type VerifyValues = z.infer<typeof verifySchema>;

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });

  async function onSubmit(values: VerifyValues) {
    // Mock verification: delay, then go to dashboard.
    await new Promise((r) => setTimeout(r, 700));
    router.push("/applicant/dashboard");
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Confirm your email</h2>
        <p className={styles.subtitle}>
          We've sent a 6-digit confirmation code to <strong>{email || "your email"}</strong>.
          Enter it below to confirm your account.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Confirmation code" error={errors.code?.message} required>
          <Input
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            {...register("code")}
          />
        </Field>

        <Button
          type="submit"
          fullWidth
          loading={isSubmitting}
          leftIcon={<CheckCircle2 size={16} />}
          className={styles.submit}
        >
          Verify email
        </Button>
      </form>

      <p className={styles.switch}>
        Didn't receive the code? <Link href="#">Resend code</Link>
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
