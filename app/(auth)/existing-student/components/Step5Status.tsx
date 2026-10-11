import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { LegacyRegistrationDetail, LegacyRegistrationEvent } from "@/types/legacy";
import styles from "../existing-student.module.css";

interface Step5StatusProps {
  registration: LegacyRegistrationDetail | null;
  timeline: LegacyRegistrationEvent[];
  onRefresh: () => Promise<void>;
  onReUpload: () => void;
  onReviewProfile: () => void;
}

export function Step5Status({
  registration,
  timeline,
  onRefresh,
  onReUpload,
  onReviewProfile,
}: Step5StatusProps) {
  const router = useRouter();

  return (
    <Card className={styles.card}>
      <div className={styles.statusHero}>
        <div
          className={`${styles.statusHeroBadge} ${
            styles[registration?.status || "submitted"]
          }`}
        >
          {registration?.status === "submitted" && <Clock size={18} />}
          {registration?.status === "under_review" && (
            <RefreshCw size={18} className={styles.spinIcon} />
          )}
          {registration?.status === "correction_required" && <AlertCircle size={18} />}
          {registration?.status === "approved" && <CheckCircle2 size={18} />}
          <span>
            {registration?.status_display ||
              registration?.status?.toUpperCase() ||
              "SUBMITTED"}
          </span>
        </div>

        <h2 className={styles.statusTitle}>
          {registration?.status === "approved"
            ? "Your Student Record Has Been Approved & Activated!"
            : registration?.status === "under_review"
            ? "Dossier Under Verification Against Physical Archives"
            : registration?.status === "correction_required"
            ? "Registry Requested Updates / Corrections"
            : "Application Submitted to Registry"}
        </h2>

        <p className={styles.statusMessage}>
          {registration?.status === "approved"
            ? "Your official student profile and portal credentials have been fully activated. You now have full access to course registration, results, fee receipts, and student services."
            : registration?.status === "correction_required"
            ? `Correction instructions: ${
                registration?.correction_note || "Please update your details and resubmit."
              }`
            : "Our verification team is cross-checking your submitted matriculation number and credentials against institutional archives. You will be notified once approved."}
        </p>

        <div className={styles.statusActions}>
          {registration?.status === "approved" ? (
            <Button
              size="lg"
              onClick={() => router.push("/student/dashboard")}
            >
              Proceed to Student Portal <ArrowRight size={18} />
            </Button>
          ) : registration?.status === "correction_required" ? (
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button onClick={onReUpload}>
                Re-upload Documents (Step 3) <ArrowRight size={16} />
              </Button>
              <Button variant="outline" onClick={onReviewProfile}>
                Review Profile (Step 2)
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw size={16} /> Refresh Status
            </Button>
          )}
        </div>
      </div>

      {/* Audit Timeline */}
      {timeline.length > 0 && (
        <div className={styles.timelineSection}>
          <div className={styles.timelineTitle}>
            <Clock size={16} />
            <span>Verification Activity Log</span>
          </div>
          <div className={styles.timelineList}>
            {timeline.map((item) => (
              <div key={item.id} className={styles.timelineItem}>
                <div className={styles.timelinePoint} />
                <div className={styles.timelineContent}>
                  <div className={styles.timelineHead}>
                    <strong>{item.action.replace(/_/g, " ").toUpperCase()}</strong>
                    <span className={styles.timelineDate}>
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  {item.note && <p className={styles.timelineNote}>{item.note}</p>}
                  {item.actor_email && (
                    <span className={styles.timelineActor}>
                      Logged by {item.actor_email}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
