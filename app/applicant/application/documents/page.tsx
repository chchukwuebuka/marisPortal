"use client";

import { useRouter } from "next/navigation";
import { useApplication } from "@/hooks/useApplication";
import { useCatalogue } from "@/hooks/useCatalogue";
import { RequirementCard, StepActions, StepPanel } from "@/components/application";
import { Alert } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import styles from "./documents.module.css";

export default function DocumentsStep() {
  const router = useRouter();
  const { application, stepStatus } = useApplication();
  const { getRequirementsForProgramme } = useCatalogue();
  const nav = stepNav("documents");

  const requirements = getRequirementsForProgramme(application.programme?.programmeId);
  const required = requirements.filter((r) => r.required);
  const uploadedRequired = required.filter((r) =>
    application.documents.some(
      (d) => d.requirementId === r.id && Boolean(d.fileName),
    ),
  ).length;

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
