"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { useStudent } from "@/providers/StudentProvider";
import {
  getAcademicCourses,
  getAddDropRequests,
  getAvailableCourses,
  getCurrentRegistration,
  submitAddDropRequest,
} from "@/services/students";
import type { AvailableCoursesData, Course, CourseAddDropRequest, CourseRegistration } from "@/types/student";
import type { Tone } from "@/lib/constants";

export default function CourseAddDropPage() {
  const { student } = useStudent();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentReg, setCurrentReg] = useState<CourseRegistration | null>(null);
  const [availableData, setAvailableData] = useState<AvailableCoursesData | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [requests, setRequests] = useState<CourseAddDropRequest[]>([]);
  const [action, setAction] = useState<"ADD" | "DROP">("ADD");
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [regRes, availRes, courseList, reqList] = await Promise.all([
        getCurrentRegistration().catch(() => ({ registration: null })),
        getAvailableCourses().catch(() => null),
        getAcademicCourses().catch(() => []),
        getAddDropRequests().catch(() => []),
      ]);
      setCurrentReg(regRes.registration);
      setAvailableData(availRes);
      setAllCourses(courseList);
      setRequests(reqList);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load Add/Drop information.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const registeredCourseIds = new Set(
    (currentReg?.items || [])
      .filter((it) => it.status !== "dropped")
      .map((it) => it.course.id)
  );

  const addableCourses = allCourses.filter((c) => !registeredCourseIds.has(c.id));
  const droppableCourses = (currentReg?.items || []).filter(
    (it) => it.status !== "dropped"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourseId || !reason.trim()) {
      setErrorMsg("Please select a course and provide a reason for the request.");
      return;
    }

    const semesterId = availableData?.semester?.id || (currentReg?.items?.[0]?.course?.semester?.id);
    if (!semesterId) {
      setErrorMsg("Could not identify current active semester for this request.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await submitAddDropRequest({
        semester: semesterId,
        course: Number(selectedCourseId),
        action,
        reason: reason.trim(),
      });
      setSuccessMsg(`Successfully submitted request to ${action.toLowerCase()} course.`);
      setSelectedCourseId("");
      setReason("");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit Add/Drop request.");
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusTone = (status: string): Tone => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      default:
        return "warning";
    }
  };

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/student/courses" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.875rem", color: "var(--color-primary)", textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back to Courses
        </Link>
      </div>

      <PageHeader
        eyebrow="Course Management"
        title="Course Add / Drop Request"
        description="Formal workflow to modify your course registration schedule during the scheduled academic calendar window."
      />

      {errorMsg && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Alert tone="error">{errorMsg}</Alert>
        </div>
      )}

      {successMsg && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Alert tone="success">{successMsg}</Alert>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
          <Spinner size={32} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Submission Form */}
          <Card>
            <CardHeader title="Submit Add/Drop Request" subtitle="All requests are routed to your Academic Advisor / HOD for approval." />
            <CardBody>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
                    Action Required
                  </label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.9375rem" }}>
                      <input
                        type="radio"
                        name="action"
                        value="ADD"
                        checked={action === "ADD"}
                        onChange={() => { setAction("ADD"); setSelectedCourseId(""); }}
                      />
                      <span>Add Course</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.9375rem" }}>
                      <input
                        type="radio"
                        name="action"
                        value="DROP"
                        checked={action === "DROP"}
                        onChange={() => { setAction("DROP"); setSelectedCourseId(""); }}
                      />
                      <span>Drop Course</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
                    Select Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : "")}
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border)",
                      fontSize: "0.875rem",
                      background: "#fff",
                    }}
                    required
                  >
                    <option value="">-- Select a course --</option>
                    {action === "ADD"
                      ? addableCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.title} ({c.creditUnits} Units)
                          </option>
                        ))
                      : droppableCourses.map((it) => (
                          <option key={it.course.id} value={it.course.id}>
                            {it.course.code} - {it.course.title} ({it.course.creditUnits} Units)
                          </option>
                        ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
                    Academic Justification / Reason
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="State why you wish to add or drop this course (e.g. prerequisite requirement, elective change)..."
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border)",
                      fontSize: "0.875rem",
                      fontFamily: "inherit",
                    }}
                    required
                  />
                </div>

                <Button variant="primary" type="submit" loading={submitting}>
                  Submit Add/Drop Request
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Past Requests Table */}
          <Card>
            <CardHeader title="Request History" subtitle="Status of your course alteration submissions" />
            <CardBody>
              {requests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)", fontSize: "0.875rem" }}>
                  No Add/Drop requests submitted yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: "0.875rem",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: r.action === "ADD" ? "#059669" : "#dc2626" }}>
                            {r.action === "ADD" ? "[ADD]" : "[DROP]"}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-ink)" }}>
                            {r.courseDetail?.code || `Course #${r.course}`}
                          </span>
                        </div>
                        <Badge tone={getStatusTone(r.status)}>{r.status}</Badge>
                      </div>

                      <div style={{ fontSize: "0.8125rem", color: "var(--color-ink)" }}>
                        {r.courseDetail?.title}
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                        <strong>Reason:</strong> {r.reason}
                      </div>

                      {r.reviewNotes && (
                        <div style={{ fontSize: "0.75rem", color: "#4b5563", background: "#f9fafb", padding: "0.35rem 0.5rem", borderRadius: 4 }}>
                          <strong>Advisor Note:</strong> {r.reviewNotes} {r.reviewerName && `(by ${r.reviewerName})`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
