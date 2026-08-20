"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./controls.module.css";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ className, label, hint, ...rest }, ref) {
    return (
      <label className={cn(styles.checkbox, className)}>
        <input ref={ref} type="checkbox" {...rest} />
        {(label || hint) && (
          <span className={styles.checkboxBody}>
            {label && <span className={styles.checkboxLabel}>{label}</span>}
            {hint && <span className={styles.checkboxHint}>{hint}</span>}
          </span>
        )}
      </label>
    );
  },
);
