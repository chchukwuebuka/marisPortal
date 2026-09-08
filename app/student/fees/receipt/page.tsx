"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { Alert, Spinner } from "@/components/ui";
import { getOfficialFeeReceipt } from "@/services/students";
import type { OfficialFeeReceipt } from "@/types/student";
import styles from "./receipt.module.css";

function ReceiptContent() {
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("id");

  const [receipt, setReceipt] = useState<OfficialFeeReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptId) {
      setError("No receipt identifier specified.");
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

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <Spinner size={36} />
        <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Loading official receipt...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div style={{ maxWidth: 650, margin: "3rem auto" }}>
        <Alert tone="error" title="Receipt Not Found">
          {error || "The requested fee payment receipt could not be retrieved. Please confirm the receipt number."}
        </Alert>
        <div style={{ marginTop: "1rem" }}>
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
        <Link href="/student/fees" className={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Fees
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className={styles.printBtn}
        >
          <Printer size={16} />
          Print Official Receipt (SMS-FR01)
        </button>
      </div>

      {/* Official Form SMS-FR01 Document */}
      <div className={styles.receiptCard}>
        {/* Header */}
        <div className={styles.receiptHeader}>
          <Image
            src="/image/logo.png"
            alt="Marist Crest"
            width={64}
            height={64}
            style={{ objectFit: "contain" }}
          />
          <div className={styles.headerText}>
            <h1 className={styles.institutionName}>MARIST POLYTECHNIC</h1>
            <p className={styles.subHeader}>
              Office of the Bursar • Student Accounts & Revenue Division
            </p>
            <div className={styles.receiptTitle}>
              STUDENT FEE PAYMENT RECEIPT (FORM SMS-FR01)
            </div>
          </div>
          <div style={{ width: 64 }} />
        </div>

        {/* Transaction Metadata */}
        <div className={styles.metaBar}>
          <div className={styles.metaItem}>
            <span className={styles.metaItemLabel}>Receipt Number:</span>
            <span className={styles.metaItemVal} style={{ fontFamily: "monospace", color: "#1e3a8a" }}>
              {receipt.receiptNumber}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaItemLabel}>Date Paid:</span>
            <span className={styles.metaItemVal}>
              {new Date(receipt.datePaid).toLocaleString()}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaItemLabel}>Payment Reference:</span>
            <span className={styles.metaItemVal} style={{ fontFamily: "monospace" }}>
              {receipt.reference}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaItemLabel}>Payment Channel:</span>
            <span className={styles.metaItemVal} style={{ textTransform: "uppercase" }}>
              {receipt.gateway} ({receipt.channel})
            </span>
          </div>
        </div>

        {/* Student Information */}
        <div className={styles.sectionHeading}>Student Bio-Data & Academic Records</div>
        <div className={styles.studentGrid}>
          <div className={styles.gridRow}>
            <span className={styles.gridLabel}>Full Name:</span>
            <span className={styles.gridValue}>{receipt.student.fullName}</span>
          </div>
          <div className={styles.gridRow}>
            <span className={styles.gridLabel}>Matriculation No:</span>
            <span className={styles.gridValue} style={{ fontFamily: "monospace" }}>
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
            <span className={styles.gridLabel}>Programme:</span>
            <span className={styles.gridValue}>{receipt.student.programme}</span>
          </div>
          <div className={styles.gridRow}>
            <span className={styles.gridLabel}>Department:</span>
            <span className={styles.gridValue}>{receipt.student.department}</span>
          </div>
          <div className={styles.gridRow}>
            <span className={styles.gridLabel}>School:</span>
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

        {/* Itemized Fee Breakdown */}
        <div className={styles.sectionHeading}>Scheduled Fee Breakdown</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fee Category</th>
              <th style={{ textAlign: "right" }}>Approved Amount (₦)</th>
            </tr>
          </thead>
          <tbody>
            {receipt.breakdown.map((item, idx) => (
              <tr key={idx}>
                <td>{item.category}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>
                  ₦{item.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Ledger Progress */}
        <div className={styles.ledgerBox}>
          <div className={styles.ledgerRow}>
            <span>Total Invoiced Fee:</span>
            <span style={{ fontWeight: 600 }}>
              ₦{receipt.totalInvoiceAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className={styles.ledgerRow}>
            <span>Amount Paid In This Transaction:</span>
            <span style={{ fontWeight: 700, color: "#059669" }}>
              ₦{receipt.amountPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className={styles.ledgerRow}>
            <span>Cumulative Amount Paid So Far:</span>
            <span style={{ fontWeight: 600 }}>
              ₦{receipt.totalPaidSoFar.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className={styles.ledgerTotalRow}>
            <span>Outstanding Balance Remaining:</span>
            <span style={{ color: receipt.isCleared ? "#059669" : "#dc2626" }}>
              {receipt.isCleared
                ? "₦0.00 (CLEARED)"
                : `₦${receipt.balanceRemaining.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        {/* Footer & Verification Stamp */}
        <div className={styles.footerArea}>
          <div className={styles.verificationStamp}>
            <CheckCircle2 size={24} style={{ marginBottom: "0.25rem" }} />
            <span>OFFICIALLY VERIFIED</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 500, marginTop: "0.1rem" }}>
              BURSARY REVENUE DIVISION
            </span>
          </div>

          <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#64748b", maxWidth: 280 }}>
            This receipt is electronically verified and archived in the Marist Polytechnic Student Information System.
          </div>

          <div className={styles.signatureBox}>
            <div className={styles.signatureLine} />
            <div className={styles.signatureTitle}>Bursar / Authorized Officer</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentFeeReceiptPage() {
  return (
    <Suspense fallback={<div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}><Spinner size={32} /></div>}>
      <ReceiptContent />
    </Suspense>
  );
}
