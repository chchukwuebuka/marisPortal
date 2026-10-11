"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { Alert, Button, Spinner } from "@/components/ui";
import { useStudent } from "@/providers/StudentProvider";
import { getMyResults, getResultSlip } from "@/services/students";
import { API_BASE_URL } from "@/lib/api";
import type { SemesterResultSlipData } from "@/types/student";

function SemesterResultSlipContent() {
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");
  const semesterParam = searchParams.get("semester");
  const { student } = useStudent();

  const [loading, setLoading] = useState(true);
  const [slip, setSlip] = useState<SemesterResultSlipData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        let sessId = sessionParam ? parseInt(sessionParam, 10) : null;
        let semId = semesterParam ? parseInt(semesterParam, 10) : null;

        if (!sessId || !semId) {
          const myRes = await getMyResults();
          if (myRes.semesters && myRes.semesters.length > 0) {
            sessId = myRes.semesters[0].session;
            semId = myRes.semesters[0].semester;
          }
        }

        if (!sessId || !semId) {
          setErrorMsg("No published semester results found to print.");
          return;
        }

        const data = await getResultSlip(sessId, semId);
        setSlip(data);
      } catch (err: unknown) {
        console.error("Failed to load result slip:", err);
        setErrorMsg(err instanceof Error ? err.message : "Failed to load semester result slip.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [sessionParam, semesterParam]);

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
        <Alert tone="warning" title="Result Slip Unavailable">
          {errorMsg || "Semester results are not yet available for printing."}
        </Alert>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
          <Link href="/student/results">
            <Button variant="primary">Back to Results</Button>
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
      {/* Top action toolbar (Hidden when printing) */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <Link href="/student/results">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Back to Results Dashboard
          </Button>
        </Link>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="primary" onClick={handlePrint} leftIcon={<Printer size={16} />}>
            Print Official Result Slip
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Download size={16} />}
            onClick={() => {
              if (student?.id && slip?.semester) {
                window.open(`${API_BASE_URL}/results/slip/${student.id}/${slip.semester}/pdf/`, "_blank");
              }
            }}
          >
            Download Verified PDF (with QR)
          </Button>
        </div>
      </div>

      {/* Official Printable Result Slip Container */}
      <div
        id="printable-result-slip"
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          padding: "2.5rem",
          maxWidth: "850px",
          margin: "0 auto 3rem auto",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          color: "#0f172a",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header with Crest and Institution title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #0f172a",
            paddingBottom: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <Image
              src="/image/logo.png"
              alt="Marist Crest"
              width={70}
              height={70}
              style={{ objectFit: "contain" }}
            />
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, textTransform: "uppercase", color: "#1e3a8a" }}>
                Marist Polytechnic, Emene, Enugu
              </h1>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>
                Office of the Registrar • Directorate of Academic Affairs
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Form SMS-RS01: Official Semester Result Notification
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-block",
                padding: "0.25rem 0.65rem",
                borderRadius: "4px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                textTransform: "uppercase",
                border: "1px solid #16a34a",
                background: "#f0fdf4",
                color: "#15803d",
              }}
            >
              Verified / Published
            </span>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
              {slip.publishedAt ? `Released: ${new Date(slip.publishedAt).toLocaleDateString()}` : ""}
            </p>
          </div>
        </div>

        {/* Student Particulars Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "1.5rem",
            padding: "1rem",
            background: "#f8fafc",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem 1.5rem", fontSize: "0.875rem" }}>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Student Name:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 700, color: "#0f172a" }}>{slip.student.fullName}</p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Matriculation Number:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 800, color: "#1e3a8a", fontFamily: "monospace" }}>
                {slip.student.matricNumber}
              </p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Programme:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#0f172a" }}>
                {slip.student.programme} ({slip.student.programmeType})
              </p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Session & Semester:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#0f172a" }}>
                {slip.session} — {slip.semester}
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
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Academic Level:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#0f172a" }}>{slip.level}</p>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Student ID:</span>
              <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>
                {slip.student.studentId}
              </p>
            </div>
          </div>

          {/* Student Passport Photo */}
          <div
            style={{
              width: "100px",
              height: "115px",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
              overflow: "hidden",
              background: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {slip.student.photo || student?.profile?.photoUrl ? (
              <img
                src={slip.student.photo || student?.profile?.photoUrl || ""}
                alt="Student Passport"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: "0.7rem", color: "#64748b", textAlign: "center", padding: "0.5rem" }}>
                Affix Photo
              </span>
            )}
          </div>
        </div>

        {/* Results Breakdown Table */}
        <div style={{ marginBottom: "1.5rem" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8125rem",
              border: "1px solid #cbd5e1",
            }}
          >
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
                <th style={{ padding: "0.5rem 0.65rem", width: "35px" }}>S/N</th>
                <th style={{ padding: "0.5rem 0.65rem", width: "100px" }}>Course Code</th>
                <th style={{ padding: "0.5rem 0.65rem" }}>Course Title</th>
                <th style={{ padding: "0.5rem 0.65rem", textAlign: "center", width: "50px" }}>Units</th>
                <th style={{ padding: "0.5rem 0.65rem", textAlign: "center", width: "55px" }}>CA (40)</th>
                <th style={{ padding: "0.5rem 0.65rem", textAlign: "center", width: "65px" }}>Exam (60)</th>
                <th style={{ padding: "0.5rem 0.65rem", textAlign: "center", width: "65px" }}>Total (100)</th>
                <th style={{ padding: "0.5rem 0.65rem", textAlign: "center", width: "50px" }}>Grade</th>
                <th style={{ padding: "0.5rem 0.65rem", textAlign: "center", width: "50px" }}>GP</th>
                <th style={{ padding: "0.5rem 0.65rem", textAlign: "center", width: "50px" }}>QP</th>
                <th style={{ padding: "0.5rem 0.65rem", textAlign: "center", width: "80px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {slip.courses.map((c, idx) => (
                <tr
                  key={c.code}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                  }}
                >
                  <td style={{ padding: "0.5rem 0.65rem", color: "#64748b" }}>{idx + 1}</td>
                  <td style={{ padding: "0.5rem 0.65rem", fontWeight: 700, fontFamily: "monospace" }}>{c.code}</td>
                  <td style={{ padding: "0.5rem 0.65rem", fontWeight: 500 }}>{c.title}</td>
                  <td style={{ padding: "0.5rem 0.65rem", textAlign: "center", fontWeight: 700 }}>{c.creditUnits}</td>
                  <td style={{ padding: "0.5rem 0.65rem", textAlign: "center" }}>{c.caScore.toFixed(1)}</td>
                  <td style={{ padding: "0.5rem 0.65rem", textAlign: "center" }}>{c.examScore.toFixed(1)}</td>
                  <td style={{ padding: "0.5rem 0.65rem", textAlign: "center", fontWeight: 700 }}>{c.totalScore.toFixed(1)}</td>
                  <td style={{ padding: "0.5rem 0.65rem", textAlign: "center", fontWeight: 800, color: c.isPassed ? "#15803d" : "#b91c1c" }}>
                    {c.grade}
                  </td>
                  <td style={{ padding: "0.5rem 0.65rem", textAlign: "center" }}>{c.gradePoint.toFixed(2)}</td>
                  <td style={{ padding: "0.5rem 0.65rem", textAlign: "center", fontWeight: 600 }}>{c.qualityPoints.toFixed(2)}</td>
                  <td style={{ padding: "0.5rem 0.65rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 700, color: c.isPassed ? "#15803d" : "#b91c1c" }}>
                    {c.isPassed ? "PASSED" : "CARRYOVER"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Academic Summaries (Semester & Cumulative) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* Semester Summary */}
          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "1rem" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", textTransform: "uppercase", color: "#1e3a8a", fontWeight: 700 }}>
              Semester Summary ({slip.semester})
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", fontSize: "0.8125rem" }}>
              <div>
                <span style={{ color: "#64748b" }}>Total Reg. Credits:</span>
                <p style={{ margin: "2px 0 0 0", fontWeight: 700 }}>{slip.semesterSummary.registeredCredits} Units</p>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Total Earned Credits:</span>
                <p style={{ margin: "2px 0 0 0", fontWeight: 700, color: "#15803d" }}>{slip.semesterSummary.earnedCredits} Units</p>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Total Quality Points:</span>
                <p style={{ margin: "2px 0 0 0", fontWeight: 700 }}>{slip.semesterSummary.totalQualityPoints.toFixed(2)}</p>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Semester GPA:</span>
                <p style={{ margin: "2px 0 0 0", fontWeight: 800, fontSize: "1.1rem", color: "#1e3a8a" }}>
                  {slip.semesterSummary.gpa.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Cumulative Summary */}
          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "1rem" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", textTransform: "uppercase", color: "#1e3a8a", fontWeight: 700 }}>
              Cumulative Performance (All Semesters)
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", fontSize: "0.8125rem" }}>
              <div>
                <span style={{ color: "#64748b" }}>Cum. Reg. Credits:</span>
                <p style={{ margin: "2px 0 0 0", fontWeight: 700 }}>{slip.cumulativeSummary.cumulativeRegisteredCredits} Units</p>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Cum. Earned Credits:</span>
                <p style={{ margin: "2px 0 0 0", fontWeight: 700, color: "#15803d" }}>{slip.cumulativeSummary.cumulativeEarnedCredits} Units</p>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Cum. Quality Points:</span>
                <p style={{ margin: "2px 0 0 0", fontWeight: 700 }}>{slip.cumulativeSummary.cumulativeQualityPoints.toFixed(2)}</p>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Cumulative CGPA:</span>
                <p style={{ margin: "2px 0 0 0", fontWeight: 900, fontSize: "1.2rem", color: "#1e3a8a" }}>
                  {slip.cumulativeSummary.cgpa.toFixed(2)}
                </p>
              </div>
            </div>
            <div style={{ marginTop: "0.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.4rem", fontSize: "0.8125rem" }}>
              <span style={{ color: "#64748b" }}>Academic Standing: </span>
              <strong style={{ color: "#15803d" }}>{slip.cumulativeSummary.academicStandingDisplay}</strong>
            </div>
          </div>
        </div>

        {/* Endorsements & Signatures */}
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", textAlign: "center" }}>
            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "30px", marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.8125rem" }}>Level Coordinator / Advisor</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>Date: _______________</p>
            </div>

            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "30px", marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.8125rem" }}>Head of Department (HOD)</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>Date: _______________</p>
            </div>

            <div>
              <div style={{ borderBottom: "1px solid #0f172a", height: "30px", marginBottom: "0.5rem" }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.8125rem" }}>Registrar / Directorate of Academics</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>Date: _______________</p>
            </div>
          </div>
        </div>

        {/* Footer timestamp */}
        <div style={{ marginTop: "2.5rem", textAlign: "center", fontSize: "0.7rem", color: "#94a3b8" }}>
          Generated via Marist Polytechnic Student Management System (SMS) • Verified Official Document • Printed on {new Date().toLocaleString()}
        </div>
      </div>

      {/* Embedded print stylesheet */}
      <style jsx global>{`
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
          #printable-result-slip {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
}

export default function SemesterResultSlipPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
          <Spinner size={32} />
        </div>
      }
    >
      <SemesterResultSlipContent />
    </Suspense>
  );
}
