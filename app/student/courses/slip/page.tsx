"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Alert, Button, Spinner } from "@/components/ui";
import { useStudent } from "@/providers/StudentProvider";
import { getCurrentRegistration, getRegistrationSlip } from "@/services/students";
import type { RegistrationSlipData } from "@/types/student";

export default function RegistrationSlipPage() {
  const searchParams = useSearchParams();
  const regIdParam = searchParams.get("id");
  const { student } = useStudent();
  const [loading, setLoading] = useState(true);
  const [slip, setSlip] = useState<RegistrationSlipData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        let regId = regIdParam ? parseInt(regIdParam, 10) : null;
        if (!regId) {
          const cur = await getCurrentRegistration();
          if (cur.registration?.id) {
            regId = cur.registration.id;
          }
        }

        if (!regId) {
          setErrorMsg("No course registration record found for this session yet. Please complete registration first.");
          return;
        }

        const data = await getRegistrationSlip(regId);
        setSlip(data);
      } catch (err: unknown) {
        console.error("Failed to load slip:", err);
        setErrorMsg(err instanceof Error ? err.message : "Failed to load course registration slip.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [regIdParam]);

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (errorMsg || !slip) {
    return (
      <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "0 1rem" }}>
        <Alert tone="warning" title="Course Slip Not Available">
          {errorMsg || "No course registration record found."}
        </Alert>
        <div className="slip-error-actions">
          <Link href="/student/courses/registration">
            <Button variant="primary">Go to Course Registration</Button>
          </Link>
          <Link href="/student/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Responsive styles ──────────────────────────────────────── */}
      <style>{`
        /* Error-state action buttons */
        .slip-error-actions {
          margin-top: 1.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        /* Top action toolbar */
        .slip-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        /* Slip outer container */
        .slip-container {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 2.5rem;
          max-width: 850px;
          margin: 0 auto 3rem auto;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          color: #0f172a;
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* Slip header: logo + institution text + status badge */
        .slip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .slip-header-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex: 1;
          min-width: 0;
        }

        .slip-header-right {
          text-align: right;
          flex-shrink: 0;
        }

        /* Student particulars outer grid: info | photo */
        .slip-particulars {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          margin-bottom: 1.5rem;
        }

        /* Inner 2-col info grid */
        .slip-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.6rem 1.5rem;
          font-size: 0.875rem;
        }

        /* Passport photo box */
        .slip-photo {
          width: 100px;
          height: 115px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          overflow: hidden;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Table horizontal-scroll wrapper */
        .slip-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin-bottom: 1.5rem;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
        }

        .slip-table-wrap table {
          width: 100%;
          min-width: 540px;         /* prevent columns from collapsing */
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        /* Signature block: 3 columns */
        .slip-sigs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          text-align: center;
        }

        /* ── Mobile (≤ 600 px) ──────────────────────────────────── */
        @media (max-width: 600px) {
          .slip-container {
            padding: 1.25rem 1rem;
            border-radius: 0;
            border-left: none;
            border-right: none;
            margin-left: calc(-1 * var(--page-padding, 1rem));
            margin-right: calc(-1 * var(--page-padding, 1rem));
            max-width: 100%;
          }

          /* Stack toolbar buttons */
          .slip-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .slip-toolbar > * {
            width: 100%;
            justify-content: center;
          }

          /* Header: stack institution block + badge vertically */
          .slip-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .slip-header-right {
            text-align: left;
          }

          /* Logo size shrinks a bit */
          .slip-header-left img {
            width: 52px !important;
            height: 52px !important;
          }

          /* Institution heading */
          .slip-header-left h1 {
            font-size: 1.05rem !important;
          }

          /* Particulars: stack photo below info on mobile */
          .slip-particulars {
            grid-template-columns: 1fr;
          }

          /* Photo moves above or below — we push it to top via order */
          .slip-photo {
            order: -1;
            width: 80px;
            height: 92px;
          }

          /* Inner info: single column on very narrow */
          .slip-info-grid {
            grid-template-columns: 1fr;
          }

          /* Signature block: single column on mobile */
          .slip-sigs {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          /* Error actions: stack vertically */
          .slip-error-actions {
            flex-direction: column;
          }
          .slip-error-actions > * {
            width: 100%;
            justify-content: center;
          }
        }

        /* ── Small tablet (601 – 768 px) ────────────────────────── */
        @media (min-width: 601px) and (max-width: 768px) {
          .slip-container {
            padding: 1.75rem 1.25rem;
          }

          .slip-info-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          /* Signature: 2 columns, HOD wraps below */
          .slip-sigs {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ── Print rules ─────────────────────────────────────────── */
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print,
          aside,
          nav,
          header,
          footer,
          button {
            display: none !important;
          }
          .slip-container {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          /* Ensure table doesn't get cut on print */
          .slip-table-wrap {
            overflow: visible !important;
            border: 1px solid #cbd5e1 !important;
          }
          .slip-table-wrap table {
            min-width: unset !important;
          }
          .slip-sigs {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>

      {/* ── Top action toolbar ────────────────────────────────────── */}
      <div className="slip-toolbar no-print">
        <Link href="/student/courses/registration">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Back to Course Registration
          </Button>
        </Link>
        <Button variant="primary" onClick={handlePrint} leftIcon={<Printer size={16} />}>
          Print Registration Slip
        </Button>
      </div>

      {/* ── Official Printable Slip ───────────────────────────────── */}
      <div id="printable-slip" className="slip-container">

        {/* Header: crest + institution + status badge */}
        <div className="slip-header">
          <div className="slip-header-left">
            <Image
              src="/image/logo.png"
              alt="Marist Crest"
              width={70}
              height={70}
              style={{ objectFit: "contain", flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, textTransform: "uppercase", color: "#1e3a8a", lineHeight: 1.2 }}>
                Marist Polytechnic, Emene, Enugu
              </h1>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>
                Office of the Registrar • Directorate of Academic Affairs
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Form SMS-CR01: Official Course Registration Slip
              </p>
            </div>
          </div>

          <div className="slip-header-right">
            <span
              style={{
                display: "inline-block",
                padding: "0.25rem 0.65rem",
                borderRadius: "4px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                textTransform: "uppercase",
                border: slip.status === "approved" ? "1px solid #16a34a" : "1px solid #ca8a04",
                background: slip.status === "approved" ? "#f0fdf4" : "#fefce8",
                color: slip.status === "approved" ? "#15803d" : "#a16207",
              }}
            >
              {slip.statusDisplay}
            </span>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
              Slip Ref: #{slip.registrationId}
            </p>
          </div>
        </div>

        {/* Student particulars */}
        <div className="slip-particulars">
          {/* Info fields */}
          <div className="slip-info-grid">
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Full Name:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 700, color: "#0f172a" }}>{slip.student.fullName}</p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Matriculation Number:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 800, color: "#1e3a8a", fontFamily: "monospace" }}>
                {slip.student.matricNumber}
              </p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Student ID:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>
                {slip.student.studentId}
              </p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Academic Session:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#0f172a" }}>
                {slip.session} ({slip.semester})
              </p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>School:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#0f172a" }}>{slip.student.school}</p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Department:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#0f172a" }}>{slip.student.department}</p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Programme:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#0f172a" }}>{slip.student.programme}</p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Level:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#0f172a" }}>{slip.level}</p>
            </div>
          </div>

          {/* Passport photo */}
          <div className="slip-photo">
            {slip.student.photo || student?.profile?.photoUrl ? (
              <img
                src={slip.student.photo || student?.profile?.photoUrl || ""}
                alt="Student Passport"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: "0.7rem", color: "#64748b", textAlign: "center", padding: "0.5rem" }}>
                Affix Passport Photo
              </span>
            )}
          </div>
        </div>

        {/* Registered Courses Table — scrollable on mobile */}
        <div className="slip-table-wrap">
          <table>
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
                <th style={{ padding: "0.6rem 0.75rem", width: "36px" }}>S/N</th>
                <th style={{ padding: "0.6rem 0.75rem", width: "100px" }}>Code</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Course Title</th>
                <th style={{ padding: "0.6rem 0.75rem", width: "72px", textAlign: "center" }}>Units</th>
                <th style={{ padding: "0.6rem 0.75rem", width: "100px" }}>Type</th>
                <th style={{ padding: "0.6rem 0.75rem", width: "90px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {slip.courses.map((course, idx) => (
                <tr
                  key={course.code}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                  }}
                >
                  <td style={{ padding: "0.6rem 0.75rem", color: "#64748b" }}>{idx + 1}</td>
                  <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {course.code}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", fontWeight: 500 }}>{course.title}</td>
                  <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", fontWeight: 700 }}>
                    {course.creditUnits}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.8125rem", color: "#475569", whiteSpace: "nowrap" }}>
                    {course.isCompulsory ? "Compulsory" : "Elective"}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.8125rem", textTransform: "capitalize", whiteSpace: "nowrap" }}>
                    {course.status}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1", fontWeight: 700 }}>
                <td colSpan={3} style={{ padding: "0.75rem", textAlign: "right" }}>
                  Total Registered Credits:
                </td>
                <td style={{ padding: "0.75rem", textAlign: "center", fontSize: "1rem", color: "#1e3a8a" }}>
                  {slip.totalCredits} Units
                </td>
                <td colSpan={2} style={{ padding: "0.75rem", color: "#64748b", fontSize: "0.75rem" }}>
                  {slip.courses.length} Courses Registered
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Declaration & Signature Block */}
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "0.75rem", color: "#475569", fontStyle: "italic", marginBottom: "2.5rem" }}>
            I solemnly declare that the course units listed above have been accurately registered in compliance with the
            regulations of Marist Polytechnic. I understand that failure to write examinations in any of these approved
            courses will result in an automatic carryover.
          </p>

          <div className="slip-sigs">
            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "30px", marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.8125rem" }}>Student Signature</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>Date: _______________</p>
            </div>

            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "30px", marginBottom: "0.5rem" }}>
                {slip.status === "approved" && (
                  <span style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 700 }}>
                    ENDORSED ONLINE
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.8125rem" }}>Course Advisor / Level Coord.</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                {slip.approvedAt
                  ? `Approved: ${new Date(slip.approvedAt).toLocaleDateString()}`
                  : "Date: _______________"}
              </p>
            </div>

            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "30px", marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.8125rem" }}>Head of Department (HOD)</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>Date: _______________</p>
            </div>
          </div>
        </div>

        {/* Footer timestamp */}
        <div style={{ marginTop: "2.5rem", textAlign: "center", fontSize: "0.7rem", color: "#94a3b8" }}>
          Generated via Marist Polytechnic Student Management System (SMS) • Printed on {new Date().toLocaleString()}
        </div>
      </div>
    </>
  );
}
