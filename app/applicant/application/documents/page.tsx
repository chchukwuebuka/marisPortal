"use client";

import { useRouter } from "next/navigation";
import { useApplication } from "@/hooks/useApplication";
import { useCatalogue } from "@/hooks/useCatalogue";
import { RequirementCard, StepActions, StepPanel } from "@/components/application";
import { Alert } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import { ENTRY_MODE_OPTIONS } from "@/types/enums";
import styles from "./documents.module.css";

export default function DocumentsStep() {
  const router = useRouter();
  const { application, stepStatus } = useApplication();
  const { getRequirementsForProgramme } = useCatalogue();
  const nav = stepNav("documents");

  const requirements = getRequirementsForProgramme(
    application.programme?.programmeId,
    application.entryMode,
  );
  const required = requirements.filter((r) => r.required);
  const uploadedRequired = required.filter((r) =>
    application.documents.some(
      (d) => d.requirementId === r.id && Boolean(d.fileName),
    ),
  ).length;

  const currentModeOpt = ENTRY_MODE_OPTIONS.find(
    (m) => m.value === application.entryMode,
  );

  return (
    <StepPanel
      title="Documents"
      description="Upload clear scans or photos of the documents below. Uploaded files are submitted for verification."
      footer={
        <StepActions
          backHref={nav.prevHref}
          onContinue={() => router.push(nav.nextHref)}
          submitDisabled={!stepStatus.documents}
        />
      }
    >
      <div className={styles.summary}>
        {currentModeOpt && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "14px",
              fontSize: "13px",
              color: "#1e40af",
            }}
          >
            <span>
              Document Checklist for Admission Track: <strong>{currentModeOpt.label}</strong>
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "#dbeafe",
                color: "#1e3a8a",
              }}
            >
              {currentModeOpt.badge}
            </span>
          </div>
        )}
        <Alert
          tone={stepStatus.documents ? "success" : "info"}
          title={
            stepStatus.documents
              ? "All required documents uploaded"
              : `${uploadedRequired} of ${required.length} required documents uploaded`
          }
        >
          {stepStatus.documents
            ? "You can replace any file before submitting your application."
            : "Upload every required document to continue. Optional documents can be added if you have them."}
        </Alert>
      </div>

      <div className={styles.list}>
        {requirements.map((req) => (
          <RequirementCard key={req.id} requirement={req} />
        ))}
      </div>
    </StepPanel>
  );
}
