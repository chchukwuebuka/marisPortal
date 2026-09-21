"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Award,
  BookOpen,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  FolderArchive,
  GraduationCap,
  Printer,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, Spinner } from "@/components/ui";
import { useStudent } from "@/providers/StudentProvider";
import { getMyDocuments } from "@/services/students";
import { initials, resolveMediaUrl } from "@/lib/format";
import type { StudentDocumentsResponse } from "@/types/student";
import styles from "./documents.module.css";

type TabType = "all" | "academic" | "financial" | "credentials";

export default function StudentDocumentsPage() {
  const { student } = useStudent();
  const [docData, setDocData] = useState<StudentDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const fullName = student?.user?.fullName || "Student";
  const photoUrl = resolveMediaUrl(student?.profile?.photoUrl);

  useEffect(() => {
    let mounted = true;
    async function loadDocs() {
      try {
        setLoading(true);
        const data = await getMyDocuments();
        if (mounted) setDocData(data);
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Failed to load student documents.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDocs();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
        <Spinner size={36} />
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div style={{ maxWidth: 650, margin: "2rem auto" }}>
        <Alert tone="error" title="Error Loading Documents">
          {error || "Unable to retrieve student document repository."}
        </Alert>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Official Credentials & Records"
        title="Student Document Centre"
        description="Access and download your official letters, course registration forms, fee receipts, and academic result slips."
      />

      {/* Top Counts Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.iconBox} style={{ background: "#e0e7ff", color: "#4338ca" }}>
            <FolderArchive size={22} />
          </div>
          <div>
            <div className={styles.statLabel}>Total Documents</div>
            <div className={styles.statNum}>{docData.counts.totalDocuments}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconBox} style={{ background: "#dbeafe", color: "#1d4ed8" }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className={styles.statLabel}>Registration Slips</div>
            <div className={styles.statNum}>{docData.counts.registrationForms}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconBox} style={{ background: "#d1fae5", color: "#059669" }}>
            <CreditCard size={22} />
          </div>
          <div>
            <div className={styles.statLabel}>Fee Receipts</div>
            <div className={styles.statNum}>{docData.counts.feeReceipts}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconBox} style={{ background: "#fef3c7", color: "#d97706" }}>
            <Award size={22} />
          </div>
          <div>
            <div className={styles.statLabel}>Result Slips</div>
            <div className={styles.statNum}>{docData.counts.resultSlips}</div>
          </div>
        </div>
      </div>

      {/* Digital Student ID Badge */}
      <div className={styles.idCardSection}>
        <div className={styles.idCardPhysical}>
          <div className={styles.idCardTop}>
            <Image
              src="/image/logo.png"
              alt="Logo"
              width={28}
              height={28}
              className={styles.idCrest}
            />
            <span className={styles.idInstTitle}>Marist Polytechnic</span>
          </div>

          <div className={styles.idCardBody}>
            <div className={styles.idPhotoWrap}>
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={fullName}
                  className={styles.idPhotoImg}
                />
              ) : (
                initials(fullName)
              )}
            </div>

            <div className={styles.idDetails}>
              <div className={styles.idStudentName}>{fullName}</div>
              <div className={styles.idMatric}>{docData.idCard.matricNumber}</div>
              <div className={styles.idProg}>{docData.idCard.programme}</div>
            </div>
          </div>

          <div className={styles.idCardBottom}>
            <span>STUDENT IDENTITY CARD</span>
            <span className={styles.idBarcode}>*MARIST-SMS*</span>
          </div>
        </div>

        <div className={styles.idTextDetails}>
          <h3 className={styles.idTitle}>Digital Student Identity Card</h3>
          <p className={styles.idDesc}>
            Your official digital student identity credential. Verified with active matriculation number ({docData.idCard.matricNumber}) and registered institutional bio-data.
          </p>
          <div className={styles.idActions}>
            <button
              type="button"
              onClick={() => window.print()}
              className={styles.idPrintBtn}
            >
              <Printer size={16} />
              Print ID Badge
            </button>
            <Link
              href="/student/profile"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1rem",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Update Photo in Biodata
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterBar}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Documents ({docData.counts.totalDocuments})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "academic" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("academic")}
          >
            Academic Slips ({docData.counts.registrationForms + docData.counts.resultSlips})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "financial" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("financial")}
          >
            Fee Receipts ({docData.counts.feeReceipts})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "credentials" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("credentials")}
          >
            Admission & ID (2)
          </button>
        </div>
      </div>

      {/* Document Grid */}
      <div className={styles.docGrid}>
        {/* 1. Admission Letter */}
        {(activeTab === "all" || activeTab === "credentials") && (
          <div className={styles.docCard}>
            <div>
              <div className={styles.docHeader}>
                <div className={styles.docIcon} style={{ background: "#e0e7ff", color: "#4338ca" }}>
                  <UserCheck size={22} />
                </div>
                <span className={styles.statusPill} style={{ background: "#ecfdf5", color: "#065f46" }}>
                  OFFICIALLY ADMITTED
                </span>
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <span className={styles.docCode}>FORM SMS-ADM01</span>
                <h4 className={styles.docTitle}>{docData.admissionLetter.title}</h4>
                <p className={styles.docDetails}>
                  Official Marist Polytechnic provisional admission letter and enrollment confirmation.
                </p>
              </div>
            </div>
            <div className={styles.docActions}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Institutional Record</span>
              <Link
                href="/applicant/admission"
                className={styles.downloadLink}
              >
                <ExternalLink size={14} />
                View Offer
              </Link>
            </div>
          </div>
        )}

        {/* 2. Course Registration Slips (SMS-CR01) */}
        {(activeTab === "all" || activeTab === "academic") &&
          docData.registrationForms.map((rf) => (
            <div key={`rf-${rf.id}`} className={styles.docCard}>
              <div>
                <div className={styles.docHeader}>
                  <div className={styles.docIcon} style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                    <BookOpen size={22} />
                  </div>
                  <span className={styles.statusPill} style={{
                    background: rf.status === "approved" ? "#ecfdf5" : "#fef3c7",
                    color: rf.status === "approved" ? "#065f46" : "#92400e",
                  }}>
                    {rf.status?.toUpperCase() ?? "PENDING"}
                  </span>
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <span className={styles.docCode}>{rf.formCode}</span>
                  <h4 className={styles.docTitle}>{rf.title}</h4>
                  <p className={styles.docDetails}>
                    {rf.level} • {rf.totalCredits} Registered Units • Approved by Academic Registry
                  </p>
                </div>
              </div>
              <div className={styles.docActions}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  {rf.session}
                </span>
                <Link
                  href={rf.frontendUrl}
                  className={styles.downloadLink}
                >
                  <Download size={14} />
                  View Form SMS-CR01
                </Link>
              </div>
            </div>
          ))}

        {/* 3. Fee Receipts (SMS-FR01) */}
        {(activeTab === "all" || activeTab === "financial") &&
          docData.feeReceipts.map((fr) => (
            <div key={`fr-${fr.receiptNumber}`} className={styles.docCard}>
              <div>
                <div className={styles.docHeader}>
                  <div className={styles.docIcon} style={{ background: "#d1fae5", color: "#059669" }}>
                    <CreditCard size={22} />
                  </div>
                  <span className={styles.statusPill} style={{ background: "#ecfdf5", color: "#065f46" }}>
                    PAID / VERIFIED
                  </span>
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <span className={styles.docCode}>{fr.formCode}</span>
                  <h4 className={styles.docTitle}>{fr.title}</h4>
                  <p className={styles.docDetails}>
                    Amount: ₦{fr.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} • Receipt: {fr.receiptNumber}
                  </p>
                </div>
              </div>
              <div className={styles.docActions}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  {fr.paidAt ? new Date(fr.paidAt).toLocaleDateString() : fr.session}
                </span>
                <Link
                  href={fr.frontendUrl}
                  className={styles.downloadLink}
                >
                  <Download size={14} />
                  Receipt SMS-FR01
                </Link>
              </div>
            </div>
          ))}

        {/* 4. Result Slips (SMS-RS01) */}
        {(activeTab === "all" || activeTab === "academic") &&
          docData.resultSlips.map((rs, idx) => (
            <div key={`rs-${idx}`} className={styles.docCard}>
              <div>
                <div className={styles.docHeader}>
                  <div className={styles.docIcon} style={{ background: "#fef3c7", color: "#d97706" }}>
                    <Award size={22} />
                  </div>
                  <span className={styles.statusPill} style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                    PUBLISHED
                  </span>
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <span className={styles.docCode}>{rs.formCode}</span>
                  <h4 className={styles.docTitle}>{rs.title}</h4>
                  <p className={styles.docDetails}>
                    GPA: {rs.gpa.toFixed(2)} • CGPA: {rs.cgpa.toFixed(2)} • Standing: {rs.standing}
                  </p>
                </div>
              </div>
              <div className={styles.docActions}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  {rs.session}
                </span>
                <Link
                  href={rs.frontendUrl}
                  className={styles.downloadLink}
                >
                  <Download size={14} />
                  Result Slip SMS-RS01
                </Link>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
