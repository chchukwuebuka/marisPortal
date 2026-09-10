"use client";

import { useEffect, useState } from "react";
import {
  Award,
  CheckCircle,
  Clock,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { useStudent } from "@/providers/StudentProvider";
import { getMyClearanceStatus, initiateClearance } from "@/services/students";
import type { ClearanceRequestDetail } from "@/types/student";
import type { Tone } from "@/lib/constants";

export default function StudentClearancePage() {
  const { student } = useStudent();
  const [clearance, setClearance] = useState<ClearanceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getMyClearanceStatus();
      setClearance(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load clearance status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function handleInitiate(type = "GRADUATION") {
    setInitiating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const data = await initiateClearance(type);
      setClearance(data);
      setSuccessMsg("Clearance checklist successfully initialized!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to initiate clearance request.");
    } finally {
      setInitiating(false);
    }
  }

  const getStatusTone = (status: string): Tone => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      case "IN_PROGRESS":
        return "info";
      default:
        return "warning";
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Student Portal"
        title="Departmental Clearance System"
        description="Multi-department administrative verification for examinations, semester promotions, and final graduation."
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
      ) : !clearance ? (
        <Card>
          <CardBody>
            <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
              <ShieldCheck size={52} style={{ color: "var(--color-primary)", margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
                No Active Clearance Request
              </h3>
              <p style={{ maxWidth: 500, margin: "0 auto 1.5rem", color: "var(--color-muted)", fontSize: "0.9375rem" }}>
                You have not initiated institutional clearance yet. When graduating or concluding a semester, initiate your clearance to start departmental sign-offs.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Button
                  variant="primary"
                  onClick={() => handleInitiate("GRADUATION")}
                  loading={initiating}
                >
                  Initiate Final Graduation Clearance
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleInitiate("SEMESTER")}
                  disabled={initiating}
                >
                  Initiate Semester Clearance
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Summary Banner */}
          <Card>
            <CardBody>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-ink)" }}>
                      {clearance.clearanceTypeName} Clearance
                    </h3>
                    <Badge tone={getStatusTone(clearance.status)}>
                      {clearance.overallStatusDisplay || clearance.status}
                    </Badge>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
                    Overall Progress: <strong>{clearance.completionPercentage}% Complete</strong>
                  </p>
                </div>

                <Button variant="outline" size="sm" onClick={loadStatus} leftIcon={<RefreshCw size={14} />}>
                  Refresh Status
                </Button>
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: "1rem", height: 10, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${clearance.completionPercentage}%`,
                    background: clearance.status === "APPROVED" ? "#10b981" : "var(--color-primary)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {clearance.financeAutoCleared && (
                <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "#059669", background: "#ecfdf5", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                  <CheckCircle size={16} />
                  <span>
                    <strong>Automated Bursary Clearance:</strong> Your school fees record verified zero outstanding balance and auto-cleared.
                  </span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Departmental Items Checklist */}
          <Card>
            <CardHeader title="Departmental Checklist" subtitle="Individual sign-offs required by Polytechnic statutory officers" />
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {clearance.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      background: item.status === "APPROVED" ? "#fafafa" : "#ffffff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {item.status === "APPROVED" ? (
                        <CheckCircle size={22} style={{ color: "#10b981", flexShrink: 0 }} />
                      ) : item.status === "REJECTED" ? (
                        <XCircle size={22} style={{ color: "#ef4444", flexShrink: 0 }} />
                      ) : (
                        <Clock size={22} style={{ color: "#f59e0b", flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--color-ink)", fontSize: "0.9375rem" }}>
                          {item.departmentDisplay || item.department}
                        </div>
                        {item.remarks ? (
                          <div style={{ fontSize: "0.8125rem", color: item.status === "REJECTED" ? "#b91c1c" : "var(--color-muted)", marginTop: 2 }}>
                            {item.remarks}
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginTop: 2 }}>
                            {item.status === "APPROVED" ? "Clearance approved without objection." : "Pending officer review."}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <Badge tone={getStatusTone(item.status)}>
                        {item.statusDisplay || item.status}
                      </Badge>
                      {item.reviewerName && (
                        <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: 4 }}>
                          by {item.reviewerName}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
