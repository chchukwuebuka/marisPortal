import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./Stepper.module.css";

export interface StepperItem {
  label: string;
  short?: string;
  href: string;
  status: "complete" | "current" | "incomplete";
}

export function Stepper({
  items,
  orientation = "vertical",
}: {
  items: StepperItem[];
  orientation?: "vertical" | "horizontal";
}) {
  return (
    <ol className={cn(styles.list, styles[orientation])}>
      {items.map((item, i) => (
        <li
          key={item.href}
          className={cn(styles.item, styles[item.status])}
          aria-current={item.status === "current" ? "step" : undefined}
        >
          <Link href={item.href} className={styles.link}>
            <span className={styles.marker}>
              {item.status === "complete" ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <span className={styles.num}>{i + 1}</span>
              )}
            </span>
            <span className={styles.labels}>
              <span className={styles.label}>{item.label}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
