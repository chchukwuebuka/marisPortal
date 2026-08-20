import { cn } from "@/lib/cn";
import styles from "./Spinner.module.css";

export function Spinner({
  size = 20,
  label = "Loading",
  className,
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(styles.spinner, className)}
      style={{ width: size, height: size }}
      role="status"
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className={styles.block}>
      <Spinner />
      <span className={styles.blockLabel}>{label}</span>
    </div>
  );
}
