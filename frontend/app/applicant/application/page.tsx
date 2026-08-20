import { redirect } from "next/navigation";

/**
 * /applicant/application has no content of its own — the stepper lives in
 * child routes. Redirect to the first step so the sidebar link works.
 */
export default function ApplicationIndexPage() {
  redirect("/applicant/application/personal");
}
