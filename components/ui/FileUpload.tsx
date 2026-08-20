"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./FileUpload.module.css";

interface FileUploadProps {
  onSelect: (file: File) => void;
  accept?: string;
  hint?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
}

export function FileUpload({
  onSelect,
  accept,
  hint,
  disabled,
  loading,
  id,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const busy = disabled || loading;

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    onSelect(files[0]);
  }

  return (
    <div
      className={cn(
        styles.zone,
        dragging && styles.dragging,
        busy && styles.disabled,
      )}
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-disabled={busy}
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (busy) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!busy) handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className={styles.input}
        disabled={busy}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <span className={styles.icon}>
        <UploadCloud size={22} />
      </span>
      <p className={styles.primary}>
        {loading ? (
          "Uploading…"
        ) : (
          <>
            <span className={styles.link}>Click to upload</span> or drag and
            drop
          </>
        )}
      </p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
