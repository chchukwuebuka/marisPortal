"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronRight,
} from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { useCatalogue } from "@/hooks/useCatalogue";
import { PageHeader } from "@/components/layout";
import {
  AppStatusTag,
  Button,
  Card,
  CardBody,
  CardHeader,
  LoadingBlock,
  ProgressBar,
  StatusTag,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { APPLICATION_STEPS, stepPath } from "@/lib/constants";
import { getNextAction } from "@/lib/flow";
import { formatDate } from "@/lib/format";
import styles from "./dashboard.module.css";

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className={styles.sumRow}>
      <span className={styles.sumLabel}>{label}</span>
      <span className={cn(styles.sumValue, mono && styles.sumValueMono)}>
        {value}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const {
    applicant,
    application,
    stepStatus,
    completedCount,
    progress,
    paid,
    hydrated,
  } = useApplication();
  const { findActiveSession, findDepartment, findProgramme, findSession } =
    useCatalogue();

  if (!hydrated) {
    return <LoadingBlock label="Loading your application…" />;
  }

  const next = getNextAction(application, stepStatus, paid);
  const programme = findProgramme(application.programme?.programmeId);
  const department = findDepartment(application.programme?.departmentId);
  const session =
    findSession(application.programme?.sessionId) ?? findActiveSession();
  const totalSteps = APPLICATION_STEPS.length;

  return (
    <>
      <PageHeader
        eyebrow={`${session.name} Session`}
        title={`Welcome, ${applicant.firstName}`}
        description="Complete each section, then submit your application for review."
      />

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          <Card>
            <CardBody className={styles.progressCard}>
              <div className={styles.progressTop}>
                <div>
                  <p className={styles.progressLabel}>Application progress</p>
                  <p className={styles.kpi}>
                    <span>{progress}</span>%
                  </p>
                  <p className={styles.progressMeta}>
                    {completedCount} of {totalSteps} sections complete
                  </p>
                </div>
                <AppStatusTag status={application.status} />
              </div>

              <ProgressBar value={progress} />

              <div className={styles.nextAction}>
                <div>
                  <p className={styles.nextLabel}>Next step</p>
                  {next.hint && <p className={styles.nextHint}>{next.hint}</p>}
                </div>
                <Button href={next.href} rightIcon={<ArrowRight size={16} />}>
                  {next.label}
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Application sections"
              subtitle="Fill in each section to complete your application."
            />
            <ul className={styles.checklist}>
              {APPLICATION_STEPS.map((step, i) => {
                const done = stepStatus[step.key];
                return (
                  <li key={step.key}>
                    <Link href={stepPath(step.key)} className={styles.checkRow}>
                      <span
                        className={cn(
                          styles.checkNum,
                          done && styles.checkNumDone,
                        )}
                      >
                        {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={styles.checkLabel}>{step.label}</span>
                      <StatusTag
                        tone={done ? "success" : "neutral"}
                        label={done ? "Complete" : "Incomplete"}
                      />
                      <ChevronRight size={16} className={styles.chevron} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className={styles.sideCol}>
          <Card>
            <CardHeader title="Application summary" />
            <CardBody className={styles.summary}>
              <SummaryRow
                label="Application no."
                value={application.applicationNumber ?? "Assigned on submission"}
                mono={!!application.applicationNumber}
              />
              <SummaryRow
                label="Programme"
                value={programme?.name ?? "Not selected"}
              />
              <SummaryRow label="Department" value={department?.name ?? "—"} />
              <SummaryRow label="Level" value={programme?.level ?? "—"} />
              <SummaryRow
                label="Status"
                value={<AppStatusTag status={application.status} />}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className={styles.deadline}>
              <span className={styles.deadlineIcon}>
                <CalendarClock size={20} />
              </span>
              <div>
                <p className={styles.deadlineLabel}>Application deadline</p>
                <p className={styles.deadlineDate}>
                  {session.applicationDeadline
                    ? formatDate(session.applicationDeadline)
                    : "—"}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
