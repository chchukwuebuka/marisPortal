import clsx, { type ClassValue } from "clsx";

/**
 * Combine class names conditionally.
 * With CSS Modules there are no utility-class conflicts to resolve,
 * so plain clsx is sufficient (no tailwind-merge needed).
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
