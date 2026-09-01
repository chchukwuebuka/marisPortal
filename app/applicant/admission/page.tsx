"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  GraduationCap,
  Info,
  Printer,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { PageHeader } from "@/components/layout";
import {
  Alert,
  AppStatusTag,
  Badge,
  Button,
  Card,
  CardBody,
  LoadingBlock,
} from "@/components/ui";
import { downloadAdmissionLetter } from "@/services/applications";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import styles from "./admission.module.css";

/* ---- Decorative verification glyph --------------------------------------
 * A deterministic QR-like matrix derived from the verification code. Purely
 * presentational — stands in for the real QR the backend will render on the
 * signed PDF (§23). Deterministic so it never flickers between renders.
 */
const QR_N = 21;

function hashBit(seed: string, i: number): boolean {
  let h = 2166136261 >>> 0;
  const s = `${seed}#${i}`;
  for (let k = 0; k < s.length; k++) {
    h ^= s.charCodeAt(k);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return ((h >> 7) & 1) === 1;
}

// Finder squares + 1-cell separators in the three corners, like a real QR.
function finderCell(r: number, c: number): boolean | null {
  const boxes: Array<[number, number]> = [
    [0, 0],
    [0, QR_N - 7],
    [QR_N - 7, 0],
  ];
  for (const [br, bc] of boxes) {
    const rr = r - br;
    const cc = c - bc;
    if (rr >= -1 && rr <= 7 && cc >= -1 && cc <= 7) {
      if (rr < 0 || rr > 6 || cc < 0 || cc > 6) return false; // separator
      const border = rr === 0 || rr === 6 || cc === 0 || cc === 6;
      const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
      return border || core;
    }
  }
  return null;
}

function VerificationQR({ code }: { code: string }) {
  const cells: boolean[] = [];
  for (let r = 0; r < QR_N; r++) {
    for (let c = 0; c < QR_N; c++) {
      const f = finderCell(r, c);
      cells.push(f === null ? hashBit(code, r * QR_N + c) : f);
    }
  }
  return (
    <div
      className={styles.qr}
      style={{
        gridTemplateColumns: `repeat(${QR_N}, 1fr)`,
        gridTemplateRows: `repeat(${QR_N}, 1fr)`,
      }}
      aria-hidden
    >
      {cells.map((on, i) => (
        <span key={i} className={on ? styles.qrOn : undefined} />
      ))}
    </div>
  );
}

export default function AdmissionPage() {
  const {
    applicant,
    application,
    hydrated,
    acceptAdmission,
    declineAdmission,
  } = useApplication();

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!hydrated) {
    return <LoadingBlock label="Loading your admission status…" />;
  }

  const { status, decision } = application;
  const fullName = `${applicant.firstName} ${applicant.lastName}`;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadError(null);
      await downloadAdmissionLetter(
        application.id,
        `admission-letter-${application.applicationNumber || application.id}.pdf`,
      );
    } catch (err) {
      console.error("PDF download error:", err);
      setDownloadError(
        "Direct PDF download was unavailable. You can use the Print letter button below to view/print or save as PDF.",
      );
    } finally {
      setDownloading(false);
    }
  };

  // --- No offer to show -------------------------------------------------
  if (status === "rejected") {
    return (
      <>
        <PageHeader eyebrow="Admission" title="Admission Decision" />
        <Card>
          <CardBody className={styles.state}>
            <span className={cn(styles.stateIcon, styles.stateError)}>
              <XCircle size={26} />
            </span>
            <p className={styles.stateTitle}>Application not successful</p>
            <p className={styles.stateText}>
              After careful review, we regret that we are unable to offer you
              admission for this session. We wish you the very best.
            </p>
            <Button href="/applicant/status" variant="outline">
              View application status
            </Button>
          </CardBody>
        </Card>
      </>
    );
  }

  if (!decision) {
    return (
      <>
        <PageHeader eyebrow="Admission" title="Admission Decision" />
        <Card>
          <CardBody className={styles.state}>
            <span className={cn(styles.stateIcon, styles.stateInfo)}>
              <Info size={26} />
            </span>
            <p className={styles.stateTitle}>No admission decision yet</p>
            <p className={styles.stateText}>
              Your admission letter will appear here once the admissions office
              publishes a decision on your application.
            </p>
            <div className={styles.stateMeta}>
              <span>Current status</span>
              <AppStatusTag status={status} />
            </div>
            <Button
              href="/applicant/status"
              variant="outline"
              rightIcon={<ArrowRight size={16} />}
            >
              Track application status
            </Button>
          </CardBody>
        </Card>
      </>
    );
  }

  const accepted = status === "accepted";
  const declined = status === "declined";

  return (
    <>
      <PageHeader
        eyebrow="Admission"
        title="Admission Letter"
        description="Your official offer of provisional admission to Marist Polytechnic."
        actions={
          accepted || status === "admitted" ? (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Button
                variant="primary"
                leftIcon={<Download size={16} />}
                onClick={handleDownload}
                loading={downloading}
              >
                Download PDF
              </Button>
              <Button
                variant="outline"
                leftIcon={<Printer size={16} />}
                onClick={() => window.print()}
              >
                Print letter
              </Button>
            </div>
          ) : undefined
        }
      />

      {downloadError && (
        <Alert
          tone="warning"
          title="Notice"
          className={styles.banner}
        >
          {downloadError}
        </Alert>
      )}

      {status === "admitted" && (
        <Card className={styles.offerCard}>
          <CardBody className={styles.offer}>
            <div className={styles.offerHero}>
              <span className={styles.offerIcon}>
                <GraduationCap size={26} />
              </span>
              <div>
                <p className={styles.offerTitle}>
                  Congratulations, {applicant.firstName}!
                </p>
                <p className={styles.offerText}>
                  You have been offered provisional admission. Read your
                  admission letter below, then accept your offer to secure your
                  place and proceed to Phase 2 registration.
                </p>
              </div>
            </div>
            <div className={styles.offerActions}>
              <Button
                variant="secondary"
                leftIcon={<CheckCircle2 size={18} />}
                onClick={() => acceptAdmission()}
              >
                Accept admission
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download size={18} />}
                onClick={handleDownload}
                loading={downloading}
              >
                Download PDF
              </Button>
              <Button
                variant="outline"
                leftIcon={<XCircle size={18} />}
                onClick={() => {
                  if (
                    window.confirm(
                      "Decline this admission offer? This cannot be undone for the current session.",
                    )
                  ) {
                    declineAdmission();
                  }
                }}
              >
                Decline offer
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {accepted && (
        <Alert
          tone="success"
          title="Admission accepted"
          className={styles.banner}
        >
          You have accepted your offer of admission. You are now ready for Phase
          2 registration — keep this letter for your records.
        </Alert>
      )}

      {declined && (
        <Alert
          tone="warning"
          title="Offer declined"
          className={styles.banner}
        >
          You declined this admission offer. If this was a mistake, please
          contact the admissions office.
        </Alert>
      )}

      {/* ---- The letter ------------------------------------------------- */}
      <div className={styles.sheet} id="admission-letter">
        <div className={styles.letterHead}>
          <div className={styles.brand}>
            <span className={styles.crest}>MP</span>
            <div>
              <p className={styles.org}>Marist Polytechnic</p>
              <p className={styles.addr}>
                Office of Admissions · Registrar&rsquo;s Department
              </p>
            </div>
          </div>
          {accepted ? (
            <Badge tone="success" className={styles.stamp}>
              ACCEPTED
            </Badge>
          ) : declined ? (
            <Badge tone="error" className={styles.stamp}>
              DECLINED
            </Badge>
          ) : (
            <Badge tone="warning" className={styles.stamp}>
              PROVISIONAL
            </Badge>
          )}
        </div>

        <div className={styles.refRow}>
          <div className={styles.refItem}>
            <span className={styles.refLabel}>Reference</span>
            <span className={styles.mono}>{decision.verificationCode}</span>
          </div>
          <div className={styles.refItem}>
            <span className={styles.refLabel}>Application no.</span>
            <span className={styles.mono}>
              {application.applicationNumber ?? "—"}
            </span>
          </div>
          <div className={styles.refItem}>
            <span className={styles.refLabel}>Date</span>
            <span>{formatDate(decision.decisionDate)}</span>
          </div>
        </div>

        <h2 className={styles.letterTitle}>
          Offer of Provisional Admission — {decision.sessionName} Session
        </h2>

        <p className={styles.salute}>Dear {fullName},</p>

        <p className={styles.para}>
          Following the review of your application, I am pleased to inform you
          that you have been offered <strong>{decision.admissionType}</strong>{" "}
          into the following programme of study at Marist Polytechnic for the{" "}
          {decision.sessionName} academic session:
        </p>

        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt>Programme</dt>
            <dd>{decision.programmeName}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Department</dt>
            <dd>{decision.departmentName}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>School</dt>
            <dd>{decision.schoolName}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Session</dt>
            <dd>{decision.sessionName}</dd>
          </div>
        </dl>

        <p className={styles.para}>
          This offer is provisional and subject to the verification of the
          credentials submitted with your application. Any false declaration or
          discrepancy discovered will result in the automatic withdrawal of this
          offer.
        </p>

        {decision.conditions && (
          <p className={styles.para}>
            <strong>Conditions:</strong> {decision.conditions}
          </p>
        )}

        <p className={styles.para}>
          To accept this offer, log in to your applicant portal and confirm your
          acceptance. You will then be able to proceed to Phase 2 registration.
        </p>

        <div className={styles.verify}>
          <VerificationQR code={decision.verificationCode} />
          <div className={styles.verifyText}>
            <span className={styles.verifyBadge}>
              <ShieldCheck size={15} />
              Verifiable document
            </span>
            <p className={styles.verifyNote}>
              Scan the code or verify this letter&rsquo;s authenticity using the
              reference below at the admissions office.
            </p>
            <p className={styles.code}>{decision.verificationCode}</p>
          </div>
        </div>

        <div className={styles.sign}>
          <p className={styles.signName}>Registrar</p>
          <p className={styles.signRole}>For: Marist Polytechnic</p>
        </div>

        <p className={styles.letterFooter}>
          This is a system-generated admission letter. It remains valid only for
          the {decision.sessionName} academic session.
        </p>
      </div>
    </>
  );
}
