"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookCheck,
  BookOpen,
  CheckCircle,
  FileText,
  Layers,
  Sparkles,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { useStudent } from "@/providers/StudentProvider";
import { getAcademicCourses, getCurrentRegistration } from "@/services/students";
import type { Course, CourseRegistration } from "@/types/student";

export default function StudentCoursesPage() {
  const { student } = useStudent();
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentReg, setCurrentReg] = useState<CourseRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSemester, setFilterSemester] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [courseList, regRes] = await Promise.all([
          getAcademicCourses(),
          getCurrentRegistration(),
        ]);
        setCourses(courseList);
        setCurrentReg(regRes.registration);
      } catch (err) {
        console.warn("Failed to load courses or registration:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filteredCourses = courses.filter((c) => {
    if (filterSemester === "first") {
      return (
        c.semester?.code?.toLowerCase().includes("1") ||
        c.semester?.name?.toLowerCase().includes("first")
      );
    }
    if (filterSemester === "second") {
      return (
        c.semester?.code?.toLowerCase().includes("2") ||
        c.semester?.name?.toLowerCase().includes("second")
      );
    }
    return true;
  });

  const totalCredits = filteredCourses.reduce((sum, c) => sum + (c.creditUnits || 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Student Portal"
        title="Academic Curriculum & Enrolled Courses"
        description="Review departmental curriculum, your active course registrations, and official course slips."
        actions={
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            {currentReg && (
              <Link href={`/student/courses/slip?id=${currentReg.id}`}>
                <Button variant="secondary" leftIcon={<FileText size={16} />}>
                  View Registration Slip
                </Button>
              </Link>
            )}
            <Link href="/student/courses/registration">
              <Button variant="primary" leftIcon={<BookCheck size={16} />}>
                {currentReg?.status === "approved" ? "View Registration" : "Semester Course Registration"}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Registration Status Callout */}
      {currentReg && (
        <div style={{ marginBottom: "1.5rem" }}>
          {currentReg.status === "approved" ? (
            <Alert tone="success" title="Course Registration Approved">
              You are officially registered for {currentReg.items.length} courses ({currentReg.totalCredits} credit units) for {currentReg.sessionName} ({currentReg.semesterName}).
              Your course registration has been endorsed by the Departmental Academic Advisor.
            </Alert>
          ) : currentReg.status === "submitted" ? (
            <Alert tone="info" title="Registration Submitted (Pending Approval)">
              Your course registration ({currentReg.totalCredits} units) has been submitted and is currently being reviewed by your Academic Advisor.
            </Alert>
          ) : currentReg.status === "rejected" ? (
            <Alert tone="error" title="Registration Revision Required">
              Your registration requires adjustments: {currentReg.rejectionReason || "Please review your course selection."}
            </Alert>
          ) : (
            <Alert tone="warning" title="Registration Incomplete (Draft)">
              You have a draft registration with {currentReg.totalCredits} units. Please complete and submit your courses before registration closes.
            </Alert>
          )}
        </div>
      )}

      {/* Overview stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>Programme</span>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)", marginTop: "0.25rem" }}>
            {student?.programmeName || "Computer Science"}
          </p>
        </div>

        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>Current Level</span>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-primary)", marginTop: "0.25rem" }}>
            {student?.currentLevel?.name || "100 Level"}
          </p>
        </div>

        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>Registered Units</span>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", color: currentReg?.status === "approved" ? "#059669" : "#2563eb", marginTop: "0.25rem" }}>
            {currentReg ? `${currentReg.totalCredits} Units` : "0 Units (Pending)"}
          </p>
        </div>

        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>Catalogue Total</span>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-ink)", marginTop: "0.25rem" }}>
            {filteredCourses.length} Courses ({totalCredits} U)
          </p>
        </div>
      </div>

      {/* If student has registered items, show Registered Courses section first */}
      {currentReg && currentReg.items.length > 0 && (
        <Card style={{ marginBottom: "2rem" }}>
          <CardHeader
            title={`Your Registered Courses (${currentReg.sessionName || ""} — ${currentReg.semesterName || ""})`}
            subtitle={`Total Credits: ${currentReg.totalCredits} Units • Status: ${currentReg.status.toUpperCase()}`}
          />
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {currentReg.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.875rem 1rem",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-primary)" }}>
                      {item.course.code}
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                      {item.course.title}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Badge tone={item.isCompulsory ? "neutral" : "info"}>
                      {item.isCompulsory ? "Compulsory" : "Elective"}
                    </Badge>
                    <Badge tone="success">{item.creditUnits} Units</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filter Tabs for Programme Curriculum Catalogue */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--color-ink)" }}>
          Departmental Programme Curriculum
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", background: "var(--color-surface-sunken)", padding: "0.35rem", borderRadius: "8px" }}>
          <button
            type="button"
            onClick={() => setFilterSemester("all")}
            style={{
              border: "none",
              background: filterSemester === "all" ? "#ffffff" : "transparent",
              padding: "0.4rem 1rem",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.8125rem",
              color: filterSemester === "all" ? "var(--color-primary)" : "var(--color-muted)",
              cursor: "pointer",
              boxShadow: filterSemester === "all" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            All Semesters
          </button>
          <button
            type="button"
            onClick={() => setFilterSemester("first")}
            style={{
              border: "none",
              background: filterSemester === "first" ? "#ffffff" : "transparent",
              padding: "0.4rem 1rem",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.8125rem",
              color: filterSemester === "first" ? "var(--color-primary)" : "var(--color-muted)",
              cursor: "pointer",
              boxShadow: filterSemester === "first" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            First Semester
          </button>
          <button
            type="button"
            onClick={() => setFilterSemester("second")}
            style={{
              border: "none",
              background: filterSemester === "second" ? "#ffffff" : "transparent",
              padding: "0.4rem 1rem",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.8125rem",
              color: filterSemester === "second" ? "var(--color-primary)" : "var(--color-muted)",
              cursor: "pointer",
              boxShadow: filterSemester === "second" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Second Semester
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
          <Spinner size={32} />
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardBody>
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <BookOpen size={40} style={{ color: "var(--color-muted)", marginBottom: "0.75rem" }} />
              <p style={{ fontWeight: 600, color: "var(--color-ink)" }}>No Courses Available Yet</p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
                The course catalogue for this semester is being published by the department.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              style={{
                background: "#ffffff",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-primary)" }}>
                    {c.code}
                  </span>
                  <Badge tone="success">
                    {c.creditUnits} Units
                  </Badge>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.35rem" }}>
                  {c.title}
                </h4>
                {c.description && (
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.4 }}>
                    {c.description}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", fontSize: "0.75rem", color: "var(--color-muted-strong)" }}>
                <span>{c.semester?.name || "Semester 1"}</span>
                <span>{c.isCore !== false ? "Core Course" : "Elective"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
