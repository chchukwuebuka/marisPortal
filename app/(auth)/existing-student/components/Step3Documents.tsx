import { AlertCircle, ArrowLeft, ArrowRight, FileCheck, Trash2, UploadCloud } from "lucide-react";
import { Alert, Badge, Button, Card, DocStatusTag, FileUpload } from "@/components/ui";
import type { LegacyRegistrationDetail, LegacyRequirementChecklistItem } from "@/types/legacy";
import { DEFAULT_FALLBACK_REQUIREMENTS } from "../types";
import styles from "../existing-student.module.css";

interface Step3DocumentsProps {
  registration: LegacyRegistrationDetail | null;
  requirements: LegacyRequirementChecklistItem[];
  uploadingDocId: number | null;
  handleFileUpload: (requirementId: number, file: File) => Promise<void>;
  handleDeleteDocument: (documentId: number) => Promise<void>;
  onBack: () => void;
  onNext: () => void;
}

export function Step3Documents({
  registration,
  requirements,
  uploadingDocId,
  handleFileUpload,
  handleDeleteDocument,
  onBack,
  onNext,
}: Step3DocumentsProps) {
  const activeRequirementsList =
    requirements.length > 0 ? requirements : DEFAULT_FALLBACK_REQUIREMENTS;
  const requiredRequirements = activeRequirementsList.filter(
    (item) => item.requirement.required
  );
  const uploadedRequiredCount = requiredRequirements.filter(
    (item) => item.document && Boolean(item.document.id)
  ).length;
  const totalRequiredCount = requiredRequirements.length;
  const allRequiredUploaded =
    totalRequiredCount > 0 && uploadedRequiredCount === totalRequiredCount;

  return (
    <Card className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardIconBox}>
          <UploadCloud size={22} />
        </div>
        <div>
          <h2 className={styles.cardTitle}>Step 3: Upload Supporting Documents</h2>
          <p className={styles.cardDesc}>
            Upload clear scans or photos of your credentials for verification against school physical archives.
          </p>
        </div>
      </div>

      {/* Registry Correction Instructions Callout (if active) */}
      {registration?.correction_note && (
        <div
          style={{
            marginBottom: "20px",
            padding: "16px 20px",
            borderRadius: "12px",
            background: "#fffbeb",
            border: "1.5px solid #f59e0b",
            color: "#92400e",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <AlertCircle size={22} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#b45309" }}>
                Registry Correction Instructions
              </h4>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.55", color: "#78350f" }}>
                {registration.correction_note}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Status Banner */}
      <div className={styles.docSummaryBanner}>
        <Alert
          tone={allRequiredUploaded ? "success" : "info"}
          title={
            allRequiredUploaded
              ? "All required documents uploaded"
              : `${uploadedRequiredCount} of ${totalRequiredCount} required documents uploaded`
          }
        >
          {allRequiredUploaded
            ? "You can replace any file before submitting your application to the Registry."
            : "Upload every required document to continue. Optional documents can be added if you have them."}
        </Alert>
      </div>

      <div className={styles.docList}>
        {activeRequirementsList.map((item) => {
          const req = item.requirement;
          const doc = item.document;
          const isUploading = uploadingDocId === req.id;
          const allowedExts =
            req.allowed_extensions ||
            (req.allowed_file_types
              ? req.allowed_file_types
                  .split(",")
                  .map((s) => s.trim().toLowerCase().replace(/^\./, ""))
              : null) ||
            req.allowed_formats || ["pdf", "jpg", "jpeg", "png"];
          const acceptStr = allowedExts.map((e) => `.${e}`).join(",");
          const typesUpper = allowedExts.map((e) => e.toUpperCase()).join(", ");
          const maxMb =
            req.max_size_mb ||
            (req.max_file_size ? Math.round(req.max_file_size / (1024 * 1024)) : 5);

          return (
            <div
              key={req.id}
              className={`${styles.docItem} ${doc ? styles.docItemUploaded : ""}`}
            >
              <div className={styles.docHeaderRow}>
                <div className={styles.docTitleBox}>
                  <div className={styles.docTitleWithBadge}>
                    <span className={styles.docName}>{req.name}</span>
                    <Badge tone={req.required ? "info" : "neutral"}>
                      {req.required ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  {req.description && (
                    <p className={styles.docDescription}>{req.description}</p>
                  )}
                  <span className={styles.docMeta}>
                    Accepted Formats: {typesUpper} · Max {maxMb}MB
                  </span>
                </div>
              </div>

              {/* Uploaded File Row */}
              {doc && (
                <div className={styles.docUploadedBox}>
                  <div className={styles.docFileInfo}>
                    <div className={styles.docFileIcon}>
                      <FileCheck size={20} />
                    </div>
                    <div className={styles.docFileDetails}>
                      <span className={styles.fileName} title={doc.original_filename}>
                        {doc.original_filename || "Uploaded Document"}
                      </span>
                      <span className={styles.docUploadMeta}>
                        Uploaded on {new Date(doc.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.docStatusBadge}>
                      <DocStatusTag status={doc.status} />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.deleteIconButton}
                    onClick={() => handleDeleteDocument(doc.id)}
                    title="Remove document"
                  >
                    <Trash2 size={15} /> <span>Remove</span>
                  </button>
                </div>
              )}

              {/* Dropzone Upload Component */}
              <div className={styles.docUploadArea}>
                <FileUpload
                  disabled={isUploading}
                  loading={isUploading}
                  accept={acceptStr}
                  onSelect={(file) => handleFileUpload(req.id, file)}
                  hint={
                    <>
                      {typesUpper} up to {maxMb} MB
                      {doc && " · uploading a new file replaces the current one"}
                    </>
                  }
                />
              </div>

              {doc?.review_comment && (
                <div className={styles.docReviewNote}>
                  <strong>Registry Note:</strong> {doc.review_comment}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.cardActions}>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Profile
        </Button>
        <Button type="button" onClick={onNext}>
          Review & Submit <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}
