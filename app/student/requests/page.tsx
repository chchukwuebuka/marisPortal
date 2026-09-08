"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  HelpCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  RequestTariffItem,
  StudentRequestItem,
  getMyStudentRequests,
  getRequestTariffSchedule,
  submitStudentRequest,
} from "@/services/requests";
import styles from "./requests.module.css";

export default function StudentRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<StudentRequestItem[]>([]);
  const [tariffs, setTariffs] = useState<RequestTariffItem[]>([]);

  // Form state
  const [requestType, setRequestType] = useState("transcript");
  const [reason, setReason] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqList, tList] = await Promise.all([
        getMyStudentRequests().catch(() => []),
        getRequestTariffSchedule().catch(() => []),
      ]);
      setRequests(reqList);
      setTariffs(tList);
    } catch (err) {
      console.error("Failed to load requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const created = await submitStudentRequest({
        request_type: requestType,
        reason,
        supporting_doc_url: docUrl || undefined,
      });
      setMessage({
        type: "success",
        text: `Your ${created.request_type_display} request has been submitted successfully to the Registry!`,
      });
      setReason("");
      setDocUrl("");
      await loadData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || err?.detail || "Failed to submit request.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return <span className={styles.badgeSuccess}><CheckCircle2 size={12} /> Approved</span>;
      case "rejected":
      case "cancelled":
        return <span className={styles.badgeError}><XCircle size={12} /> Rejected</span>;
      case "in_review":
        return <span className={styles.badgeWarning}><Clock size={12} /> Under Review</span>;
      case "pending_payment":
        return <span className={styles.badgePayment}><CreditCard size={12} /> Pending Payment</span>;
      default:
        return <span className={styles.badgePending}><Clock size={12} /> Submitted</span>;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={36} />
        <p>Loading administrative requests...</p>
      </div>
    );
  }

  const selectedTariff = tariffs.find((t) => t.type === requestType);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.pill}>Registry & Academic Affairs</span>
          </div>
          <h1 className={styles.title}>Administrative Requests</h1>
          <p className={styles.subtitle}>
            Submit online requests for official transcripts, statements, deferments, change of course, and track review status.
          </p>
        </div>
        <button onClick={loadData} className={styles.refreshBtn} title="Refresh requests">
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 1. Tariff Quick Cards */}
      <div className={styles.tariffGrid}>
        <div className={styles.tariffCard}>
          <div className={styles.tariffIconBox}><FileText size={18} /></div>
          <div>
            <h4 className={styles.tariffTitle}>Official Academic Transcript</h4>
            <span className={styles.tariffFee}>₦5,000.00</span>
            <span className={styles.tariffMeta}>Certified Form SMS-TR01</span>
          </div>
        </div>
        <div className={styles.tariffCard}>
          <div className={styles.tariffIconBox}><FileText size={18} /></div>
          <div>
            <h4 className={styles.tariffTitle}>Statement of Result</h4>
            <span className={styles.tariffFee}>₦2,000.00</span>
            <span className={styles.tariffMeta}>Immediate Issuance</span>
          </div>
        </div>
        <div className={styles.tariffCard}>
          <div className={styles.tariffIconBox}><Clock size={18} /></div>
          <div>
            <h4 className={styles.tariffTitle}>Academic Deferment</h4>
            <span className={styles.tariffFee}>₦3,000.00</span>
            <span className={styles.tariffMeta}>Senate Board Approval</span>
          </div>
        </div>
        <div className={styles.tariffCard}>
          <div className={styles.tariffIconBox}><ClipboardList size={18} /></div>
          <div>
            <h4 className={styles.tariffTitle}>Change of Programme</h4>
            <span className={styles.tariffFee}>₦5,000.00</span>
            <span className={styles.tariffMeta}>Subject to Vacancy & Cut-off</span>
          </div>
        </div>
      </div>

      {/* 2. Submit Request Form */}
      <div className={styles.formCard}>
        <div className={styles.formCardHeader}>
          <ClipboardList size={22} className={styles.primaryIcon} />
          <div>
            <h2 className={styles.sectionTitle}>Submit New Request</h2>
            <p className={styles.sectionSub}>
              Fill out the details below. Requests requiring processing fees will generate an official invoice in your fee ledger.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={
              message.type === "success"
                ? styles.alertSuccess
                : styles.alertError
            }
          >
            {message.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.requestForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Request Category</label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className={styles.select}
                required
              >
                <option value="transcript">Official Academic Transcript (Form SMS-TR01)</option>
                <option value="statement_of_result">Statement of Result</option>
                <option value="deferment">Academic Deferment (Pause Studies)</option>
                <option value="change_programme">Change of Programme / Major</option>
                <option value="change_department">Change of Department</option>
                <option value="leave_of_absence">Leave of Absence (Medical / Compassionate)</option>
                <option value="waiver">Course Credit Waiver</option>
                <option value="biodata_correction">Biodata / Name Correction</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Statutory Tariff</label>
              <div className={styles.tariffDisplayBox}>
                <span>Tariff:</span>
                <strong className={styles.tariffAmount}>
                  {selectedTariff?.fee ? `₦${Number(selectedTariff.fee).toLocaleString()}` : "Free of Charge"}
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Reason & Justification</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clearly why you are making this request and provide all relevant context for the Registrar..."
              className={styles.textarea}
              rows={3}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Supporting Document URL / Link (Optional)
            </label>
            <input
              type="url"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="https://... (link to doctor's note, court affidavit, or previous result)"
              className={styles.input}
            />
          </div>

          <div className={styles.formFooter}>
            <div className={styles.policyNotice}>
              <HelpCircle size={16} />
              <span>Requests are reviewed in order of submission by the Academic Board.</span>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={styles.submitBtn}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className={styles.btnSpinner} />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Request to Registry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. My Requests History */}
      <div className={styles.historyCard}>
        <div className={styles.historyHeader}>
          <h3 className={styles.historyTitle}>Request History & Tracking</h3>
          <span className={styles.historyCount}>{requests.length} Total</span>
        </div>

        {requests.length === 0 ? (
          <div className={styles.emptyState}>
            <ClipboardList size={36} className={styles.emptyIcon} />
            <p>You have not submitted any administrative requests yet.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Request Type</th>
                  <th>Submission Date</th>
                  <th>Processing Fee</th>
                  <th>Review Status</th>
                  <th>Registry Remarks</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className={styles.reqNameBox}>
                        <strong className={styles.reqName}>{r.request_type_display}</strong>
                        <span className={styles.reqReason} title={r.reason}>
                          {r.reason.length > 50 ? r.reason.slice(0, 50) + "..." : r.reason}
                        </span>
                      </div>
                    </td>
                    <td className={styles.dateCol}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {Number(r.fee_amount) > 0 ? (
                        r.is_paid ? (
                          <span className={styles.paidBadge}>₦{Number(r.fee_amount).toLocaleString()} Paid</span>
                        ) : (
                          <a
                            href={r.payment_link || "/student/fees"}
                            className={styles.payLink}
                          >
                            Pay ₦{Number(r.fee_amount).toLocaleString()}
                          </a>
                        )
                      ) : (
                        <span className={styles.freeBadge}>Free</span>
                      )}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td className={styles.remarksCol}>
                      {r.staff_notes || <span className={styles.dash}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
