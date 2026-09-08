"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { useStudent } from "@/providers/StudentProvider";
import { getCurrentResult, getGradingScales, getMyResults } from "@/services/students";
import type {
  CourseResult,
  GradingScaleItem,
  MyResultsResponse,
  StudentAcademicRecord,
} from "@/types/student";

export default function StudentResultsPage() {
  const { student } = useStudent();
  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState<MyResultsResponse | null>(null);
  const [currentBreakdown, setCurrentBreakdown] = useState<CourseResult[]>([]);
  const [gradingScales, setGradingScales] = useState<GradingScaleItem[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [showScaleModal, setShowScaleModal] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [myRes, curRes, scales] = await Promise.all([
          getMyResults(),
          getCurrentResult(),
          getGradingScales(),
        ]);
        setResultsData(myRes);
        setCurrentBreakdown(curRes.courses || []);
        setGradingScales(scales || []);
        if (myRes.semesters && myRes.semesters.length > 0) {
          setSelectedSemesterId(myRes.semesters[0].id);
        }
      } catch (err) {
        console.warn("Failed to load results data:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const selectedSemester = resultsData?.semesters.find((s) => s.id === selectedSemesterId) || resultsData?.semesters[0];

  const standingTone = (standing?: string) => {
    const s = String(standing || "").toLowerCase();
    if (s.includes("distinction") || s.includes("upper") || s.includes("good")) return "success";
    if (s.includes("lower") || s.includes("pass")) return "info";
    if (s.includes("probation") || s.includes("warning")) return "warning";
    return "error";
  };

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );
  }

  const hasPublishedResults = resultsData && resultsData.semesters.length > 0;

  return (
    <>
      <PageHeader
        eyebrow="Academic Performance"
        title="Results & Academic Standing"
        description="View your verified continuous assessment (CA), examination scores, Semester GPA, and Cumulative CGPA."
        actions={
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/student/results/transcript">
              <Button variant="outline" leftIcon={<FileSpreadsheet size={16} />}>
                Official Transcript (Form SMS-TR01)
              </Button>
            </Link>
            {selectedSemester && (
              <Link href={`/student/results/slip?session=${selectedSemester.session}&semester=${selectedSemester.semester}`}>
                <Button variant="primary" leftIcon={<FileText size={16} />}>
                  Print Semester Result Slip
                </Button>
              </Link>
            )}
            <Button
              variant="secondary"
              onClick={() => setShowScaleModal(!showScaleModal)}
              leftIcon={<HelpCircle size={16} />}
            >
              {showScaleModal ? "Hide Grading Scale" : "NBTE Grading Scale"}
            </Button>
          </div>
        }
      />

      {/* NBTE Grading Scale Reference Panel */}
      {showScaleModal && (
        <Card style={{ marginBottom: "1.5rem", border: "1px solid #93c5fd", background: "#f0f9ff" }}>
          <CardHeader
            title="National Board for Technical Education (NBTE) Grading Standard"
            subtitle="Official 4.00 Grade Point scale used by Marist Polytechnic."
          />
          <CardBody>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ background: "#e0f2fe", borderBottom: "2px solid #bae6fd", textAlign: "left" }}>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Grade</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Percentage Band</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Grade Point (GP)</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Classification</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gradingScales.map((scale) => (
                    <tr key={scale.grade} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700, color: "#0369a1" }}>{scale.grade}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>{scale.minScore}% – {scale.maxScore}%</td>
                      <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700 }}>{scale.gradePoint.toFixed(2)}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>{scale.description}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        <Badge tone={scale.isPass ? "success" : "error"}>
                          {scale.isPass ? "Pass" : "Fail"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* CGPA Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          padding: "2rem",
          borderRadius: "14px",
          marginBottom: "1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          alignItems: "center",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)",
        }}
      >
        <div>
          <span style={{ fontSize: "0.8125rem", textTransform: "uppercase", color: "#94a3b8", letterSpacing: "1px", fontWeight: 600 }}>
            Cumulative Grade Point Average (CGPA)
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginTop: "0.5rem" }}>
            <h1 style={{ fontSize: "3.5rem", fontWeight: 900, margin: 0, lineHeight: 1, color: "#38bdf8" }}>
              {resultsData ? resultsData.overallCgpa.toFixed(2) : "0.00"}
            </h1>
            <span style={{ fontSize: "1.25rem", color: "#64748b", fontWeight: 600 }}>/ 4.00</span>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <Badge tone={standingTone(resultsData?.overallStanding)}>
              {resultsData?.overallStanding || "Good Standing"}
            </Badge>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", borderLeft: "1px solid #334155", paddingLeft: "1.5rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>Matriculation No.</span>
            <p style={{ margin: "2px 0 0 0", fontWeight: 700, fontFamily: "monospace", color: "#f8fafc", fontSize: "1rem" }}>
              {student?.matricNumber}
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>Programme</span>
            <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#f8fafc", fontSize: "0.9375rem" }}>
              {student?.programmeName || "Computer Science"}
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>Semesters Recorded</span>
            <p style={{ margin: "2px 0 0 0", fontWeight: 700, color: "#38bdf8", fontSize: "1.1rem" }}>
              {resultsData ? resultsData.semesters.length : 0} Semester(s)
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase" }}>Current Level</span>
            <p style={{ margin: "2px 0 0 0", fontWeight: 600, color: "#f8fafc", fontSize: "0.9375rem" }}>
              {student?.currentLevel?.name || "100 Level"}
            </p>
          </div>
        </div>
      </div>

      {!hasPublishedResults ? (
        <Card>
          <CardBody>
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <Award size={48} style={{ color: "var(--color-muted)", margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
                No Published Results Available Yet
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", maxWidth: "500px", margin: "0.5rem auto 1.5rem auto" }}>
                Examinations and continuous assessment (CA) scores for the active semester are currently being compiled and audited by the Departmental Board of Examiners.
              </p>
              <Link href="/student/courses">
                <Button variant="secondary">Review Enrolled Courses</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Semester Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
            {resultsData?.semesters.map((sem) => {
              const active = sem.id === selectedSemester?.id;
              return (
                <button
                  key={sem.id}
                  type="button"
                  onClick={() => setSelectedSemesterId(sem.id)}
                  style={{
                    border: active ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                    background: active ? "var(--color-primary)" : "#ffffff",
                    color: active ? "#ffffff" : "var(--color-ink)",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: active ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {sem.sessionName} — {sem.semesterName}
                </button>
              );
            })}
          </div>

          {/* Selected Semester Performance Card */}
          {selectedSemester && (
            <Card style={{ marginBottom: "1.5rem" }}>
              <CardHeader
                title={`Semester Performance: ${selectedSemester.sessionName} (${selectedSemester.semesterName})`}
                subtitle={`Level: ${selectedSemester.levelName} • Released: ${selectedSemester.publishedAt ? new Date(selectedSemester.publishedAt).toLocaleDateString() : "Published"}`}
              />
              <CardBody>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>Semester GPA</span>
                    <p style={{ margin: "4px 0 0 0", fontWeight: 800, fontSize: "1.35rem", color: "var(--color-primary)" }}>
                      {selectedSemester.gpa.toFixed(2)}
                    </p>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>Registered Units</span>
                    <p style={{ margin: "4px 0 0 0", fontWeight: 800, fontSize: "1.35rem", color: "var(--color-ink)" }}>
                      {selectedSemester.registeredCredits} Units
                    </p>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>Earned Units</span>
                    <p style={{ margin: "4px 0 0 0", fontWeight: 800, fontSize: "1.35rem", color: "#10b981" }}>
                      {selectedSemester.earnedCredits} Units
                    </p>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>Quality Points</span>
                    <p style={{ margin: "4px 0 0 0", fontWeight: 800, fontSize: "1.35rem", color: "#6366f1" }}>
                      {selectedSemester.totalQualityPoints.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Course Breakdown Table */}
                <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-ink)" }}>
                  Course Scores & Grade Points
                </h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", border: "1px solid #e2e8f0" }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
                        <th style={{ padding: "0.6rem 0.75rem" }}>Course Code</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>Course Title</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Units</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>CA (40)</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Exam (60)</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Total (100)</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Grade</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Grade Point</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Quality Points</th>
                        <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBreakdown.map((res) => (
                        <tr key={res.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, fontFamily: "monospace", color: "var(--color-primary)" }}>
                            {res.courseCode}
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem", fontWeight: 500 }}>{res.courseTitle}</td>
                          <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", fontWeight: 600 }}>{res.creditUnits}</td>
                          <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{res.caScore.toFixed(1)}</td>
                          <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{res.examScore.toFixed(1)}</td>
                          <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", fontWeight: 700 }}>{res.totalScore.toFixed(1)}</td>
                          <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", fontWeight: 800, color: res.isPassed ? "#059669" : "#dc2626" }}>
                            {res.grade}
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{res.gradePoint.toFixed(2)}</td>
                          <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", fontWeight: 600 }}>{res.qualityPoints.toFixed(2)}</td>
                          <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>
                            <Badge tone={res.isPassed ? "success" : "error"}>
                              {res.isPassed ? "Passed" : "Carryover"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </>
  );
}
