"use client";

import { LogOut, Menu } from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/format";
import styles from "./Topbar.module.css";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { applicant } = useApplication();
  const { logout } = useAuth();
  const fullName = `${applicant.firstName} ${applicant.lastName}`;

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className={styles.spacer} />

      <div className={styles.right}>
        <span className={styles.session}>2026 / 2027 Session</span>
        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden>
            {initials(fullName)}
          </span>
          <span className={styles.userMeta}>
            <span className={styles.userName}>{fullName}</span>
            <span className={styles.userEmail}>{applicant.email}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className={styles.signOut}
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
