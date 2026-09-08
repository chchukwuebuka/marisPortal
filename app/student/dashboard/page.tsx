"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  FolderArchive,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { Alert, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { useStudent } from "@/providers/StudentProvider";
import { initials, resolveMediaUrl } from "@/lib/format";
import {
  getCurrentRegistration,
  getCurrentResult,
  getCurrentFeeInvoice,
} from "@/services/students";
import type {
  CourseRegistration,
  CurrentResultResponse,
  StudentFeeInvoice,
} from "@/types/student";
import styles from "./dashboard.module.css";

export default function StudentDashboardPage() {
  const { student, loading, error } = useStudent();
  const [imgError, setImgError] = useState(false);

  // Dynamic academic & financial KPIs
  const [registration, setRegistration] = useState<CourseRegistration | null>(null);
  const [resultData, setResultData] = useState<CurrentResultResponse | null>(null);
  const [feeInvoice, setFeeInvoice] = useState<StudentFeeInvoice | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(true);

  const fullName = student?.user?.fullName || "Student";
  const photoUrl = resolveMediaUrl(student?.profile?.photoUrl);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  useEffect(() => {
    if (!student) return;

    let mounted = true;
    async function loadKpis() {
      try {
        const [regRes, resRes, feeRes] = await Promise.allSettled([
          getCurrentRegistration(),
          getCurrentResult(),
          getCurrentFeeInvoice(),
        ]);

        if (!mounted) return;

        if (regRes.status === "fulfilled" && regRes.value.registration) {
          setRegistration(regRes.value.registration);
        }
        if (resRes.status === "fulfilled" && resRes.value) {
          setResultData(resRes.value);
        }
        if (feeRes.status === "fulfilled" && feeRes.value) {
          setFeeInvoice(feeRes.value);
        }
      } catch (err) {
        console.error("Error loading student KPIs", err);
      } finally {
        if (mounted) setLoadingKpis(false);
      }
    }

    loadKpis();
    return () => {
      mounted = false;
    };
  }, [student]);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !student) {
    const isAccessRestricted =
      error?.toLowerCase().includes("only students") ||
      error?.toLowerCase().includes("registered students") ||
      error?.toLowerCase().includes("not currently") ||
      error?.toLowerCase().includes("not available") ||
      error?.toLowerCase().includes("forbidden");

    return (
      <div style={{ maxWidth: 700, margin: "2rem auto" }}>
        <Alert tone="warning" title={isAccessRestricted ? "Student Profile Not Provisioned" : "Student Record Loading"}>
          {error || "Your student account is being provisioned. Please ensure you have accepted your admission offer."}
        </Alert>
        <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href="/applicant/admission"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              background: "var(--color-primary)",
              color: "#ffffff",
              borderRadius: "8px",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            Check Admission Offer &rarr;
          </Link>
          <Link
            href="/applicant/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.6rem 1.25rem",
              background: "var(--color-surface-subtle, #f1f5f9)",
              color: "var(--color-ink)",
              borderRadius: "8px",
              fontWeight: 500,
              textDecoration: "none",
              fontSize: "0.95rem",
              border: "1px solid var(--color-border, #e2e8f0)",
            }}
          >
            Return to Applicant Portal
          </Link>
        </div>
      </div>
    );
  }

  // Calculate CGPA & GPA values
  const cgpaValue = resultData?.record?.cgpa
    ? Number(resultData.record.cgpa).toFixed(2)
    : "—";
  const gpaValue = resultData?.record?.gpa
    ? Number(resultData.record.gpa).toFixed(2)
    : "—";
  const academicStanding =
    resultData?.record?.academicStandingDisplay ||
    (student?.status === "active" ? "Good Standing" : "Provisional Entry");

  const totalRegisteredUnits = registration?.totalCredits ?? 0;
  const registrationStatusText = registration
    ? registration.status.toUpperCase()
    : "Not Registered";

  const feeBalanceDue = feeInvoice?.balanceDue ?? 0;
  const isFeeCleared = feeInvoice?.isCleared ?? false;

  return (
    <>
      <PageHeader
        eyebrow="Student Portal"
        title="Student Dashboard"
        description="Welcome to your academic workspace at Marist Polytechnic."
      />

      {/* Hero ID Card */}
      <div className={styles.heroCard}>
        <div className={styles.heroContent}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              {photoUrl && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={fullName}
                  className={styles.avatarImg}
                  onError={() => setImgError(true)}
                />
              ) : (
                initials(fullName)
              )}
            </div>
          </div>
          <div className={styles.heroDetails}>
            <div className={styles.greeting}>Student Identity</div>
            <h2 className={styles.studentName}>{fullName}</h2>
            <div className={styles.badgeRow}>
              <span className={styles.matricBadge} title="Matriculation Number">
                {student?.matricNumber || "Pending Matric"}
              </span>
              <span className={styles.studentIdBadge} title="Official Student ID">
                {student?.studentId || "Pending ID"}
              </span>
              <span className={styles.statusBadge}>
                {student?.status || "Active"}
              </span>
            </div>

            <div className={styles.academicInfo}>
              <div>
                <div className={styles.infoItemTitle}>Programme</div>
                <div className={styles.infoItemVal}>{student?.programmeName || "Computer Science"}</div>
              </div>
              <div>
                <div className={styles.infoItemTitle}>Department</div>
                <div className={styles.infoItemVal}>{student?.departmentName || "Computer Science"}</div>
              </div>
              <div>
                <div className={styles.infoItemTitle}>School</div>
                <div className={styles.infoItemVal}>{student?.schoolName || "School of Computing"}</div>
              </div>
              <div>
                <div className={styles.infoItemTitle}>Current Level</div>
                <div className={styles.infoItemVal}>{student?.currentLevel?.name || "100 Level"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item 28: Top 4 KPI Cards (CGPA, GPA, Registered Units, Fee Balance) */}
      <div className={styles.statsGrid}>
        {/* 1. CGPA */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#e0e7ff", color: "#4338ca" }}>
            <Award size={24} />
          </div>
          <div className={styles.statMeta}>
            <div className={styles.statLabel}>Cumulative GPA (CGPA)</div>
            <div className={styles.statVal}>
              {cgpaValue} <span style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>/ 4.00</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#4338ca", fontWeight: 600, marginTop: "0.2rem" }}>
              {academicStanding}
            </div>
          </div>
        </div>

        {/* 2. Current Semester GPA */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#fef3c7", color: "#d97706" }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statMeta}>
            <div className={styles.statLabel}>Current Semester GPA</div>
            <div className={styles.statVal}>{gpaValue}</div>
            <div style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 500, marginTop: "0.2rem" }}>
              {resultData?.record ? `${resultData.record.earnedCredits} Earned Units` : "Semester In Progress"}
            </div>
          </div>
        </div>

        {/* 3. Registered Units */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#d1fae5", color: "#059669" }}>
            <GraduationCap size={24} />
          </div>
          <div className={styles.statMeta}>
            <div className={styles.statLabel}>Registered Units</div>
            <div className={styles.statVal}>
              {totalRegisteredUnits} <span style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>Units</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 600, marginTop: "0.2rem" }}>
              {registrationStatusText}
            </div>
          </div>
        </div>

        {/* 4. Fee Balance */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: isFeeCleared ? "#d1fae5" : "#fee2e2", color: isFeeCleared ? "#059669" : "#dc2626" }}>
            <CreditCard size={24} />
          </div>
          <div className={styles.statMeta}>
            <div className={styles.statLabel}>School Fees Balance</div>
            <div className={styles.statVal} style={{ fontSize: "1.1rem" }}>
              {isFeeCleared ? "₦0.00" : `₦${feeBalanceDue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
            </div>
            <div style={{ fontSize: "0.75rem", color: isFeeCleared ? "#059669" : "#dc2626", fontWeight: 600, marginTop: "0.2rem" }}>
              {isFeeCleared ? "CLEARED / PAID" : feeInvoice ? "BALANCE DUE" : "SCHEDULE PENDING"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <h3 className={styles.sectionTitle}>
        <ShieldCheck size={20} style={{ color: "var(--color-primary)" }} />
        Academic Actions & Management
      </h3>

      <div className={styles.actionGrid}>
        {/* Course Registration */}
        <Link href="/student/courses" className={styles.actionCard}>
          <div>
            <div className={styles.actionHeader}>
              <div className={styles.actionIcon}>
                <BookOpen size={20} />
              </div>
            </div>
            <div className={styles.actionTitle}>Course Registration</div>
            <div className={styles.actionDesc}>
              Select compulsory and elective courses, handle carryovers, and download your registration form (SMS-CR01).
            </div>
          </div>
          <div className={styles.actionCta}>
            <span>Manage Courses</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Results & CGPA */}
        <Link href="/student/results" className={styles.actionCard}>
          <div>
            <div className={styles.actionHeader}>
              <div className={styles.actionIcon}>
                <Award size={20} />
              </div>
            </div>
            <div className={styles.actionTitle}>Results & CGPA</div>
            <div className={styles.actionDesc}>
              Check semester score breakdowns (CA + Exam), quality points, GPA progression, and official result slips (SMS-RS01).
            </div>
          </div>
          <div className={styles.actionCta}>
            <span>View Results</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Fees & Invoices */}
        <Link href="/student/fees" className={styles.actionCard}>
          <div>
            <div className={styles.actionHeader}>
              <div className={styles.actionIcon}>
                <CreditCard size={20} />
              </div>
            </div>
            <div className={styles.actionTitle}>School Fees & Invoices</div>
            <div className={styles.actionDesc}>
              View fee schedules, make secure online installment payments, and download official fee payment receipts (SMS-FR01).
            </div>
          </div>
          <div className={styles.actionCta}>
            <span>Pay & View Fees</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Document Centre */}
        <Link href="/student/documents" className={styles.actionCard}>
          <div>
            <div className={styles.actionHeader}>
              <div className={styles.actionIcon}>
                <FolderArchive size={20} />
              </div>
            </div>
            <div className={styles.actionTitle}>Document Centre</div>
            <div className={styles.actionDesc}>
              Unified repository for your Admission Letter, Registration Slips, Fee Receipts, and digital Student ID card.
            </div>
          </div>
          <div className={styles.actionCta}>
            <span>Document Hub</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Student Biodata */}
        <Link href="/student/profile" className={styles.actionCard}>
          <div>
            <div className={styles.actionHeader}>
              <div className={styles.actionIcon}>
                <User size={20} />
              </div>
            </div>
            <div className={styles.actionTitle}>Student Biodata</div>
            <div className={styles.actionDesc}>
              Update contact info, state of origin, LGA, blood group, genotype, and residential address.
            </div>
          </div>
          <div className={styles.actionCta}>
            <span>Manage Profile</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Guardians & Sponsors */}
        <Link href="/student/guardians" className={styles.actionCard}>
          <div>
            <div className={styles.actionHeader}>
              <div className={styles.actionIcon}>
                <Users size={20} />
              </div>
            </div>
            <div className={styles.actionTitle}>Guardians & Sponsors</div>
            <div className={styles.actionDesc}>
              Manage official next-of-kin, parents, or academic sponsors linked to your student dossier.
            </div>
          </div>
          <div className={styles.actionCta}>
            <span>View Guardians</span>
            <ArrowRight size={16} />
          </div>
        </Link>
      </div>
    </>
  );
}
