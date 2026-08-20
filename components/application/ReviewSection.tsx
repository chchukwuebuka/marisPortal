import Link from "next/link";
import { Check, Pencil, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./ReviewSection.module.css";

export function ReviewSection({
  title,
  editHref,
  complete,
  children,
}: {
  title: string;
  editHref: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div className={styles.titleWrap}>
          <span
            className={cn(styles.status, complete ? styles.ok : styles.warn)}
            aria-hidden
          >
            {complete ? <Check size={13} /> : <AlertCircle size={13} />}
          </span>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <Link href={editHref} className={styles.edit}>
          <Pencil size={14} />
          Edit
        </Link>
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}

export function ReviewRow({
  label,
  value,
  wide,
}: {
  label: string;
  value?: React.ReactNode;
  wide?: boolean;
}) {
  const empty = value == null || value === "";
  return (
    <div className={cn(styles.row, wide && styles.rowWide)}>
      <p className={styles.label}>{label}</p>
      <div className={cn(styles.value, empty && styles.muted)}>
        {empty ? "—" : value}
      </div>
    </div>
  );
}
