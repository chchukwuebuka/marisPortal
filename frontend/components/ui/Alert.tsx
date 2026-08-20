import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./Alert.module.css";

type AlertTone = "info" | "success" | "warning" | "error";

const ICONS: Record<AlertTone, React.ComponentType<{ size?: number }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = ICONS[tone];
  return (
    <div className={cn(styles.alert, styles[tone], className)} role="alert">
      <span className={styles.icon}>
        <Icon size={18} />
      </span>
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <div className={styles.body}>{children}</div>}
      </div>
    </div>
  );
}
