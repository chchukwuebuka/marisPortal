import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/constants";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONE,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_TONE,
} from "@/lib/constants";
import type { ApplicationStatus, DocumentStatus } from "@/types/enums";
import styles from "./Badge.module.css";

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(styles.badge, styles[tone], className)}>{children}</span>
  );
}

/** Badge with a leading status dot. */
export function StatusTag({
  tone = "neutral",
  label,
}: {
  tone?: Tone;
  label: React.ReactNode;
}) {
  return (
    <span className={cn(styles.badge, styles[tone])}>
      <span className={styles.dot} aria-hidden />
      {label}
    </span>
  );
}

export function AppStatusTag({ status }: { status: ApplicationStatus }) {
  return (
    <StatusTag
      tone={APPLICATION_STATUS_TONE[status]}
      label={APPLICATION_STATUS_LABELS[status]}
    />
  );
}

export function DocStatusTag({ status }: { status: DocumentStatus }) {
  return (
    <StatusTag
      tone={DOCUMENT_STATUS_TONE[status]}
      label={DOCUMENT_STATUS_LABELS[status]}
    />
  );
}
