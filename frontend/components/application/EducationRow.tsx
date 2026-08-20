import { GraduationCap, Trash2 } from "lucide-react";
import type { EducationRecord } from "@/types/domain";
import styles from "./EducationRow.module.css";

export function EducationRow({
  record,
  onRemove,
}: {
  record: EducationRecord;
  onRemove: () => void;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.icon}>
        <GraduationCap size={18} />
      </span>
      <div className={styles.body}>
        <p className={styles.institution}>{record.institution}</p>
        <p className={styles.meta}>
          {record.qualification} · {record.startYear}–{record.endYear}
        </p>
      </div>
      <button
        type="button"
        className={styles.remove}
        onClick={onRemove}
        aria-label={`Remove ${record.institution}`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
