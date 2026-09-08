"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { getOfficialTranscript } from "@/services/students";
import type { OfficialTranscriptData } from "@/types/student";
import styles from "./transcript.module.css";

export default function OfficialTranscriptPage() {
  const [transcript, setTranscript] = useState<OfficialTranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getOfficialTranscript();
        setTranscript(data);
      } catch (err: any) {
        console.error("Failed to load transcript:", err);
        setError(err?.message || "Failed to load official transcript.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center", color: "#64748b" }}>
        Loading Official Academic Transcript (Form SMS-TR01)...
      </div>
    );
  }

  if (error || !transcript) {
    return (
      <div className={styles.container}>
        <div style={{ padding: "2rem", textAlign: "center", background: "#fef2f2", borderRadius: 8, color: "#991b1b" }}>
          <p style={{ fontWeight: 600 }}>{error || "Transcript could not be loaded."}</p>
          <Link href="/student/results" className={styles.backBtn} style={{ marginTop: "1rem" }}>
            &larr; Return to Results
          </Link>
        </div>
      </div>
    );
  }

  const { institution, student, academic_summary, semesters, verification } = transcript;

  return (
    <div className={styles.container}>
      {/* Top Action Bar (Hidden during printing) */}
      <div className={styles.actionBar}>
        <Link href="/student/results" className={styles.backBtn}>
          <ArrowLeft width={16} height={16} />
          <span>Back to Semester Results</span>
        </Link>
        <button type="button" onClick={handlePrint} className={styles.printBtn}>
          <Printer width={16} height={16} />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Sheet (Form SMS-TR01) */}
      <div className={styles.transcriptSheet}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.instName}>{institution.name}</h1>
          <p className={styles.tagline}>{institution.tagline}</p>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.25rem" }}>
            {institution.address}
          </div>
          <div className={styles.office}>{institution.office}</div>
          <div className={styles.docTitle}>Official Academic Transcript</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.35rem" }}>
            Document Reference: {verification.code} • {institution.form_code}
          </div>
        </div>

        {/* Student Meta Details */}
        <div className={styles.studentMetaGrid}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Full Legal Name:</span>
            <span className={styles.metaVal}>{student.full_name}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Matriculation No:</span>
            <span className={styles.metaVal} style={{ fontFamily: "monospace", color: "#1e40af" }}>
              {student.matric_number}
            </span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>System Student ID:</span>
            <span className={styles.metaVal} style={{ fontFamily: "monospace" }}>
              {student.student_id}
            </span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Programme:</span>
            <span className={styles.metaVal}>{student.programme} ({student.programme_type})</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Department:</span>
            <span className={styles.metaVal}>{student.department}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>School / Faculty:</span>
            <span className={styles.metaVal}>{student.school}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Admitted Session:</span>
            <span className={styles.metaVal}>{student.session_admitted}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Academic Status:</span>
            <span className={styles.metaVal} style={{ textTransform: "uppercase" }}>
              {student.status_display}
            </span>
          </div>
        </div>

        {/* Overall Academic Standings Summary */}
        <div className={styles.overallCard}>
          <div className={styles.overallGrid}>
            <div>
              <div className={styles.overallItemTitle}>Cumulative CGPA</div>
              <div className={styles.overallItemVal}>{academic_summary.final_cgpa.toFixed(2)}</div>
            </div>
            <div>
              <div className={styles.overallItemTitle}>Diploma Class</div>
              <div className={styles.overallItemVal} style={{ fontSize: "1.1rem" }}>
                {academic_summary.diploma_class}
              </div>
            </div>
            <div>
              <div className={styles.overallItemTitle}>Total Registered</div>
              <div className={styles.overallItemVal}>{academic_summary.total_registered_units} Units</div>
            </div>
            <div>
              <div className={styles.overallItemTitle}>Total Earned</div>
              <div className={styles.overallItemVal} style={{ color: "#059669" }}>
                {academic_summary.total_earned_units} Units
              </div>
            </div>
          </div>
        </div>

        {/* Semester-by-Semester Breakdown */}
        {semesters.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            No verified examination results have been published for this transcript.
          </div>
        ) : (
          semesters.map((sem, idx) => (
            <div key={idx} className={styles.semesterSection}>
              <div className={styles.semesterHeader}>
                <span>{sem.session_name} — {sem.semester_name}</span>
                <span style={{ fontSize: "0.8rem", color: "#475569" }}>Level: {sem.level_name}</span>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "15%" }}>Course Code</th>
                    <th>Course Title</th>
                    <th style={{ width: "8%", textAlign: "center" }}>Units</th>
                    <th style={{ width: "8%", textAlign: "center" }}>Total</th>
                    <th style={{ width: "8%", textAlign: "center" }}>Grade</th>
                    <th style={{ width: "8%", textAlign: "center" }}>GP</th>
                    <th style={{ width: "8%", textAlign: "center" }}>QP</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.courses.map((c, cIdx) => (
                    <tr key={cIdx}>
                      <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{c.code}</td>
                      <td>{c.title}</td>
                      <td style={{ textAlign: "center" }}>{c.units}</td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>{c.total_score}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: c.is_passed ? "#059669" : "#dc2626" }}>
                        {c.grade}
                      </td>
                      <td style={{ textAlign: "center" }}>{c.grade_point.toFixed(1)}</td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>{c.quality_points.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.semesterSummaryBar}>
                <span>Semester Reg: {sem.semester_summary.registered_units} Units | Earned: {sem.semester_summary.earned_units} Units</span>
                <span>Semester GPA: <strong style={{ color: "#1e40af" }}>{sem.semester_summary.gpa.toFixed(2)}</strong></span>
                <span>Cumulative CGPA: <strong style={{ color: "#059669" }}>{sem.cumulative_summary.cgpa.toFixed(2)}</strong></span>
              </div>
            </div>
          ))
        )}

        {/* Remarks and Disclaimer */}
        <div style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "#475569", borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem" }}>
          <p style={{ margin: "0 0 0.35rem" }}><strong>Remarks:</strong> {academic_summary.remarks}</p>
          <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.75rem" }}>
            This document is an official academic transcript issued by Marist Polytechnic. Any alteration or erasure renders this transcript invalid.
          </p>
        </div>

        {/* Footer Signatures */}
        <div className={styles.footerSignatures}>
          <div className={styles.signBox}>
            <div className={styles.signLine} />
            <div>Date Issued</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              {new Date(verification.issued_at).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div className={styles.signBox}>
            <div className={styles.signLine} />
            <div style={{ fontWeight: 700 }}>{verification.registrar_signature}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Registrar / Academic Secretary</div>
          </div>
        </div>
      </div>
    </div>
  );
}
