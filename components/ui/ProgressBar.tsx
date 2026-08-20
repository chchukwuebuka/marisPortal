import { cn } from "@/lib/cn";
import { clampPercent } from "@/lib/format";
import styles from "./ProgressBar.module.css";

export function ProgressBar({
  value,
  showLabel = false,
  className,
}: {
  value: number;
  showLabel?: boolean;
  className?: string;
}) {
  const pct = clampPercent(value);
  return (
    <div className={cn(styles.wrap, className)}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className={cn(styles.label, "tnum")}>{pct}%</span>}
    </div>
  );
}
