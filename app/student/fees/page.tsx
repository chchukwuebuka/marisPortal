"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileCheck,
  FileText,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, Spinner } from "@/components/ui";
import { useStudent } from "@/providers/StudentProvider";
import {
  getCurrentFeeInvoice,
  initializeFeePayment,
  verifyFeePayment,
} from "@/services/students";
import type {
  StudentFeeInvoice,
  FeeBreakdownItem,
  ComponentFeeDetail,
  InvoiceFeeSummary,
} from "@/types/student";
import styles from "./fees.module.css";

type PaymentTarget = "core" | "other" | "all";

function FeesContent() {
  const { student } = useStudent();
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<StudentFeeInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [payTarget, setPayTarget] = useState<PaymentTarget>("core");
  const [paymentMode, setPaymentMode] = useState<"full" | "custom">("full");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Load fee invoice
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

  // Handle Paystack return verification query (?reference=...)
  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) return;
    const refToVerify = reference;

    let mounted = true;
    async function verifyReturn() {
      try {
        setVerifying(true);
        setFeedback({
          tone: "info",
          message: `Verifying transaction reference ${reference} with payment gateway...`,
        });
        const res = await verifyFeePayment(refToVerify);
        if (!mounted) return;

        if (res.status === "success" || res.status === "successful") {
          setFeedback({
            tone: "success",
            message: `Payment of ₦${res.amount.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })} verified successfully! Receipt Number: ${res.receiptNumber}`,
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
          message:
            err?.message ||
            "Failed to verify transaction. Please refresh or check your payment history ledger.",
        });
      } finally {
        if (mounted) {
          setVerifying(false);
          router.replace("/student/fees");
        }
      }
    }

    verifyReturn();
    return () => {
      mounted = false;
    };
  }, [searchParams, router]);

  // Scroll to checkout section smoothly and select target
  function handleSelectTargetAndScroll(target: PaymentTarget) {
    setPayTarget(target);
    setPaymentMode("full");
    setCustomAmount("");
    if (checkoutRef.current) {
      checkoutRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  if (loading || verifying) {
    return (
      <div
        style={{
          padding: "4rem 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <Spinner size={36} />
        <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
          {verifying
            ? "Verifying payment with gateway..."
            : "Loading institutional fee invoice..."}
        </p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <>
        <PageHeader
          eyebrow="Student Bursary"
          title="School Fees & Institutional Levies"
          description="View your approved academic fee schedules and make secure online payments."
        />
        <Alert tone="info" title="No Active Fee Schedule">
          There is currently no approved fee schedule assigned to your academic level
          and programme. Please check back when official session fees are published
          by the Bursary.
        </Alert>
      </>
    );
  }

  // Derive itemized components with defensive fallbacks
  const tutorFee: ComponentFeeDetail = invoice.tutorFee || (() => {
    const item = invoice.feeBreakdown.find(
      (b) =>
        b.feeType === "tuition" ||
        b.category.toLowerCase().includes("tuition") ||
        b.category.toLowerCase().includes("tutor")
    );
    return {
      name: item?.category || "Tutor Fee (Tuition)",
      description:
        item?.description ||
        "Primary institutional academic tuition and lecture delivery fee for the current academic session.",
      amount: item?.amount || 0,
      amountPaid: item?.amountPaid || 0,
      balanceDue: item?.balanceDue ?? (item?.amount || 0),
      isCleared: (item?.balanceDue ?? (item?.amount || 0)) <= 0,
      isApplicable: !!item,
    };
  })();

  const hostelFee: ComponentFeeDetail = invoice.hostelFee || (() => {
    const item = invoice.feeBreakdown.find(
      (b) =>
        b.feeType === "hostel" ||
        b.category.toLowerCase().includes("hostel") ||
        b.category.toLowerCase().includes("accommodation")
    );
    return {
      name: item?.category || "Hostel Accommodation Fee",
      description:
        item?.description ||
        "Campus residence, hall maintenance, utility provision, and hostel accommodation for the session.",
      amount: item?.amount || 0,
      amountPaid: item?.amountPaid || 0,
      balanceDue: item?.balanceDue ?? (item?.amount || 0),
      isCleared: (item?.balanceDue ?? (item?.amount || 0)) <= 0,
      isApplicable: !!item,
    };
  })();

  const otherFees: FeeBreakdownItem[] =
    invoice.otherFees ||
    invoice.feeBreakdown.filter(
      (b) =>
        b.feeType !== "tuition" &&
        b.feeType !== "hostel" &&
        !b.category.toLowerCase().includes("tuition") &&
        !b.category.toLowerCase().includes("tutor") &&
        !b.category.toLowerCase().includes("hostel") &&
        !b.category.toLowerCase().includes("accommodation")
    );

  const otherTotalAmount = otherFees.reduce((acc, f) => acc + (f.amount || 0), 0);
  const otherTotalPaid = otherFees.reduce((acc, f) => acc + (f.amountPaid || 0), 0);
  const otherTotalBalance = otherFees.reduce(
    (acc, f) => acc + (f.balanceDue ?? Math.max(0, (f.amount || 0) - (f.amountPaid || 0))),
    0
  );

  // Core (Tutor + Hostel) joint metrics
  const coreTotalAmount = tutorFee.amount + hostelFee.amount;
  const coreTotalPaid = tutorFee.amountPaid + hostelFee.amountPaid;
  const coreBalanceDue = Math.max(0, tutorFee.balanceDue + hostelFee.balanceDue);
  const isCoreCleared = coreBalanceDue <= 0 && coreTotalAmount > 0;

  // Comprehensive true grand total: Core (Tutor + Hostel) + All Other Levies
  const actualGrandTotal = Math.max(
    Number(invoice.totalAmount) || 0,
    coreTotalAmount + otherTotalAmount
  );
  const actualTotalPaid = Number(invoice.amountPaid) || 0;
  const actualTotalBalance = Math.max(
    0,
    actualGrandTotal - actualTotalPaid
  );

  const summary: InvoiceFeeSummary = invoice.feeSummary || {
    tutorSubtotal: tutorFee.amount,
    hostelSubtotal: hostelFee.amount,
    coreSubtotal: coreTotalAmount,
    corePaid: coreTotalPaid,
    coreBalanceDue: coreBalanceDue,
    otherSubtotal: otherTotalAmount,
    grandTotal: actualGrandTotal,
    totalPaid: actualTotalPaid,
    totalBalanceDue: actualTotalBalance,
    isCleared: invoice.isCleared || actualTotalBalance <= 0,
  };

  const isCleared = invoice.isCleared || actualTotalBalance <= 0;

  // Determine maximum balance payable based on current payTarget
  let targetMaxBalance = coreBalanceDue > 0 ? coreBalanceDue : actualTotalBalance;
  let targetDescription = "Tutor Fee & Hostel Accommodation Fee (Combined)";
  let targetFeeType = "tuition_and_hostel";

  if (payTarget === "core") {
    targetMaxBalance = coreBalanceDue;
    targetDescription = "Tutor Fee & Hostel Accommodation Fee (Combined)";
    targetFeeType = "tuition_and_hostel";
  } else if (payTarget === "other") {
    targetMaxBalance = otherTotalBalance;
    targetDescription = "Other Institutional Fees & Levies";
    targetFeeType = "other";
  } else if (payTarget === "all") {
    targetMaxBalance = actualTotalBalance;
    targetDescription = "All Institutional Fees (Tutor, Hostel & Levies)";
    targetFeeType = "all";
  }

  // Handle Paystack initialization
  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;

    const amountToPay =
      paymentMode === "full" ? targetMaxBalance : parseFloat(customAmount);

    if (isNaN(amountToPay) || amountToPay < 100) {
      setFeedback({
        tone: "error",
        message: "Minimum payable amount is ₦100.00.",
      });
      return;
    }

    if (amountToPay > targetMaxBalance) {
      setFeedback({
        tone: "error",
        message: `Amount cannot exceed the target balance due (₦${targetMaxBalance.toLocaleString(
          "en-NG",
          { minimumFractionDigits: 2 }
        )}).`,
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
        fee_type: targetFeeType,
        description: targetDescription,
      });

      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      } else {
        setFeedback({
          tone: "error",
          message: "Could not obtain payment authorization link from gateway.",
        });
      }
    } catch (err: any) {
      setFeedback({
        tone: "error",
        message: err?.message || "Payment initialization failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const paidPercentage = actualGrandTotal > 0
    ? Math.min(100, Math.round((actualTotalPaid / actualGrandTotal) * 100))
    : 100;

  return (
    <div className={styles.container}>
      {/* Financial Health Hero Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadgeRow}>
            <span className={styles.heroSessionPill}>
              <Calendar size={13} />
              Session {invoice.sessionName}
            </span>
            <span className={styles.heroSessionPill}>
              <GraduationCap size={13} />
              Level: {invoice.levelName}
            </span>
            <span className={styles.heroSessionPill} style={{ fontFamily: "monospace" }}>
              INV: {invoice.invoiceNumber}
            </span>
          </div>

          <h1 className={styles.heroTitle}>School Fees & Financial Clearance</h1>
          <p className={styles.heroDesc}>
            Manage your official session fee obligations, settle approved academic fees via Paystack,
            and access officially verified payment receipts (Form SMS-FR01).
          </p>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.progressWrap}>
            <div className={styles.progressTop}>
              <span>Settlement Progress</span>
              <span style={{ color: "#34d399", fontWeight: 750 }}>{paidPercentage}%</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${paidPercentage}%` }}
              />
            </div>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>
              {isCleared
                ? "All session fees cleared. Examination clearance valid."
                : `₦${actualTotalBalance.toLocaleString("en-NG")} remaining balance due.`}
            </span>
          </div>
        </div>
      </div>

      {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}

      {/* KPI Overview Cards */}
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.cardAccentLine} style={{ background: "#4338ca" }} />
          <div
            className={styles.iconWrap}
            style={{ background: "#e0e7ff", color: "#4338ca" }}
          >
            <FileText size={24} />
          </div>
          <div>
            <div className={styles.metaLabel}>Total Approved Fees</div>
            <div className={styles.metaVal}>
              ₦{actualGrandTotal.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.cardAccentLine} style={{ background: "#059669" }} />
          <div
            className={styles.iconWrap}
            style={{ background: "#d1fae5", color: "#059669" }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className={styles.metaLabel}>Total Amount Paid</div>
            <div className={styles.metaVal} style={{ color: "#059669" }}>
              ₦{invoice.amountPaid.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.cardAccentLine} style={{ background: isCleared ? "#059669" : "#dc2626" }} />
          <div
            className={styles.iconWrap}
            style={{
              background: isCleared ? "#d1fae5" : "#fee2e2",
              color: isCleared ? "#059669" : "#dc2626",
            }}
          >
            <CreditCard size={24} />
          </div>
          <div>
            <div className={styles.metaLabel}>Outstanding Balance</div>
            <div
              className={styles.metaVal}
              style={{ color: isCleared ? "#059669" : "#dc2626" }}
            >
              ₦{actualTotalBalance.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.cardAccentLine} style={{ background: isCleared ? "#059669" : "#d97706" }} />
          <div
            className={styles.iconWrap}
            style={{
              background: isCleared ? "#d1fae5" : "#fef3c7",
              color: isCleared ? "#059669" : "#d97706",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className={styles.metaLabel}>Financial Status</div>
            <div className={styles.metaVal} style={{ fontSize: "1.1rem" }}>
              {isCleared ? "CLEARED" : invoice.statusDisplay.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Core Academic & Residential Fees (Tutor Fee & Hostel Fee - Paid Together) */}
      <div className={styles.categorySection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <GraduationCap size={22} style={{ color: "#2563eb" }} />
            <h2 className={styles.sectionTitle}>
              Core Academic & Residential Fees (Paid Together)
            </h2>
          </div>
          <span className={styles.sectionPill}>
            <ShieldCheck size={14} />
            Mandatory Joint Settlement
          </span>
        </div>

        <div className={styles.cardsGrid}>
          {/* Card A: Tutor Fee (Tuition) */}
          <div className={`${styles.feeComponentCard} ${styles.tutorCardBorder}`}>
            <div>
              <div className={styles.cardTop}>
                <span className={`${styles.cardBadge} ${styles.tutorBadge}`}>
                  Tutor Fee (Tuition)
                </span>
                <span
                  className={`${styles.statusPill} ${
                    tutorFee.isCleared
                      ? styles.statusCleared
                      : tutorFee.amountPaid > 0
                      ? styles.statusPartial
                      : styles.statusPending
                  }`}
                >
                  {tutorFee.isCleared
                    ? "CLEARED"
                    : tutorFee.amountPaid > 0
                    ? "PARTIAL"
                    : "PENDING"}
                </span>
              </div>

              <h3 className={styles.cardHeading}>{tutorFee.name}</h3>
              <p className={styles.cardPurpose}>{tutorFee.description}</p>
            </div>

            <div>
              <div className={styles.cardMetrics}>
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Scheduled Tuition
                  </div>
                  <div className={styles.cardAmount}>
                    ₦{tutorFee.amount.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className={styles.cardSubBalance}>
                  <div>
                    Paid:{" "}
                    <strong style={{ color: "#059669" }}>
                      ₦{tutorFee.amountPaid.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                  <div style={{ marginTop: "0.2rem" }}>
                    Balance:{" "}
                    <strong
                      style={{
                        color: tutorFee.balanceDue > 0 ? "#dc2626" : "#059669",
                      }}
                    >
                      ₦{tutorFee.balanceDue.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                </div>
              </div>

              <div className={styles.cardActionRow}>
                {tutorFee.isCleared ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.8125rem",
                      color: "#059669",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} /> Fully Settled
                  </span>
                ) : (
                  <span className={styles.jointNotice}>
                    <Lock size={13} style={{ color: "#2563eb" }} />
                    Must be paid together with Hostel Fee
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card B: Hostel Accommodation Fee */}
          <div className={`${styles.feeComponentCard} ${styles.hostelCardBorder}`}>
            <div>
              <div className={styles.cardTop}>
                <span className={`${styles.cardBadge} ${styles.hostelBadge}`}>
                  Hostel Residence
                </span>
                <span
                  className={`${styles.statusPill} ${
                    hostelFee.amount === 0
                      ? styles.statusCleared
                      : hostelFee.isCleared
                      ? styles.statusCleared
                      : hostelFee.amountPaid > 0
                      ? styles.statusPartial
                      : styles.statusPending
                  }`}
                >
                  {hostelFee.amount === 0
                    ? "NOT APPLICABLE"
                    : hostelFee.isCleared
                    ? "CLEARED"
                    : hostelFee.amountPaid > 0
                    ? "PARTIAL"
                    : "PENDING"}
                </span>
              </div>

              <h3 className={styles.cardHeading}>{hostelFee.name}</h3>
              <p className={styles.cardPurpose}>{hostelFee.description}</p>
            </div>

            <div>
              <div className={styles.cardMetrics}>
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Scheduled Hostel
                  </div>
                  <div className={styles.cardAmount}>
                    ₦{hostelFee.amount.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className={styles.cardSubBalance}>
                  <div>
                    Paid:{" "}
                    <strong style={{ color: "#059669" }}>
                      ₦{hostelFee.amountPaid.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                  <div style={{ marginTop: "0.2rem" }}>
                    Balance:{" "}
                    <strong
                      style={{
                        color: hostelFee.balanceDue > 0 ? "#dc2626" : "#059669",
                      }}
                    >
                      ₦{hostelFee.balanceDue.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                </div>
              </div>

              <div className={styles.cardActionRow}>
                {hostelFee.amount === 0 ? (
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-muted)",
                    }}
                  >
                    No hostel fee scheduled for this level
                  </span>
                ) : hostelFee.isCleared ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.8125rem",
                      color: "#059669",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} /> Fully Settled
                  </span>
                ) : (
                  <span className={styles.jointNotice}>
                    <Lock size={13} style={{ color: "#d97706" }} />
                    Must be paid together with Tutor Fee
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Joint Core Fees Settlement Bar */}
        <div className={styles.jointCoreBar}>
          <div className={styles.jointCoreInfo}>
            <div className={styles.jointCoreTitle}>
              <ShieldCheck size={20} style={{ color: "#2563eb" }} />
              <span>Combined Tutor & Hostel Fee Obligation</span>
            </div>
            <div className={styles.jointCoreSub}>
              Institutional policy requires Tutor Fee and Hostel Accommodation Fee to be paid together.
            </div>
          </div>

          <div className={styles.jointCoreMetrics}>
            <div>
              <div className={styles.jointMetricLabel}>Summed Amount</div>
              <div className={styles.jointMetricVal}>
                ₦{coreTotalAmount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div>
              <div className={styles.jointMetricLabel}>Total Paid</div>
              <div className={styles.jointMetricVal} style={{ color: "#059669" }}>
                ₦{coreTotalPaid.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div>
              <div className={styles.jointMetricLabel}>Combined Balance Due</div>
              <div
                className={styles.jointMetricVal}
                style={{ color: coreBalanceDue > 0 ? "#dc2626" : "#059669" }}
              >
                ₦{coreBalanceDue.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          <div>
            {isCoreCleared ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.875rem",
                  color: "#059669",
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={20} /> Tutor & Hostel Fees Fully Settled
              </span>
            ) : (
              <button
                type="button"
                className={`${styles.quickPayBtn} ${styles.quickPayTutor}`}
                style={{ padding: "0.65rem 1.25rem", fontSize: "0.875rem" }}
                onClick={() => handleSelectTargetAndScroll("core")}
              >
                <CreditCard size={16} />
                Pay Tutor & Hostel Together (₦
                {coreBalanceDue.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
                )
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Other Institutional Fees & Levies (Separated) */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <Layers size={20} style={{ color: "#059669" }} />
            Other Institutional Fees & Levies (Separated)
          </div>
          <span
            style={{
              fontSize: "0.8rem",
              color: "var(--color-muted)",
              fontWeight: 500,
            }}
          >
            Configured by the Admin Office
          </span>
        </div>

        {otherFees.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--color-muted)",
              fontSize: "0.9rem",
            }}
          >
            No additional institutional levies or department fees are currently
            scheduled for this session.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.breakdownTable}>
            <thead>
              <tr>
                <th style={{ width: "28%" }}>Fee Head / Levy</th>
                <th style={{ width: "38%" }}>What It Stands For (Purpose)</th>
                <th style={{ textAlign: "right", width: "14%" }}>Amount (₦)</th>
                <th style={{ textAlign: "right", width: "10%" }}>Balance (₦)</th>
                <th style={{ textAlign: "center", width: "10%" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {otherFees.map((item, idx) => {
                const bal =
                  item.balanceDue ??
                  Math.max(0, (item.amount || 0) - (item.amountPaid || 0));
                const itemCleared = bal <= 0;
                return (
                  <tr key={idx}>
                    <td>
                      <div className={styles.feeTitle}>{item.category}</div>
                      <span className={styles.otherFeeTag}>Institutional Levy</span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.35rem",
                        }}
                      >
                        <Info
                          size={15}
                          style={{
                            color: "var(--color-primary)",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        />
                        <span className={styles.feePurpose}>
                          {item.description ||
                            "Official administrative & departmental service charge approved by the Admin Office."}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      ₦{item.amount.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        color: bal > 0 ? "#dc2626" : "#059669",
                      }}
                    >
                      ₦{bal.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`${styles.statusPill} ${
                          itemCleared ? styles.statusCleared : styles.statusPending
                        }`}
                      >
                        {itemCleared ? "SETTLED" : "PENDING"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr
                style={{
                  background: "var(--color-surface-subtle, #f8fafc)",
                  fontWeight: 700,
                }}
              >
                <td colSpan={2}>Subtotal Other Levies</td>
                <td style={{ textAlign: "right", color: "var(--color-ink)" }}>
                  ₦{otherTotalAmount.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    color: otherTotalBalance > 0 ? "#dc2626" : "#059669",
                  }}
                >
                  ₦{otherTotalBalance.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td style={{ textAlign: "center" }}>
                  {otherTotalBalance > 0 && (
                    <button
                      type="button"
                      className={`${styles.quickPayBtn} ${styles.quickPayOther}`}
                      style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
                      onClick={() => handleSelectTargetAndScroll("other")}
                    >
                      Pay Levies
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* SECTION 3: Summed Up Settlement & Checkout Console */}
      <div className={styles.mainLayout} ref={checkoutRef}>
        {/* Left: Summed Up Breakdown Table */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <Receipt size={20} style={{ color: "var(--color-primary)" }} />
              Summed Fee Schedule & Total Breakdown
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--color-muted)",
                fontWeight: 500,
              }}
            >
              Form SMS-FR01 Reference
            </span>
          </div>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>Tutor Fee (Tuition)</span>
              <strong style={{ color: "#1d4ed8" }}>
                ₦{tutorFee.amount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>

            <div className={styles.summaryRow}>
              <span>Hostel Accommodation Fee</span>
              <strong style={{ color: "#b45309" }}>
                ₦{hostelFee.amount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>

            <div
              className={styles.summaryRow}
              style={{
                background: "#eff6ff",
                padding: "0.35rem 0.6rem",
                borderRadius: "6px",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "#1e3a8a" }}>
                Core Subtotal (Tutor + Hostel Paid Together)
              </span>
              <span style={{ color: "#1e3a8a" }}>
                ₦{coreTotalAmount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className={styles.summaryRow}>
              <span>Other Institutional Levies Subtotal</span>
              <strong style={{ color: "#15803d" }}>
                ₦{otherTotalAmount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>

            <div className={styles.summaryRowGrand}>
              <span>Summed Grand Total (Approved Fees)</span>
              <span style={{ color: "var(--color-primary)" }}>
                ₦{actualGrandTotal.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.825rem",
                color: "var(--color-muted)",
                paddingTop: "0.25rem",
              }}
            >
              <span>Total Amount Paid to Date:</span>
              <strong style={{ color: "#059669" }}>
                ₦{invoice.amountPaid.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.9rem",
                fontWeight: 700,
                color: invoice.balanceDue > 0 ? "#dc2626" : "#059669",
              }}
            >
              <span>Net Outstanding Balance:</span>
              <span>
                ₦{invoice.balanceDue.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <table
            className={styles.breakdownTable}
            style={{ marginTop: "1.25rem" }}
          >
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.feeBreakdown.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.category}</div>
                    {item.feeType && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--color-muted)",
                          textTransform: "capitalize",
                        }}
                      >
                        {item.feeType === "tuition"
                          ? "Tutor Fee (Core)"
                          : item.feeType === "hostel"
                          ? "Hostel Residence (Core)"
                          : "Institutional Levy"}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    ₦{item.amount.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Payment Console with Tutor+Hostel Together option */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <CreditCard size={20} style={{ color: "var(--color-primary)" }} />
              Fee Payment & Checkout
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                background: "#f1f5f9",
                padding: "0.2rem 0.5rem",
                borderRadius: 4,
              }}
            >
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
                All approved academic tutor fees, hostel accommodation fees, and
                institutional levies for this session have been fully settled. You
                are eligible for examination clearance and course registration
                validation.
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
              {/* Payment Target Options: Tutor & Hostel Paid Together */}
              <div>
                <label className={styles.inputLabel} style={{ marginBottom: "0.4rem" }}>
                  Choose What You Want to Pay:
                </label>
                <div className={styles.targetGroup}>
                  {/* Option 1: Tutor & Hostel Together */}
                  <button
                    type="button"
                    className={`${styles.targetBtn} ${
                      payTarget === "core" ? styles.targetBtnActive : ""
                    }`}
                    onClick={() => {
                      setPayTarget("core");
                      setPaymentMode("full");
                      setCustomAmount("");
                    }}
                    disabled={coreBalanceDue <= 0}
                  >
                    <span className={styles.targetBtnTitle}>
                      Tutor & Hostel (Together)
                    </span>
                    <span className={styles.targetBtnSub}>
                      {coreBalanceDue <= 0
                        ? "Settled"
                        : `Bal: ₦${coreBalanceDue.toLocaleString("en-NG")}`}
                    </span>
                  </button>

                  {/* Option 2: Other Levies (if present) */}
                  {otherFees.length > 0 && (
                    <button
                      type="button"
                      className={`${styles.targetBtn} ${
                        payTarget === "other" ? styles.targetBtnActive : ""
                      }`}
                      onClick={() => {
                        setPayTarget("other");
                        setPaymentMode("full");
                        setCustomAmount("");
                      }}
                      disabled={otherTotalBalance <= 0}
                    >
                      <span className={styles.targetBtnTitle}>Other Levies</span>
                      <span className={styles.targetBtnSub}>
                        {otherTotalBalance <= 0
                          ? "Settled"
                          : `Bal: ₦${otherTotalBalance.toLocaleString("en-NG")}`}
                      </span>
                    </button>
                  )}

                  {/* Option 3: Pay All Fees Summed Together */}
                  {otherFees.length > 0 && (
                    <button
                      type="button"
                      className={`${styles.targetBtn} ${
                        payTarget === "all" ? styles.targetBtnActive : ""
                      }`}
                      onClick={() => {
                        setPayTarget("all");
                        setPaymentMode("full");
                        setCustomAmount("");
                      }}
                    >
                      <span className={styles.targetBtnTitle}>
                        All Fees (Summed Up)
                      </span>
                      <span className={styles.targetBtnSub}>
                        Bal: ₦{actualTotalBalance.toLocaleString("en-NG")}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Mode (Full Balance vs Custom Installment) */}
              <div className={styles.radioGroup}>
                <label
                  className={`${styles.radioLabel} ${
                    paymentMode === "full" ? styles.radioLabelActive : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payMode"
                    value="full"
                    checked={paymentMode === "full"}
                    onChange={() => setPaymentMode("full")}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      Pay Full Balance for {payTarget === "core" ? "Tutor & Hostel (Combined)" : payTarget === "other" ? "Other Levies" : "All Fees"}
                    </div>
                    <div
                      style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}
                    >
                      ₦{targetMaxBalance.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ({targetDescription})
                    </div>
                  </div>
                </label>

                <label
                  className={`${styles.radioLabel} ${
                    paymentMode === "custom" ? styles.radioLabelActive : ""
                  }`}
                >
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
                    <div
                      style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}
                    >
                      Specify custom installment amount towards this obligation (&ge; ₦100)
                    </div>
                  </div>
                </label>
              </div>

              {paymentMode === "custom" && (
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Installment Amount (₦)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max={targetMaxBalance}
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
                disabled={submitting || targetMaxBalance <= 0}
                className={styles.payButton}
              >
                {submitting ? (
                  <>
                    <Spinner size={18} />
                    <span>Connecting to Paystack...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>
                      Pay ₦
                      {(paymentMode === "full"
                        ? targetMaxBalance
                        : parseFloat(customAmount) || 0
                      ).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      with Paystack
                    </span>
                  </>
                )}
              </button>

              <div className={styles.securityNote}>
                <ShieldCheck size={16} style={{ color: "#059669" }} />
                <span>
                  Secured with 256-bit SSL & Server-to-Server Gateway Verification
                </span>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* SECTION 4: Payment History Ledger */}
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
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--color-muted)",
            }}
          >
            No payment transactions recorded for this invoice yet.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Fee Purpose / Allocation</th>
                <th>Reference</th>
                <th>Amount (₦)</th>
                <th>Channel / Gateway</th>
                <th>Date Paid</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => {
                const typeLabel =
                  p.feeType === "tuition_and_hostel" || p.feeType === "core"
                    ? "Tutor Fee & Hostel Fee (Combined)"
                    : p.feeType === "tuition"
                    ? "Tutor Fee (Tuition)"
                    : p.feeType === "hostel"
                    ? "Hostel Residence"
                    : p.feeType === "other"
                    ? "Institutional Levy"
                    : "All Institutional Fees";

                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, fontFamily: "monospace" }}>
                      {p.receiptNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{typeLabel}</div>
                      {p.description && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-muted)",
                          }}
                        >
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        color: "var(--color-muted)",
                      }}
                    >
                      {p.reference}
                    </td>
                    <td style={{ fontWeight: 600, color: "#059669" }}>
                      ₦{p.amount.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>{p.gatewayDisplay}</td>
                    <td>
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString()
                        : new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        style={{
                          background:
                            p.status === "success" ? "#d1fae5" : "#fef3c7",
                          color:
                            p.status === "success" ? "#065f46" : "#92400e",
                          padding: "0.2rem 0.5rem",
                          borderRadius: 4,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
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
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentFeesPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: "4rem 0",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Spinner size={32} />
        </div>
      }
    >
      <FeesContent />
    </Suspense>
  );
}
