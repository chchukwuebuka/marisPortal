"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ClipboardCheck,
  GraduationCap,
  Lock,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";
import { checkAdmissionStatus } from "@/services/catalogue";
import styles from "./auth.module.css";

const OPEN_FEATURES = [
  { icon: GraduationCap, label: "Apply to ND & HND programmes" },
  { icon: UploadCloud, label: "Upload your documents once" },
  { icon: ClipboardCheck, label: "Track your admission in real time" },
];

const CLOSED_FEATURES = [
  { icon: ShieldAlert, label: "Admissions currently paused" },
  { icon: UploadCloud, label: "Existing applicants can sign in" },
  { icon: GraduationCap, label: "Admitted students can access SMS portal" },
];

export function AuthBrandPanel() {
  const [sessionInfo, setSessionInfo] = useState<{
    loaded: boolean;
    isOpen: boolean;
    sessionName: string;
  }>({
    loaded: false,
    isOpen: true,
    sessionName: "2026 / 2027",
  });

  useEffect(() => {
    let mounted = true;
    checkAdmissionStatus().then((status) => {
      if (!mounted) return;
      setSessionInfo({
        loaded: true,
        isOpen: status.isOpen,
        sessionName: status.sessionName || "2026 / 2027",
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isClosed = sessionInfo.loaded && !sessionInfo.isOpen;
  const features = isClosed ? CLOSED_FEATURES : OPEN_FEATURES;

  return (
    <aside className={styles.brandPanel}>
      <Link href="/" className={styles.brandTop}>
        <span className={styles.brandCrest}>
          <Image src="/image/logo.png" alt="Logo" width={40} height={40} />
        </span>
        <span>
          <span className={styles.brandName}>Marist Polytechnic</span>
          <br />
          <span className={styles.brandTag}>
            {isClosed ? "Student & Admissions Portal" : "Admissions Portal"}
          </span>
        </span>
      </Link>

      <div className={styles.brandMid}>
        {isClosed && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "rgba(245, 158, 11, 0.22)",
              border: "1px solid rgba(245, 158, 11, 0.45)",
              color: "#fef08a",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            <Lock size={14} /> Admissions Currently Closed
          </div>
        )}

        <h1 className={styles.brandHeadline}>
          {isClosed
            ? "Admissions are currently closed."
            : "Your place at Marist starts here."}
        </h1>
        <p className={styles.brandLede}>
          {isClosed
            ? `Admission applications for the ${sessionInfo.sessionName} academic session are closed. Returning applicants and admitted students may sign in to access their portals.`
            : "Create an account to apply, submit your documents, and follow your application through to admission."}
        </p>
        <ul className={styles.features}>
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className={styles.feature}>
              <span className={styles.featureIcon}>
                <Icon size={17} />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.brandFoot}>
        {sessionInfo.sessionName} Admissions · Marist Polytechnic
        {isClosed ? " (Closed)" : ""}
      </p>
    </aside>
  );
}

