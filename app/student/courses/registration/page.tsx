"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Lock,
  Save,
  Send,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { useStudent } from "@/providers/StudentProvider";
import {
  getAvailableCourses,
  getCurrentRegistration,
  saveRegistrationDraft,
  submitRegistration,
} from "@/services/students";
import type { AvailableCoursesData, AvailableCourseEntry, CourseRegistration, CourseRegistrationItem } from "@/types/student";

export default function CourseRegistrationPage() {
  const { student } = useStudent();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableData, setAvailableData] = useState<AvailableCoursesData | null>(null);
  const [currentReg, setCurrentReg] = useState<CourseRegistration | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [avail, cur] = await Promise.all([
        getAvailableCourses(),
        getCurrentRegistration(),
      ]);
      setAvailableData(avail);
      setCurrentReg(cur.registration);

      const initialSelected = new Set<number>();
      // Always preselect compulsory courses
      avail.compulsoryCourses.forEach((c: AvailableCourseEntry) => initialSelected.add(c.course));

      // If current registration has items (draft or submitted), mirror them
      if (cur.registration?.items && cur.registration.items.length > 0) {
        cur.registration.items.forEach((item: CourseRegistrationItem) => {
          if (item.status !== "dropped") {
            initialSelected.add(item.course.id);
          }
        });
      }
      setSelectedIds(initialSelected);
    } catch (err: unknown) {
      console.error("Failed to load registration data:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Could not load course registration details. Please verify your student profile."
      );
    } finally {
      setLoading(false);
    }
  }

  // Calculate live total credits
  const compulsoryCredits = (availableData?.compulsoryCourses || []).reduce(
    (sum, c) => sum + (c.creditUnits || 0),
    0
  );

  const electiveCredits = (availableData?.electiveCourses || [])
    .filter((c) => selectedIds.has(c.course))
    .reduce((sum, c) => sum + (c.creditUnits || 0), 0);

  const totalCredits = compulsoryCredits + electiveCredits;
  const minCredits = availableData?.minCredits ?? 12;
  const maxCredits = availableData?.maxCredits ?? 24;

  const isBelowMin = totalCredits < minCredits;
  const isAboveMax = totalCredits > maxCredits;
  const isCreditValid = !isBelowMin && !isAboveMax;

  const isLocked = currentReg?.status === "approved" || currentReg?.status === "submitted";

  function toggleElective(courseId: number) {
    if (isLocked) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  }

  async function handleSaveDraft() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const reg = await saveRegistrationDraft(Array.from(selectedIds));
      setCurrentReg(reg);
      setSuccessMsg("Course selection saved as draft. You can return anytime to finalize and submit.");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save draft registration.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!isCreditValid) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const reg = await submitRegistration(Array.from(selectedIds));
      setCurrentReg(reg);
      setSuccessMsg("Course registration submitted successfully! It is now queued for Academic Advisor review.");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit course registration.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <>
      {/* ── Responsive styles ─────────────────────────────────────── */}
      <style>{`
        /* PageHeader action buttons */
        .reg-header-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
          align-items: center;
        }

        /* Stat-card grid */
        .reg-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        /* Course row: left side (icon + info) */
        .reg-course-left {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          min-width: 0;
          flex: 1;
        }

        /* Course code + title inline pair */
        .reg-course-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.375rem;
          min-width: 0;
        }

        /* Course row: right side badges */
        .reg-course-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
          margin-left: 0.5rem;
        }

        /* Individual course row */
        .reg-course-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          transition: all 0.15s ease;
        }

        /* Sticky footer */
        .reg-footer {
          position: sticky;
          bottom: 1.5rem;
          background: #ffffff;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.10);
          border: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .reg-footer-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .reg-footer-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* ── Mobile breakpoint (≤ 640 px) ────────────────────── */
        @media (max-width: 640px) {
          .reg-stat-grid {
            grid-template-columns: 1fr;
          }

          .reg-header-actions {
            flex-direction: column;
            align-items: stretch;
          }

          /* Stack course row content vertically on very small screens */
          .reg-course-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .reg-course-left {
            width: 100%;
          }

          .reg-course-badges {
            margin-left: 0;
            align-self: flex-start;
          }

          /* Footer: stack info + buttons vertically */
          .reg-footer {
            flex-direction: column;
            align-items: stretch;
            bottom: 0.75rem;
            border-radius: 0;
            padding: 1rem;
            /* Stretch to full width inside the page padding */
            margin-left: calc(-1 * var(--page-padding, 1rem));
            margin-right: calc(-1 * var(--page-padding, 1rem));
          }

          .reg-footer-info span.reg-footer-range {
            display: block;
            margin-left: 0 !important;
          }

          .reg-footer-actions {
            flex-direction: column;
          }

          .reg-footer-actions > * {
            width: 100%;
            justify-content: center;
          }
        }

        /* ── Small-tablet breakpoint (641 – 768 px) ─────────── */
        @media (min-width: 641px) and (max-width: 768px) {
          .reg-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      {/* ── Page header ───────────────────────────────────────────── */}
      <PageHeader
        eyebrow="Academic Management"
        title="Course Registration Portal"
        description="Select your core curriculum and approved elective courses for the active semester."
        actions={
          <div className="reg-header-actions">
            {currentReg?.id && (
              <Link href={`/student/courses/slip?id=${currentReg.id}`}>
                <Button variant="secondary" leftIcon={<FileText size={16} />}>
                  View Registration Slip
                </Button>
              </Link>
            )}
            {!isLocked && (
              <>
                <Button
                  variant="secondary"
                  disabled={saving || submitting || selectedIds.size === 0}
                  onClick={handleSaveDraft}
                  leftIcon={<Save size={16} />}
                >
                  {saving ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  variant="primary"
                  disabled={saving || submitting || !isCreditValid}
                  onClick={handleSubmit}
                  leftIcon={<Send size={16} />}
                >
                  {submitting ? "Submitting..." : "Submit Registration"}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* ── Alert messages ────────────────────────────────────────── */}
      {successMsg && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Alert tone="success" title="Success">
            {successMsg}
          </Alert>
        </div>
      )}

      {errorMsg && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Alert tone="error" title="Registration Error">
            {errorMsg}
          </Alert>
        </div>
      )}

      {/* ── Registration status banner ────────────────────────────── */}
      {currentReg && (
        <div style={{ marginBottom: "1.5rem" }}>
          {currentReg.status === "approved" && (
            <Alert tone="success" title="Official Course Registration Approved">
              Your course registration for {currentReg.sessionName} ({currentReg.semesterName}) has been approved by your Academic Advisor.
              You can now print your official Course Registration Slip.
            </Alert>
          )}
          {currentReg.status === "submitted" && (
            <Alert tone="info" title="Registration Awaiting Advisor Endorsement">
              Your course registration was submitted on {new Date(currentReg.submittedAt || "").toLocaleDateString()} and is pending approval by your Departmental Academic Advisor.
            </Alert>
          )}
          {currentReg.status === "rejected" && (
            <Alert tone="error" title="Registration Requires Revision">
              Your registration was returned: {currentReg.rejectionReason || "Please adjust your course selections and resubmit."}
            </Alert>
          )}
          {currentReg.status === "draft" && (
            <Alert tone="warning" title="Draft Course Selection">
              You have a saved draft with {currentReg.totalCredits} units. Make sure to click &ldquo;Submit Registration&rdquo; before the deadline to complete your registration.
            </Alert>
          )}
        </div>
      )}

      {/* ── Overview stat cards ───────────────────────────────────── */}
      <div className="reg-stat-grid">
        {/* Session & Semester */}
        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Active Session &amp; Semester
          </span>
          <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-ink)", marginTop: "0.25rem" }}>
            {availableData?.session?.name || "2026/2027"} — {availableData?.semester?.name || "First Semester"}
          </p>
        </div>

        {/* Level & Programme */}
        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Academic Level &amp; Programme
          </span>
          <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-primary)", marginTop: "0.25rem" }}>
            {student?.currentLevel?.name || "100 Level"} ({student?.programmeCode || "ND"})
          </p>
        </div>

        {/* Live Credit Meter */}
        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Credit Meter (Min {minCredits} — Max {maxCredits})
            </span>
            <Badge tone={isBelowMin ? "warning" : isAboveMax ? "error" : "success"}>
              {totalCredits} / {maxCredits} Units
            </Badge>
          </div>
          <div
            style={{
              height: "8px",
              width: "100%",
              background: "#e2e8f0",
              borderRadius: "4px",
              marginTop: "0.75rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (totalCredits / maxCredits) * 100)}%`,
                background: isBelowMin ? "#f59e0b" : isAboveMax ? "#ef4444" : "#10b981",
                transition: "width 0.3s ease, background-color 0.3s ease",
              }}
            />
          </div>
          <p style={{ fontSize: "0.75rem", color: isBelowMin ? "#d97706" : isAboveMax ? "#dc2626" : "#059669", marginTop: "0.4rem", fontWeight: 600 }}>
            {isBelowMin
              ? `Select at least ${minCredits - totalCredits} more credit unit(s) to meet minimum.`
              : isAboveMax
              ? `Over limit! Remove ${totalCredits - maxCredits} credit unit(s).`
              : "Credit requirements fulfilled."}
          </p>
        </div>

        {/* Registration Status */}
        <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Registration Status
          </span>
          <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-ink)", marginTop: "0.25rem" }}>
            {currentReg ? currentReg.status.toUpperCase() : "UNREGISTERED"}
          </p>
        </div>
      </div>

      {/* ── Compulsory courses ────────────────────────────────────── */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <CardHeader
          title="1. Compulsory Core Curriculum (Mandatory)"
          subtitle="These courses are required for all students at your level and are automatically included."
        />
        <CardBody>
          {availableData?.compulsoryCourses.length === 0 ? (
            <p style={{ color: "var(--color-muted)" }}>No compulsory courses listed for this semester.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {availableData?.compulsoryCourses.map((c) => (
                <div
                  key={c.id}
                  className="reg-course-row"
                  style={{ background: "#f8fafc" }}
                >
                  {/* Left: lock icon + info */}
                  <div className="reg-course-left">
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        minWidth: "22px",
                        borderRadius: "4px",
                        background: "#059669",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Compulsory (Locked)"
                    >
                      <Lock size={12} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="reg-course-meta">
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-primary)", whiteSpace: "nowrap" }}>
                          {c.courseCode}
                        </span>
                        <span style={{ fontWeight: 600, color: "var(--color-ink)", wordBreak: "break-word" }}>
                          {c.courseTitle}
                        </span>
                      </div>
                      {c.prerequisiteCode && (
                        <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 500 }}>
                          Prerequisite: {c.prerequisiteCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: badges */}
                  <div className="reg-course-badges">
                    <Badge tone="neutral">Compulsory</Badge>
                    <Badge tone="info">{c.creditUnits} Units</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Elective courses ──────────────────────────────────────── */}
      <Card style={{ marginBottom: "2rem" }}>
        <CardHeader
          title="2. Elective Courses (Optional / Departmental Options)"
          subtitle="Choose elective courses to complement your curriculum and fulfill required credit unit totals."
        />
        <CardBody>
          {availableData?.electiveCourses.length === 0 ? (
            <p style={{ color: "var(--color-muted)" }}>No elective courses offered for this level this semester.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {availableData?.electiveCourses.map((c) => {
                const isSelected = selectedIds.has(c.course);
                return (
                  <div
                    key={c.id}
                    onClick={() => !isLocked && toggleElective(c.course)}
                    className="reg-course-row"
                    style={{
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      border: isSelected ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                      cursor: isLocked ? "default" : "pointer",
                    }}
                  >
                    {/* Left: checkbox + info */}
                    <div className="reg-course-left">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isLocked}
                        onChange={() => toggleElective(c.course)}
                        style={{
                          width: "18px",
                          height: "18px",
                          minWidth: "18px",
                          cursor: isLocked ? "default" : "pointer",
                          accentColor: "var(--color-primary)",
                          marginTop: "2px",
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div className="reg-course-meta">
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-primary)", whiteSpace: "nowrap" }}>
                            {c.courseCode}
                          </span>
                          <span style={{ fontWeight: 600, color: "var(--color-ink)", wordBreak: "break-word" }}>
                            {c.courseTitle}
                          </span>
                        </div>
                        {c.prerequisiteCode && (
                          <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 500 }}>
                            Prerequisite: {c.prerequisiteCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: badges */}
                    <div className="reg-course-badges">
                      <Badge tone="neutral">Elective</Badge>
                      <Badge tone={isSelected ? "info" : "neutral"}>{c.creditUnits} Units</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Sticky action footer ──────────────────────────────────── */}
      {!isLocked && (
        <div className="reg-footer">
          <div className="reg-footer-info">
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-ink)" }}>
              Total Units Selected: {totalCredits} Units
            </span>
            <span className="reg-footer-range" style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
              Allowed Range: {minCredits} – {maxCredits} Units
            </span>
          </div>

          <div className="reg-footer-actions">
            <Button
              variant="secondary"
              disabled={saving || submitting}
              onClick={handleSaveDraft}
              leftIcon={<Save size={16} />}
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              variant="primary"
              disabled={saving || submitting || !isCreditValid}
              onClick={handleSubmit}
              leftIcon={<Send size={16} />}
            >
              {submitting ? "Submitting..." : "Submit Course Registration"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
