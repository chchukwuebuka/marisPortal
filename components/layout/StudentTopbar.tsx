"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/providers/StudentProvider";
import { initials, resolveMediaUrl } from "@/lib/format";
import styles from "./Topbar.module.css";

export function StudentTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { student } = useStudent();
  const { user, logout } = useAuth();
  const [imgError, setImgError] = useState(false);

  const fullName = student?.user?.fullName || user?.fullName || "Student";
  const email = student?.user?.email || user?.email || "";
  const photoUrl = resolveMediaUrl(student?.profile?.photoUrl);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

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
        {student && (
          <span className={styles.session}>
            {student.admittedSessionName || "2026 / 2027"} Session
          </span>
        )}
        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden>
            {photoUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={fullName}
                className={styles.avatarImg}
                onError={() => setImgError(true)}
              />
            ) : (
              initials(fullName)
            )}
          </span>
          <span className={styles.userMeta}>
            <span className={styles.userName}>{fullName}</span>
            <span className={styles.userEmail}>
              {student ? student.matricNumber : email}
            </span>
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
