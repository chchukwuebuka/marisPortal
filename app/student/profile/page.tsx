"use client";

import { useState } from "react";
import { Alert, Button, Card, CardBody, CardHeader, Field, Input, Select, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { useStudent } from "@/providers/StudentProvider";
import { CheckCircle2, ShieldCheck, User, Smartphone, Monitor, LogOut, RefreshCw } from "lucide-react";
import { getActiveSessions, revokeSession, revokeAllSessions } from "@/services/auth";
import type { ActiveSession } from "@/types/student";

export default function StudentProfilePage() {
  const { student, profile, updateProfile, loading } = useStudent();
  const [isSaving, setIsSaving] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionMsg, setSessionMsg] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await getActiveSessions();
      setSessions(data);
    } catch (err: any) {
      console.warn("Failed to load active sessions", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useState(() => {
    void loadSessions();
  });

  const handleRevokeSession = async (id: number) => {
    try {
      await revokeSession(id);
      setSessionMsg("Device logged out successfully.");
      await loadSessions();
    } catch (err: any) {
      setSessionMsg(err?.message || "Failed to log out device.");
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await revokeAllSessions();
      setSessionMsg("All other devices logged out.");
      await loadSessions();
    } catch (err: any) {
      setSessionMsg(err?.message || "Failed to revoke sessions.");
    }
  };
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [stateOfOrigin, setStateOfOrigin] = useState(profile?.stateOfOrigin || "");
  const [lga, setLga] = useState(profile?.lga || "");
  const [residentialAddress, setResidentialAddress] = useState(profile?.residentialAddress || "");
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup || "");
  const [genotype, setGenotype] = useState(profile?.genotype || "");
  const [emergencyContactName, setEmergencyContactName] = useState(profile?.emergencyContactName || "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile?.emergencyContactPhone || "");

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!student) {
    return (
      <Alert tone="warning" title="No Record">
        Student profile could not be located.
      </Alert>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateProfile({
        stateOfOrigin,
        lga,
        residentialAddress,
        bloodGroup,
        genotype,
        emergencyContactName,
        emergencyContactPhone,
      });
      setSuccessMsg("Your student biodata has been successfully updated.");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Student Portal"
        title="Student Profile & Biodata"
        description="View your institutional academic record and update personal emergency biodata."
      />

      {successMsg && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Alert tone="success" title="Profile Saved">
            {successMsg}
          </Alert>
        </div>
      )}

      {errorMsg && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Alert tone="error" title="Error">
            {errorMsg}
          </Alert>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Academic Record Card (Read Only) */}
        <Card>
          <CardHeader
            title="Institutional Academic Record"
            subtitle="Official enrollment details verified by the Admissions Office."
          />
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>
                  Matriculation Number
                </span>
                <p style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary)" }}>
                  {student.matricNumber}
                </p>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>
                  Student ID
                </span>
                <p style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 600 }}>
                  {student.studentId}
                </p>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>
                  Programme & Level
                </span>
                <p style={{ fontWeight: 600 }}>
                  {student.programmeName || "Computer Science"} ({student.currentLevel?.name || "ND 1"})
                </p>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>
                  Department & School
                </span>
                <p style={{ color: "var(--color-ink-soft)" }}>
                  {student.departmentName || "Computer Science"} — {student.schoolName || "Applied Sciences"}
                </p>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase" }}>
                  Academic Session & Entry Mode
                </span>
                <p style={{ color: "var(--color-ink-soft)" }}>
                  {student.admittedSessionName || "2026/2027"} Session | {student.entryMode}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", padding: "0.75rem", background: "var(--color-surface-sunken)", borderRadius: "8px" }}>
                <ShieldCheck size={18} style={{ color: "var(--color-primary)" }} />
                <span style={{ fontSize: "0.8125rem", color: "var(--color-muted-strong)" }}>
                  Official details managed by the Academic Registry.
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Editable Biodata Form */}
        <Card>
          <CardHeader
            title="Personal & Medical Biodata"
            subtitle="Keep your contact, medical information, and origin records accurate."
          />
          <CardBody>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="State of Origin">
                  <Input
                    value={stateOfOrigin}
                    onChange={(e) => setStateOfOrigin(e.target.value)}
                    placeholder="e.g. Enugu"
                  />
                </Field>

                <Field label="LGA of Origin">
                  <Input
                    value={lga}
                    onChange={(e) => setLga(e.target.value)}
                    placeholder="e.g. Udi"
                  />
                </Field>
              </div>

              <Field label="Residential Address">
                <Input
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  placeholder="Street address, city"
                />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Blood Group">
                  <Select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="">Select blood group</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </Select>
                </Field>

                <Field label="Genotype">
                  <Select
                    value={genotype}
                    onChange={(e) => setGenotype(e.target.value)}
                  >
                    <option value="">Select genotype</option>
                    <option value="AA">AA</option>
                    <option value="AS">AS</option>
                    <option value="SS">SS</option>
                    <option value="AC">AC</option>
                  </Select>
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Emergency Contact Name">
                  <Input
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Full name"
                  />
                </Field>

                <Field label="Emergency Phone">
                  <Input
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="080xxxxxxxx"
                  />
                </Field>
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                <Button
                  variant="primary"
                  type="submit"
                  loading={isSaving}
                  leftIcon={<CheckCircle2 size={16} />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

      {/* Active Login Sessions & Security Card */}
      <Card style={{ marginTop: "1.5rem" }}>
        <CardHeader
          title="Device Security & Active Sessions"
          subtitle="View logged-in devices and remotely revoke unauthorized sessions."
        />
        <CardBody>
          {sessionMsg && (
            <div style={{ marginBottom: "1rem" }}>
              <Alert tone="info">{sessionMsg}</Alert>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
              Manage active JWT sessions across phones, tablets, and computers.
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button variant="ghost" size="sm" onClick={loadSessions} disabled={loadingSessions}>
                <RefreshCw size={14} style={{ marginRight: 4 }} /> Refresh
              </Button>
              <Button variant="danger" size="sm" onClick={handleRevokeAllSessions}>
                <LogOut size={14} style={{ marginRight: 4 }} /> Log Out All Other Devices
              </Button>
            </div>
          </div>

          {loadingSessions ? (
            <div style={{ padding: "1.5rem", display: "flex", justifyContent: "center" }}>
              <Spinner size={24} />
            </div>
          ) : sessions.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", padding: "1rem 0" }}>
              No other active sessions detected.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: "0.875rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    background: s.isCurrent ? "#f0fdf4" : "#ffffff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Monitor size={20} style={{ color: s.isCurrent ? "#16a34a" : "var(--color-muted)" }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-ink)" }}>
                          {s.deviceName || "Web Browser"}
                        </span>
                        {s.isCurrent && (
                          <span style={{ fontSize: "0.6875rem", background: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: 999, fontWeight: 700 }}>
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: 2 }}>
                        IP: {s.ipAddress} | Active: {new Date(s.lastActivity).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {!s.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(s.id)}
                    >
                      Sign Out Device
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
      </div>
    </>
  );
}
