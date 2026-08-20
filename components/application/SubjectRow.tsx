import { Trash2 } from "lucide-react";
import type { OLevelSubject } from "@/types/domain";
import type { Tone } from "@/lib/constants";
import { CREDIT_GRADES } from "@/types/enums";
import { Badge } from "@/components/ui";
import styles from "./SubjectRow.module.css";

function gradeTone(grade: OLevelSubject["grade"]): Tone {
  if (CREDIT_GRADES.includes(grade)) return "success";
  if (grade === "F9") return "error";
  return "warning";
}

export function SubjectRow({
  subject,
  onRemove,
}: {
  subject: OLevelSubject;
  onRemove: () => void;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.name}>{subject.subject}</span>
      <Badge tone={gradeTone(subject.grade)} className={styles.grade}>
        {subject.grade}
      </Badge>
      <button
        type="button"
        className={styles.remove}
        onClick={onRemove}
        aria-label={`Remove ${subject.subject}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
