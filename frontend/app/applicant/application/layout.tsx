"use client";

import { usePathname } from "next/navigation";
import { useApplication } from "@/hooks/useApplication";
import { LoadingBlock, ProgressBar, Stepper, type StepperItem } from "@/components/ui";
import { APPLICATION_STEPS, stepPath } from "@/lib/constants";
import styles from "./layout.module.css";

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { application, stepStatus, completedCount, progress, hydrated } =
    useApplication();
  const pathname = usePathname();

  if (!hydrated) {
    return <LoadingBlock label="Loading your application…" />;
  }

  const items: StepperItem[] = APPLICATION_STEPS.map((step) => {
    const href = stepPath(step.key);
    const current = pathname === href;
    return {
      label: step.label,
      short: step.short,
      href,
      status: current
        ? "current"
        : stepStatus[step.key]
          ? "complete"
          : "incomplete",
    };
  });

  return (
    <div>
      <div className={styles.head}>
        <div className={styles.headTop}>
          <div>
            <p className={styles.eyebrow}>Application</p>
            <p className={styles.appNo}>
              {application.applicationNumber ?? "Draft — not yet submitted"}
            </p>
          </div>
          <p className={styles.count}>
            {completedCount} of {APPLICATION_STEPS.length} sections complete
          </p>
        </div>
        <ProgressBar value={progress} />
      </div>

      <div className={styles.grid}>
        <aside className={styles.stepperCol}>
          <div className={styles.stepperSticky}>
            <Stepper items={items} orientation="vertical" />
          </div>
        </aside>

        <div className={styles.mobileStepper}>
          <Stepper items={items} orientation="horizontal" />
        </div>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
