import { Check } from "lucide-react";
import type { StatusEvent } from "@/types/domain";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import styles from "./Timeline.module.css";

export function Timeline({ events }: { events: StatusEvent[] }) {
  return (
    <ol className={styles.timeline}>
      {events.map((e, i) => (
        <li
          key={e.id}
          className={cn(
            styles.item,
            i === events.length - 1 && styles.last,
            styles[e.state],
          )}
        >
          <span className={styles.marker} aria-hidden>
            {e.state === "done" ? (
              <Check size={13} strokeWidth={3} />
            ) : (
              <span className={styles.dot} />
            )}
          </span>
          <div className={styles.content}>
            <p className={styles.label}>{e.label}</p>
            {e.note && <p className={styles.note}>{e.note}</p>}
            {e.at && <p className={styles.time}>{formatDateTime(e.at)}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
