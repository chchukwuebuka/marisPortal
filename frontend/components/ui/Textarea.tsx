"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./controls.module.css";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, rows = 4, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(styles.textarea, className)}
        {...rest}
      />
    );
  },
);
