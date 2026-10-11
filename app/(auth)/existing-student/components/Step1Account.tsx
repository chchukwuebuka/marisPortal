import { useState } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Info, Loader2 } from "lucide-react";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import type { LegacyLookupResponse } from "@/services/legacy";
import type { LegacyStartInput } from "@/types/legacy";
import styles from "../existing-student.module.css";

interface Step1AccountProps {
  resumeMode: "new" | "resume";
  setResumeMode: (mode: "new" | "resume") => void;
  lookupResult: LegacyLookupResponse | null;
  setLookupResult: (res: LegacyLookupResponse | null) => void;
  lookupLoading: boolean;
  handleMatricLookup: (explicitMatric?: string) => Promise<void>;
  resumeEmail: string;
  setResumeEmail: (email: string) => void;
  resumePassword: string;
  setResumePassword: (password: string) => void;
  resuming: boolean;
  unverifiedEmail: string | null;
  handleResumeRegistration: (e: React.FormEvent) => Promise<void>;
  startForm: LegacyStartInput;
  setStartForm: React.Dispatch<React.SetStateAction<LegacyStartInput>>;
  submitting: boolean;
  handleStartRegistration: (e: React.FormEvent) => Promise<void>;
  setErrorMsg: (msg: string | null) => void;
}

export function Step1Account({
  resumeMode,
  setResumeMode,
  lookupResult,
  setLookupResult,
  lookupLoading,
  handleMatricLookup,
  resumeEmail,
  setResumeEmail,
  resumePassword,
  setResumePassword,
  resuming,
  unverifiedEmail,
  handleResumeRegistration,
  startForm,
  setStartForm,
  submitting,
  handleStartRegistration,
  setErrorMsg,
}: Step1AccountProps) {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  return (
    <Card className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardIconBox}>
          <GraduationCap size={22} />
        </div>
        <div>
          <h2 className={styles.cardTitle}>Step 1: Enter Your Matriculation Number</h2>
          <p className={styles.cardDesc}>
            Provide your existing matric number and create secure credentials for portal access.
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "5px",
          background: "#f1f5f9",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setResumeMode("new");
            setErrorMsg(null);
          }}
          style={{
            flex: 1,
            padding: "9px 14px",
            borderRadius: "8px",
            border: "none",
            fontSize: "13px",
            fontWeight: resumeMode === "new" ? 600 : 500,
            background: resumeMode === "new" ? "#ffffff" : "transparent",
            color: resumeMode === "new" ? "#1e3a8a" : "#64748b",
            boxShadow: resumeMode === "new" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          First-Time Registration
        </button>
        <button
          type="button"
          onClick={() => {
            setResumeMode("resume");
            setErrorMsg(null);
          }}
          style={{
            flex: 1,
            padding: "9px 14px",
            borderRadius: "8px",
            border: "none",
            fontSize: "13px",
            fontWeight: resumeMode === "resume" ? 600 : 500,
            background: resumeMode === "resume" ? "#ffffff" : "transparent",
            color: resumeMode === "resume" ? "#1e3a8a" : "#64748b",
            boxShadow: resumeMode === "resume" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Resume Active Application
        </button>
      </div>

      {resumeMode === "resume" ? (
        /* RESUME APPLICATION / RETURNING STUDENT VIEW */
        <div>
          {lookupResult ? (
            <div
              style={{
                padding: "16px 18px",
                borderRadius: "10px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#166534" }}>
                  Existing Record Found: {lookupResult.matric_number}
                </span>
                <Badge tone={lookupResult.status === "correction_required" ? "warning" : "info"}>
                  {lookupResult.status_display || lookupResult.status}
                </Badge>
              </div>
              {lookupResult.full_name && (
                <p style={{ margin: "2px 0 6px 0", fontSize: "13px", color: "#15803d" }}>
                  Student Name: <strong>{lookupResult.full_name}</strong>
                </p>
              )}
              {lookupResult.correction_note && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    fontSize: "13px",
                    color: "#92400e",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: 3, color: "#b45309" }}>
                    Registry Correction Instructions:
                  </strong>
                  <span>{lookupResult.correction_note}</span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.infoCallout} style={{ marginBottom: "20px" }}>
              <Info size={18} />
              <span>
                <strong>Returning Student:</strong> Enter your portal email and password to resume
                your registration right where you left off.
              </span>
            </div>
          )}

          <form onSubmit={handleResumeRegistration} className={styles.form}>
            {unverifiedEmail && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "#fffbeb",
                  border: "1.5px solid #f59e0b",
                  marginBottom: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#92400e" }}>
                  Email verification pending for {unverifiedEmail}
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12.5px",
                    color: "#78350f",
                    lineHeight: "1.5",
                  }}
                >
                  Check your email inbox for the verification link, or request a new link below:
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    marginTop: "4px",
                  }}
                >
                  <Button
                    type="button"
                    size="sm"
                    disabled={resending}
                    onClick={async () => {
                      setResending(true);
                      try {
                        const { resendVerification } = await import("@/services/auth");
                        await resendVerification(unverifiedEmail);
                        setResendSuccess("Verification email resent! Check your inbox.");
                      } catch {
                        setErrorMsg("Failed to resend verification email.");
                      } finally {
                        setResending(false);
                      }
                    }}
                  >
                    {resending ? "Sending..." : "Resend Verification Link"}
                  </Button>
                  <Link
                    href={`/verify?email=${encodeURIComponent(unverifiedEmail)}`}
                    style={{
                      fontSize: "12.5px",
                      color: "#1e3a8a",
                      textDecoration: "underline",
                      fontWeight: 600,
                    }}
                  >
                    Enter token code manually &rarr;
                  </Link>
                </div>
                {resendSuccess && (
                  <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 600 }}>
                    ✓ {resendSuccess}
                  </span>
                )}
              </div>
            )}
            <Field label="Email Address Registered on Account" required>
              <Input
                type="email"
                placeholder="student@example.com"
                value={resumeEmail}
                onChange={(e) => setResumeEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Portal Password" required>
              <Input
                type="password"
                placeholder="Enter your password"
                value={resumePassword}
                onChange={(e) => setResumePassword(e.target.value)}
                required
              />
            </Field>

            <div className={styles.cardActions}>
              <button
                type="button"
                onClick={() => {
                  setLookupResult(null);
                  setResumeMode("new");
                }}
                className={styles.cancelLink}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                Start a new registration instead
              </button>
              <Button type="submit" disabled={resuming}>
                {resuming ? (
                  <>
                    <Loader2 className={styles.spinIcon} size={16} /> Resuming Dossier...
                  </>
                ) : (
                  <>Resume Application &rarr;</>
                )}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* FIRST-TIME REGISTRATION VIEW */
        <div>
          <div className={styles.infoCallout}>
            <Info size={18} />
            <span>
              <strong>Important:</strong> Your matriculation number will be cross-referenced with
              Marist Polytechnic's historical records. Ensure your name and phone match your official
              admission credentials.
            </span>
          </div>

          <form onSubmit={handleStartRegistration} className={styles.form}>
            <div className={styles.formGrid2}>
              <Field label="Institutional Matriculation Number" required>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Input
                    placeholder="e.g. MAP/ND/CS/2022/0042"
                    value={startForm.matric_number}
                    onChange={(e) =>
                      setStartForm({ ...startForm, matric_number: e.target.value.toUpperCase() })
                    }
                    onBlur={() => handleMatricLookup()}
                    autoCapitalize="characters"
                    required
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={lookupLoading || !startForm.matric_number.trim()}
                    onClick={() => handleMatricLookup()}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {lookupLoading ? <Loader2 className={styles.spinIcon} size={14} /> : "Check"}
                  </Button>
                </div>
              </Field>
              <Field label="Phone Number" required>
                <Input
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={startForm.phone}
                  onChange={(e) => setStartForm({ ...startForm, phone: e.target.value })}
                  required
                />
              </Field>
            </div>

            <div className={styles.formGrid2}>
              <Field label="First Name" required>
                <Input
                  placeholder="First name"
                  value={startForm.first_name}
                  onChange={(e) => setStartForm({ ...startForm, first_name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Last Name" required>
                <Input
                  placeholder="Last name"
                  value={startForm.last_name}
                  onChange={(e) => setStartForm({ ...startForm, last_name: e.target.value })}
                  required
                />
              </Field>
            </div>

            <Field label="Email Address (Used for Login & Registry Notifications)" required>
              <Input
                type="email"
                placeholder="student@example.com"
                value={startForm.email}
                onChange={(e) => setStartForm({ ...startForm, email: e.target.value })}
                required
              />
            </Field>

            <div className={styles.formGrid2}>
              <Field label="Portal Password" required>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={startForm.password}
                  onChange={(e) => setStartForm({ ...startForm, password: e.target.value })}
                  required
                />
              </Field>

              <Field label="Confirm Password" required>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={startForm.password_confirm}
                  onChange={(e) =>
                    setStartForm({
                      ...startForm,
                      password_confirm: e.target.value,
                    })
                  }
                  required
                />
              </Field>
            </div>

            <div className={styles.cardActions}>
              <button
                type="button"
                onClick={() => {
                  if (startForm.email) setResumeEmail(startForm.email);
                  setResumeMode("resume");
                }}
                className={styles.cancelLink}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                Already registered? Resume application &rarr;
              </button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className={styles.spinIcon} size={16} /> Validating Record...
                  </>
                ) : (
                  <>
                    Start Onboarding <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}
