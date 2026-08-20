"use client";

import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import type { DocumentRequirement } from "@/types/domain";
import { useApplication } from "@/hooks/useApplication";
import { Alert, Badge, DocStatusTag, FileUpload } from "@/components/ui";
import { formatBytes, formatDateTime } from "@/lib/format";
import styles from "./RequirementCard.module.css";

export function RequirementCard({
  requirement,
}: {
  requirement: DocumentRequirement;
}) {
  const { getDocument, uploadDocument, removeDocument } = useApplication();
  const [error, setError] = useState<string | null>(null);

  const doc = getDocument(requirement.id);
  const typesLabel = requirement.allowedFileTypes
    .map((t) => t.toUpperCase())
    .join(", ");
  const accept = requirement.allowedFileTypes.map((t) => `.${t}`).join(",");

  function handleSelect(file: File) {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (
      requirement.allowedFileTypes.length > 0 &&
      !requirement.allowedFileTypes.includes(ext)
    ) {
      setError(`Only ${typesLabel} files are allowed.`);
      return;
    }
    if (file.size > requirement.maxFileSizeMb * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${requirement.maxFileSizeMb} MB.`);
      return;
    }
    uploadDocument(requirement.id, {
      fileName: file.name,
      fileSizeBytes: file.size,
      fileType: ext,
      objectUrl: URL.createObjectURL(file),
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.name}>{requirement.name}</p>
          {requirement.description && (
            <p className={styles.desc}>{requirement.description}</p>
          )}
        </div>
        <Badge tone={requirement.required ? "info" : "neutral"}>
          {requirement.required ? "Required" : "Optional"}
        </Badge>
      </div>

      {doc?.fileName && (
        <div className={styles.file}>
          <span className={styles.fileIcon}>
            <FileText size={18} />
          </span>
          <div className={styles.fileBody}>
            <p className={styles.fileName}>{doc.fileName}</p>
            <p className={styles.fileMeta}>
              {formatBytes(doc.fileSizeBytes ?? 0)}
              {doc.uploadedAt && <> · Uploaded {formatDateTime(doc.uploadedAt)}</>}
            </p>
          </div>
          <div className={styles.fileActions}>
            <DocStatusTag status={doc.status} />
            <button
              type="button"
              className={styles.remove}
              onClick={() => {
                removeDocument(requirement.id);
                setError(null);
              }}
              aria-label={`Remove ${requirement.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      <FileUpload
        onSelect={handleSelect}
        accept={accept}
        hint={
          <>
            {typesLabel || "Any file"} · up to {requirement.maxFileSizeMb} MB
            {doc?.fileName && " · uploading a new file replaces the current one"}
          </>
        }
      />

      {error && (
        <div className={styles.error}>
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </div>
  );
}
