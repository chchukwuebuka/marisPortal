"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Download,
  Calendar,
  Lock,
  Printer,
  ShieldCheck,
  User,
  ExternalLink,
} from "lucide-react";
import { Alert, Spinner } from "@/components/ui";
import { getOfficialFeeReceipt } from "@/services/students";
import { API_BASE_URL } from "@/lib/api";
import type { OfficialFeeReceipt } from "@/types/student";
import styles from "./receipt.module.css";

function ReceiptContent() {
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("id");

  const [receipt, setReceipt] = useState<OfficialFeeReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!receiptId) {
      setError("No receipt identifier specified in URL query.");
      setLoading(false);
      return;
    }

    let mounted = true;
    async function loadReceipt() {
      try {
        setLoading(true);
        const data = await getOfficialFeeReceipt(receiptId!);
        if (mounted) setReceipt(data);
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Failed to retrieve official receipt from server.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReceipt();
    return () => {
      mounted = false;
    };
  }, [receiptId]);

  function handleCopyReceipt() {
    if (!receipt) return;
    navigator.clipboard.writeText(receipt.receiptNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
        }}
      >
        <Spinner size={42} />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 600, color: "#1e3a8a", margin: "0 0 4px 0" }}>
            Retrieving Official Revenue Record
          </p>
          <p style={{ color: "var(--color-muted)", fontSize: "0.85rem", margin: 0 }}>
            Verifying transaction ledger with Marist Bursary database...
          </p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1rem" }}>
        <Alert tone="error" title="Receipt Not Found">
          {error || "The requested fee payment receipt could not be retrieved. Please confirm the receipt number."}
        </Alert>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
          <Link href="/student/fees" className={styles.backBtn}>
            <ArrowLeft size={16} />
            Back to School Fees
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Action Toolbar */}
      <div className={styles.actionToolbar}>
        <div className={styles.toolbarLeft}>
          <Link href="/student/fees" className={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Back to Fees</span>
          </Link>
          <button
            type="button"
            onClick={handleCopyReceipt}
            className={styles.backBtn}
            title="Copy Receipt Number"
          >
            {copied ? <Check size={15} style={{ color: "#059669" }} /> : <Copy size={15} />}
            <span>{copied ? "Copied!" : "Copy Receipt #"}</span>
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            onClick={() => window.print()}
            className={styles.printBtn}
          >
            <Printer size={16} />
            <span>Print Official Receipt</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (receiptId) {
                window.open(`${API_BASE_URL}/fees/receipts/${receiptId}/pdf/`, "_blank");
              }
            }}
            className={styles.pdfBtn}
          >
            <Download size={16} />
            <span>Download Official PDF (QR)</span>
          </button>
        </div>
      </div>

      {/* Official Form SMS-FR01 Security Document */}
      <div className={styles.receiptCard} id="printable-receipt">
        {/* Subtle Watermark Seal */}
        <div className={styles.receiptWatermark}>
          <Image
            src="/image/logo.png"
            alt=""
            width={440}
            height={440}
            style={{ objectFit: "contain" }}
          />
        </div>

        <div className={styles.receiptCardContent}>
          {/* Institution Header */}
          <div className={styles.receiptHeader}>
            <div className={styles.crestBox}>
              <Image
                src="/image/logo.png"
                alt="Marist Crest"
                width={64}
                height={64}
                style={{ objectFit: "contain" }}
                priority
              />
            </div>

            <div className={styles.headerText}>
              <h1 className={styles.institutionName}>MARIST POLYTECHNIC</h1>
              <p className={styles.subHeader}>
                Directorate of Finance & Accounts • Office of the Bursar
              </p>
              <p className={styles.institutionAddress}>
                Permanent Site: Marist Boulevard, Umuchigbo, Iji-Nike, Emene, Enugu State, Nigeria
              </p>
              <div className={styles.receiptTitleWrap}>
                <div className={styles.receiptTitle}>
                  <ShieldCheck size={16} />
                  <span>Student Fee Payment Receipt</span>
                </div>
                <span className={styles.copyBadge}>Original Student Copy</span>
              </div>
            </div>

            <div className={styles.headerRightMeta}>
              <span className={styles.formCodeTag}>SMS-FR01</span>
              {/* Simulated Security Barcode */}
              <div className={styles.barcodeSim} title="Document Archive Code">
                <span className={styles.barcodeBar} style={{ width: 3 }} />
                <span className={styles.barcodeBar} style={{ width: 1 }} />
                <span className={styles.barcodeBar} style={{ width: 4 }} />
                <span className={styles.barcodeBar} style={{ width: 2 }} />
                <span className={styles.barcodeBar} style={{ width: 1 }} />
                <span className={styles.barcodeBar} style={{ width: 3 }} />
                <span className={styles.barcodeBar} style={{ width: 2 }} />
                <span className={styles.barcodeBar} style={{ width: 4 }} />
                <span className={styles.barcodeBar} style={{ width: 1 }} />
                <span className={styles.barcodeBar} style={{ width: 3 }} />
                <span className={styles.barcodeBar} style={{ width: 2 }} />
              </div>
              <span style={{ fontSize: "0.6rem", color: "#64748b", fontFamily: "monospace" }}>
                SEC-VERIFIED
              </span>
            </div>
          </div>

          {/* Security Metadata Ribbon */}
          <div className={styles.metaBar}>
            <div className={styles.metaItem}>
              <span className={styles.metaItemLabel}>
                <ShieldCheck size={13} style={{ color: "#1e3a8a" }} />
                Receipt Number
              </span>
              <span className={styles.receiptNumberVal}>
                {receipt.receiptNumber}
              </span>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaItemLabel}>
                <Calendar size={13} />
                Date & Time Paid
              </span>
              <span className={styles.metaItemVal}>
                {new Date(receipt.datePaid).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaItemLabel}>
                <Lock size={13} />
                Payment Reference
              </span>
              <span
                className={styles.metaItemVal}
                style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#334155" }}
              >
                {receipt.reference}
              </span>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaItemLabel}>
                <CreditCard size={13} />
                Payment Channel
              </span>
              <span className={styles.metaItemVal} style={{ textTransform: "uppercase" }}>
                {receipt.gateway} ({receipt.channel})
              </span>
            </div>
          </div>

          {/* Student Bio-Data & Academic Particulars */}
          <div className={styles.sectionHeading}>
            <User size={15} />
            <span>Student Bio-Data & Academic Records</span>
          </div>

          <div className={styles.studentBioWrap}>
            <div className={styles.studentGrid}>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Full Legal Name:</span>
                <span className={styles.gridValue}>{receipt.student.fullName}</span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Matriculation No:</span>
                <span
                  className={styles.gridValue}
                  style={{
                    fontFamily: "monospace",
                    color: "#1e3a8a",
                    background: "#f1f5f9",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {receipt.student.matricNumber}
                </span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Student ID:</span>
                <span className={styles.gridValue} style={{ fontFamily: "monospace" }}>
                  {receipt.student.studentId}
                </span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Academic Programme:</span>
                <span className={styles.gridValue}>{receipt.student.programme}</span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Academic Department:</span>
                <span className={styles.gridValue}>{receipt.student.department}</span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Faculty / School:</span>
                <span className={styles.gridValue}>{receipt.student.school}</span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Academic Session:</span>
                <span className={styles.gridValue}>{receipt.session}</span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Level & Semester:</span>
                <span className={styles.gridValue}>
                  {receipt.level} • {receipt.semester}
                </span>
              </div>
            </div>

            {/* Passport Photo Slot */}
            <div className={styles.photoBox}>
              {receipt.student.photo ? (
                <Image
                  src={receipt.student.photo}
                  alt={receipt.student.fullName}
                  width={90}
                  height={105}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <User size={32} />
                  <span>Passport</span>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Fee Breakdown */}
          <div className={styles.sectionHeading}>
            <CreditCard size={15} />
            <span>Scheduled Fee Revenue Line Items</span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "8%", textAlign: "center" }}>S/N</th>
                  <th style={{ width: "62%" }}>Fee Head / Revenue Allocation Category</th>
                  <th style={{ width: "30%", textAlign: "right" }}>Approved Amount (₦)</th>
                </tr>
              </thead>
              <tbody>
                {receipt.breakdown.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.category}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      ₦{item.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Ledger & Reconciliation Box */}
          <div className={styles.ledgerBox}>
            <div className={styles.ledgerRow}>
              <span>Total Session Approved Fee (Invoice Total):</span>
              <span className={styles.ledgerRowVal}>
                ₦{receipt.totalInvoiceAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={styles.ledgerRow} style={{ background: "rgba(5, 150, 105, 0.05)", padding: "0.4rem 0.5rem", borderRadius: 6 }}>
              <span style={{ color: "#047857", fontWeight: 600 }}>
                Amount Paid In This Transaction:
              </span>
              <span style={{ fontWeight: 800, color: "#059669", fontSize: "1rem" }}>
                ₦{receipt.amountPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={styles.ledgerRow}>
              <span>Cumulative Fees Paid to Date:</span>
              <span className={styles.ledgerRowVal}>
                ₦{receipt.totalPaidSoFar.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={styles.ledgerTotalRow}>
              <span>Net Outstanding Balance Remaining:</span>
              <span>
                {receipt.isCleared ? (
                  <span className={styles.clearancePill}>
                    <CheckCircle2 size={16} />
                    ₦0.00 (FEES CLEARED)
                  </span>
                ) : (
                  <span style={{ color: "#dc2626" }}>
                    ₦{receipt.balanceRemaining.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Footer, Verification Seal & Signatures */}
          <div className={styles.footerArea}>
            {/* Electronic Verification Stamp */}
            <div className={styles.verificationStamp}>
              <div className={styles.stampIconWrap}>
                <CheckCircle2 size={18} />
              </div>
              <span>Officially Verified & Archived</span>
              <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "#047857", marginTop: "2px" }}>
                Bursary Revenue Division
              </span>
              <span style={{ fontSize: "0.58rem", color: "#059669", fontFamily: "monospace", marginTop: "4px" }}>
                AUTH: {receipt.receiptNumber}
              </span>
            </div>

            <div className={styles.auditFootnote}>
              <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#1e3a8a" }}>
                Electronic Document Authentication
              </p>
              <p style={{ margin: 0 }}>
                This receipt is legally certified and recorded in the Marist Polytechnic Electronic Financial Database.
                Tampering or forged duplication renders this receipt void.
              </p>
            </div>

            {/* Signature Box */}
            <div className={styles.signatureBox}>
              <div className={styles.signatureLine} />
              <div className={styles.signatureTitle}>Bursar / Revenue Officer</div>
              <div className={styles.signatureSub}>Marist Polytechnic, Enugu</div>
            </div>
          </div>

          {/* Security Disclaimer */}
          <div className={styles.securityFootnote}>
            Document Reference: FORM SMS-FR01 • Generated by Marist Polytechnic Student Information System (SIS) • Generated on {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentFeeReceiptPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: "5rem 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <Spinner size={36} />
          <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
            Loading student fee receipt...
          </p>
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  );
}
