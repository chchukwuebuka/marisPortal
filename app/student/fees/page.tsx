"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileCheck,
  FileText,
  Lock,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, Spinner } from "@/components/ui";
import { useStudent } from "@/providers/StudentProvider";
import {
  getCurrentFeeInvoice,
  initializeFeePayment,
  verifyFeePayment,
} from "@/services/students";
import type { StudentFeeInvoice } from "@/types/student";
import styles from "./fees.module.css";

function FeesContent() {
  const { student } = useStudent();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [invoice, setInvoice] = useState<StudentFeeInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState<"full" | "custom">("full");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  // Load invoice
  async function loadInvoice() {
    try {
      setLoading(true);
      const data = await getCurrentFeeInvoice();
      setInvoice(data);
    } catch (err) {
      console.error("Failed to load fee invoice", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, []);

  // Check for payment return verification reference (?reference=...)
  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) return;
    const refToVerify = reference;
    if (!reference) return;

    let mounted = true;
    async function verifyReturn() {
      try {
        setVerifying(true);
        setFeedback({ tone: "info", message: `Verifying transaction reference ${reference} with payment gateway...` });
        const res = await verifyFeePayment(refToVerify);
        if (!mounted) return;

        if (res.status === "success" || res.status === "successful") {
          setFeedback({
            tone: "success",
            message: `Payment of ₦${res.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} verified successfully! Receipt Number: ${res.receiptNumber}`,
          });
          await loadInvoice();
        } else {
          setFeedback({
            tone: "error",
            message: `Payment verification status: ${res.status}. If your account was debited, please contact the Bursary with reference ${reference}.`,
          });
        }
      } catch (err: any) {
        if (!mounted) return;
        setFeedback({
          tone: "error",
          message: err?.message || "Failed to verify transaction. Please refresh or check payment history.",
        });
      } finally {
        if (mounted) {
          setVerifying(false);
          // Remove query params
          router.replace("/student/fees");
        }
      }
    }

    verifyReturn();
    return () => {
      mounted = false;
    };
  }, [searchParams, router]);

  // Handle Paystack initialization
  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;

    const amountToPay =
      paymentMode === "full" ? invoice.balanceDue : parseFloat(customAmount);

    if (isNaN(amountToPay) || amountToPay < 100) {
      setFeedback({ tone: "error", message: "Minimum installment payment is ₦100.00." });
      return;
    }

    if (amountToPay > invoice.balanceDue) {
      setFeedback({
        tone: "error",
        message: `Amount cannot exceed your current balance due (₦${invoice.balanceDue.toLocaleString("en-NG")}).`,
      });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const currentUrl = window.location.origin + window.location.pathname;
      const res = await initializeFeePayment({
        invoice_id: invoice.id,
        amount: amountToPay,
        callback_url: currentUrl,
      });

      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      } else {
        setFeedback({ tone: "error", message: "Could not obtain payment authorization link." });
      }
    } catch (err: any) {
      setFeedback({ tone: "error", message: err?.message || "Payment initialization failed." });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || verifying) {
    return (
      <div style={{ padding: "4rem 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <Spinner size={36} />
        <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
          {verifying ? "Verifying payment with gateway..." : "Loading fee invoice..."}
        </p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <>
        <PageHeader
          eyebrow="Student Bursary"
          title="School Fees & Invoices"
          description="View your institutional fee schedules and make secure payments."
        />
        <Alert tone="info" title="No Active Fee Schedule">
          There is currently no approved fee schedule assigned to your academic level and programme. Please check back when official session fees are published by the Bursary.
        </Alert>
      </>
    );
  }

  const isCleared = invoice.isCleared || invoice.balanceDue <= 0;

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Student Bursary"
        title="School Fees & Invoices"
        description={`Session: ${invoice.sessionName} • Level: ${invoice.levelName} • Invoice: ${invoice.invoiceNumber}`}
      />

      {feedback && (
        <Alert tone={feedback.tone}>
          {feedback.message}
        </Alert>
      )}

      {/* Top Overview Cards */}
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.iconWrap} style={{ background: "#e0e7ff", color: "#4338ca" }}>
            <FileText size={24} />
          </div>
          <div>
            <div className={styles.metaLabel}>Total Approved Fees</div>
            <div className={styles.metaVal}>
              ₦{invoice.totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.iconWrap} style={{ background: "#d1fae5", color: "#059669" }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className={styles.metaLabel}>Total Amount Paid</div>
            <div className={styles.metaVal} style={{ color: "#059669" }}>
              ₦{invoice.amountPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.iconWrap} style={{ background: isCleared ? "#d1fae5" : "#fee2e2", color: isCleared ? "#059669" : "#dc2626" }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div className={styles.metaLabel}>Outstanding Balance</div>
            <div className={styles.metaVal} style={{ color: isCleared ? "#059669" : "#dc2626" }}>
              ₦{invoice.balanceDue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.iconWrap} style={{ background: "#fef3c7", color: "#d97706" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className={styles.metaLabel}>Financial Status</div>
            <div className={styles.metaVal} style={{ fontSize: "1.05rem" }}>
              {invoice.statusDisplay.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={styles.mainLayout}>
        {/* Left: Fee Breakdown Schedule */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <Receipt size={20} style={{ color: "var(--color-primary)" }} />
              Fee Breakdown Schedule
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-muted)", fontWeight: 500 }}>
              Form SMS-FR01 Reference
            </span>
          </div>

          <table className={styles.breakdownTable}>
            <thead>
              <tr>
                <th>Fee Head / Category</th>
                <th style={{ textAlign: "right" }}>Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.feeBreakdown.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.category}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    ₦{item.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "var(--color-surface-subtle, #f8fafc)", fontWeight: 700 }}>
                <td>Total Scheduled Amount</td>
                <td style={{ textAlign: "right", color: "var(--color-primary)" }}>
                  ₦{invoice.totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right: Payment Action Box */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <CreditCard size={20} style={{ color: "var(--color-primary)" }} />
              Make Fee Payment
            </div>
            <span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "0.2rem 0.5rem", borderRadius: 4 }}>
              Paystack Gateway
            </span>
          </div>

          {isCleared ? (
            <div className={styles.clearedBanner}>
              <div className={styles.clearedIcon}>
                <CheckCircle2 size={28} />
              </div>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>
                Institutional Clearance Granted
              </h4>
              <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.4 }}>
                All approved academic fees for this period have been fully settled. You are eligible for examination clearance and course registration validation.
              </p>
              {invoice.payments.length > 0 && (
                <Link
                  href={`/student/fees/receipt?id=${invoice.payments[0].receiptNumber}`}
                  className={styles.receiptLink}
                  style={{ marginTop: "0.5rem" }}
                >
                  <FileText size={16} />
                  Download Official Receipt (SMS-FR01)
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handlePayment} className={styles.paymentForm}>
              <div className={styles.radioGroup}>
                <label className={`${styles.radioLabel} ${paymentMode === "full" ? styles.radioLabelActive : ""}`}>
                  <input
                    type="radio"
                    name="payMode"
                    value="full"
                    checked={paymentMode === "full"}
                    onChange={() => setPaymentMode("full")}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      Pay Full Balance
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                      ₦{invoice.balanceDue.toLocaleString("en-NG", { minimumFractionDigits: 2 })} (Clear invoice completely)
                    </div>
                  </div>
                </label>

                <label className={`${styles.radioLabel} ${paymentMode === "custom" ? styles.radioLabelActive : ""}`}>
                  <input
                    type="radio"
                    name="payMode"
                    value="custom"
                    checked={paymentMode === "custom"}
                    onChange={() => setPaymentMode("custom")}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      Pay in Installment
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                      Specify custom installment amount (&ge; ₦100)
                    </div>
                  </div>
                </label>
              </div>

              {paymentMode === "custom" && (
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Installment Amount (₦)</label>
                  <input
                    type="number"
                    min="100"
                    max={invoice.balanceDue}
                    step="100"
                    placeholder="e.g. 50000"
                    className={styles.textInput}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={styles.payButton}
              >
                {submitting ? (
                  <>
                    <Spinner size={18} />
                    <span>Connecting to Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>
                      Pay ₦
                      {(paymentMode === "full"
                        ? invoice.balanceDue
                        : parseFloat(customAmount) || 0
                      ).toLocaleString("en-NG", { minimumFractionDigits: 2 })}{" "}
                      with Paystack
                    </span>
                  </>
                )}
              </button>

              <div className={styles.securityNote}>
                <ShieldCheck size={16} style={{ color: "#059669" }} />
                <span>Secured with 256-bit SSL & Server-to-Server Gateway Verification</span>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Bottom: Payment History Ledger */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <Clock size={20} style={{ color: "var(--color-primary)" }} />
            Payment History & Official Receipts
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
            {invoice.payments.length} Transaction(s) Recorded
          </span>
        </div>

        {invoice.payments.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>
            No payment transactions recorded for this invoice yet.
          </div>
        ) : (
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Reference</th>
                <th>Amount (₦)</th>
                <th>Channel / Gateway</th>
                <th>Date Paid</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{p.receiptNumber}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--color-muted)" }}>
                    {p.reference}
                  </td>
                  <td style={{ fontWeight: 600, color: "#059669" }}>
                    ₦{p.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </td>
                  <td>{p.gatewayDisplay}</td>
                  <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span style={{
                      background: p.status === "success" ? "#d1fae5" : "#fef3c7",
                      color: p.status === "success" ? "#065f46" : "#92400e",
                      padding: "0.2rem 0.5rem",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}>
                      {p.statusDisplay.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link
                      href={`/student/fees/receipt?id=${p.receiptNumber}`}
                      className={styles.receiptLink}
                    >
                      <Download size={14} />
                      Receipt SMS-FR01
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function StudentFeesPage() {
  return (
    <Suspense fallback={<div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}><Spinner size={32} /></div>}>
      <FeesContent />
    </Suspense>
  );
}
