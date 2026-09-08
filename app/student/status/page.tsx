"use client";

import { CheckCircle, Clock, FileText, History, ShieldCheck } from "lucide-react";
import { Badge, Card, CardBody, CardHeader, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { useStudent } from "@/providers/StudentProvider";
import { formatDate } from "@/lib/format";

export default function StudentStatusPage() {
  const { student, statusHistory, loading } = useStudent();

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Student Portal"
        title="Academic Standing & History"
        description="Official timeline of your institutional registration, enrollment audits, and standing."
      />

      {/* Current Standing Card */}
      <Card style={{ marginBottom: "2rem" }}>
        <CardBody>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={28} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-muted)", fontWeight: 600 }}>
                  Current Institutional Standing
                </span>
                <h3 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-ink)", textTransform: "capitalize" }}>
                  {student?.status === "active" ? "Active (In Good Standing)" : student?.status || "Provisional"}
                </h3>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Matriculation Number</span>
              <p style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary)" }}>
                {student?.matricNumber}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Status History Timeline */}
      <Card>
        <CardHeader
          title="Status Progression Timeline"
          subtitle="Audited transitions recorded by the Marist Polytechnic Registrar."
        />
        <CardBody>
          {statusHistory.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem" }}>
              <ShieldCheck size={24} style={{ color: "#059669" }} />
              <div>
                <p style={{ fontWeight: 600 }}>Initial Admission Accepted &amp; Record Created</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                  Admitted to {student?.programmeName || "Academic Programme"} — {student?.admittedSessionName || "2026/2027 Session"}.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {statusHistory.map((h, i) => (
                <div key={h.id || i} style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-primary)" }} />
                    {i < statusHistory.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: "var(--color-border)", minHeight: 40 }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9375rem", textTransform: "capitalize" }}>
                        {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                        {formatDate(h.changedAt)}
                      </span>
                    </div>
                    {h.reason && (
                      <p style={{ fontSize: "0.8125rem", color: "var(--color-muted-strong)" }}>
                        {h.reason}
                      </p>
                    )}
                    {h.changedByName && (
                      <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>
                        Authorized by: {h.changedByName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
