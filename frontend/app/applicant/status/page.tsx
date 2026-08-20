"use client";

import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  MessageSquareWarning,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { PageHeader } from "@/components/layout";
import { Timeline } from "@/components/application";
import {
  Alert,
  AppStatusTag,
  Button,
  Card,
  CardBody,
  CardHeader,
  LoadingBlock,
} from "@/components/ui";
import { getNextAction } from "@/lib/flow";
import { buildTimeline } from "@/lib/timeline";
import { formatDate } from "@/lib/format";
import { findProgramme } from "@/services";
import styles from "./status.module.css";

export default function StatusPage() {
  const {
    application,
    stepStatus,
    paid,
    hydrated,
    applyMockDecision,
    resetApplication,
  } = useApplication();

  if (!hydrated) {
    return <LoadingBlock label="Loading your application status…" />;
  }

  const status = application.status;
  const events = buildTimeline(application);
  const next = getNextAction(application, stepStatus, paid);
  const programme = findProgramme(application.programme?.programmeId);
  const canSimulate = ["submitted", "under_review", "approved"].includes(
    status,
  );

  return (
    <>
      <PageHeader
        eyebrow="Application"
        title="Application Status"
        description="Track your application as it moves through the admissions process."
      />

      {status === "correction_required" && (
        <div className={styles.topAlert}>
          <Alert tone="warning" title="Corrections requested">
            {application.correctionComment ??
              "The admissions office has requested changes to your application."}{" "}
            Update the affected sections, then submit again.
          </Alert>
        </div>
      )}

      <div className={styles.grid}>
        <Card className={styles.timelineCard}>
          <CardHeader title="Progress" />
          <CardBody>
            <Timeline events={events} />
          </CardBody>
        </Card>

        <div className={styles.sideCol}>
          <Card>
            <CardHeader title="Summary" />
            <CardBody className={styles.summary}>
              <div className={styles.sumRow}>
                <span className={styles.sumLabel}>Status</span>
                <AppStatusTag status={status} />
              </div>
              <div className={styles.sumRow}>
                <span className={styles.sumLabel}>Application no.</span>
                <span className={styles.sumValueMono}>
                  {application.applicationNumber ?? "Not submitted"}
                </span>
              </div>
              <div className={styles.sumRow}>
                <span className={styles.sumLabel}>Programme</span>
                <span className={styles.sumValue}>
                  {programme ? `${programme.level} ${programme.name}` : "—"}
                </span>
              </div>
              <div className={styles.sumRow}>
                <span className={styles.sumLabel}>Submitted</span>
                <span className={styles.sumValue}>
                  {application.submittedAt
                    ? formatDate(application.submittedAt)
                    : "—"}
                </span>
              </div>

              <Button
                href={next.href}
                fullWidth
                rightIcon={<ArrowRight size={16} />}
                className={styles.cta}
              >
                {next.label}
              </Button>
            </CardBody>
          </Card>

          {canSimulate && (
            <Card className={styles.demoCard}>
              <CardHeader
                title="Simulate admissions office"
                subtitle="Demo only — stands in for the reviewer dashboard."
                icon={<FlaskConical size={18} />}
              />
              <CardBody className={styles.demoActions}>
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<CheckCircle2 size={16} />}
                  onClick={() => applyMockDecision("admit")}
                >
                  Approve &amp; offer admission
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<MessageSquareWarning size={16} />}
                  onClick={() =>
                    applyMockDecision(
                      "correction",
                      "Please re-upload a clearer copy of your O'Level result.",
                    )
                  }
                >
                  Request correction
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  leftIcon={<XCircle size={16} />}
                  onClick={() => applyMockDecision("reject")}
                >
                  Reject application
                </Button>
              </CardBody>
            </Card>
          )}

          <button
            type="button"
            className={styles.reset}
            onClick={() => {
              if (
                window.confirm(
                  "Reset the entire application draft? This clears all saved progress (demo only).",
                )
              ) {
                resetApplication();
              }
            }}
          >
            <RotateCcw size={13} />
            Reset application (demo)
          </button>
        </div>
      </div>
    </>
  );
}
