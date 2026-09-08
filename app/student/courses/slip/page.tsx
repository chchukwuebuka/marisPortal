"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Download, Printer } from "lucide-react";
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
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
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
        <Link href="/student/courses/registration">
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
            Back to Course Registration
          </Button>
        </Link>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="primary" onClick={handlePrint} leftIcon={<Printer size={16} />}>
            Print Registration Slip
          </Button>
        </div>
      </div>

      {/* Official Printable Slip Container */}
      <div
        id="printable-slip"
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
                Form SMS-CR01: Official Course Registration Slip
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

          {/* Student Passport Photo Box */}
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
                Affix Passport Photo
              </span>
            )}
          </div>
        </div>

        {/* Registered Courses Table */}
        <div style={{ marginBottom: "1.5rem" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
              border: "1px solid #cbd5e1",
            }}
          >
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
                <th style={{ padding: "0.6rem 0.75rem", width: "40px" }}>S/N</th>
                <th style={{ padding: "0.6rem 0.75rem", width: "110px" }}>Course Code</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Course Title</th>
                <th style={{ padding: "0.6rem 0.75rem", width: "90px", textAlign: "center" }}>Credit Units</th>
                <th style={{ padding: "0.6rem 0.75rem", width: "110px" }}>Type</th>
                <th style={{ padding: "0.6rem 0.75rem", width: "100px" }}>Status</th>
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
                  <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, fontFamily: "monospace" }}>
                    {course.code}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", fontWeight: 500 }}>{course.title}</td>
                  <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", fontWeight: 700 }}>
                    {course.creditUnits}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.8125rem", color: "#475569" }}>
                    {course.isCompulsory ? "Compulsory" : "Elective"}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.8125rem", textTransform: "capitalize" }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", textAlign: "center" }}>
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
                {slip.approvedAt ? `Approved: ${new Date(slip.approvedAt).toLocaleDateString()}` : "Date: _______________"}
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
          #printable-slip {
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
