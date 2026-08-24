"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  PartyPopper,
  XCircle,
} from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { useCatalogue } from "@/hooks/useCatalogue";
import { AppStatusTag, Alert, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { stepPath } from "@/lib/constants";
import {
  areDocumentsComplete,
  isContactComplete,
  isEducationComplete,
  isJambComplete,
  isOlevelComplete,
  isPersonalComplete,
  isProgrammeComplete,
  isReviewComplete,
} from "@/lib/completeness";
import styles from "./submit.module.css";

export default function SubmitStep() {
  const { application, submitApplication } = useApplication();
  const { getRequirementsForProgramme } = useCatalogue();
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const requirements = getRequirementsForProgramme(application.programme?.programmeId);

  const submitted =
    Boolean(application.applicationNumber) &&
    application.status !== "draft" &&
    application.status !== "correction_required";

  const items = [
    {
      label: "Personal information",
      ok: isPersonalComplete(application),
      href: stepPath("personal"),
    },
    {
      label: "Contact information",
      ok: isContactComplete(application),
      href: stepPath("contact"),
    },
    {
      label: "Programme selection",
      ok: isProgrammeComplete(application),
      href: stepPath("programme"),
    },
    {
      label: "Educational background",
      ok: isEducationComplete(application),
      href: stepPath("education"),
    },
    {
      label: "O'Level results (5+ subjects incl. English & Mathematics)",
      ok: isOlevelComplete(application),
      href: stepPath("olevel"),
    },
    {
      label: "JAMB information",
      ok: isJambComplete(application),
      href: stepPath("jamb"),
    },
    {
      label: "Required documents uploaded",
      ok: areDocumentsComplete(application, requirements),
      href: stepPath("documents"),
    },
    {
      label: "Declaration confirmed",
      ok: isReviewComplete(application),
      href: stepPath("review"),
    },
  ];

  const canSubmit = items.every((i) => i.ok);

  async function handleSubmit() {
    setAttempted(true);
    setSubmitError(null);
    setSubmitting(true);
    const res = await submitApplication();
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.errors.join(" "));
    }
  }

  if (submitted) {
    return (
      <div className={styles.success}>
        <span className={styles.successIcon}>
          <PartyPopper size={30} />
        </span>
        <h2 className={styles.successTitle}>Application submitted</h2>
        <p className={styles.successText}>
          Your application has been received and is now queued for review by the
          admissions office. Keep your application number safe — you will need
          it for all correspondence.
        </p>
        <div className={styles.numberBox}>
          <span className={styles.numberLabel}>Application number</span>
          <span className={styles.number}>{application.applicationNumber}</span>
        </div>
        <div className={styles.successStatus}>
          <AppStatusTag status={application.status} />
        </div>
        <div className={styles.successActions}>
          <Button href="/applicant/status">Track application status</Button>
          <Button href="/applicant/dashboard" variant="outline">
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Before you submit</h2>
          <p className={styles.panelDesc}>
            Every item below must be complete before your application can be
            submitted for review. Submission is final — you will not be able to
            edit your application afterwards.
          </p>
        </div>

        <ul className={styles.checklist}>
          {items.map((item) => (
            <li key={item.label} className={styles.item}>
              <span
                className={cn(
                  styles.icon,
                  item.ok ? styles.iconOk : styles.iconBad,
                )}
              >
                {item.ok ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </span>
              <span className={styles.itemLabel}>{item.label}</span>
              {!item.ok && (
                <Link href={item.href} className={styles.fix}>
                  Fix
                </Link>
              )}
            </li>
          ))}
        </ul>

        {(attempted && !canSubmit) && (
          <div className={styles.alert}>
            <Alert tone="error" title="Some items still need attention">
              Resolve every item marked above, then submit again.
            </Alert>
          </div>
        )}

        {submitError && (
          <div className={styles.alert}>
            <Alert tone="error" title="Submission failed">
              {submitError}
            </Alert>
          </div>
        )}

        <div className={styles.footer}>
          <Button
            href={stepPath("review")}
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to review
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
            Submit application
          </Button>
        </div>
      </div>
    </div>
  );
}
