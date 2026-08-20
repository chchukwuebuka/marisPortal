"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

function classes(
  variant: Variant,
  size: Size,
  fullWidth: boolean,
  className?: string,
) {
  return cn(
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth && styles.full,
    className,
  );
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    className,
    ...rest
  } = props;

  const content = (
    <>
      {loading ? (
        <Loader2 className={styles.spinner} size={16} aria-hidden />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </>
  );

  const cls = classes(variant, size, fullWidth, className);

  if (props.href !== undefined) {
    // `href` is passed explicitly below; strip it from the spread rest.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { href, ...anchorRest } =
      rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <Link href={props.href} className={cls} {...anchorRest}>
        {content}
      </Link>
    );
  }

  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      className={cls}
      disabled={loading || buttonRest.disabled}
      {...buttonRest}
    >
      {content}
    </button>
  );
}
