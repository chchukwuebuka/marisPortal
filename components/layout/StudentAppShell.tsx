"use client";

import { useState } from "react";
import { StudentSidebar } from "./StudentSidebar";
import { StudentTopbar } from "./StudentTopbar";
import styles from "./AppShell.module.css";

export function StudentAppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <StudentSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={styles.main}>
        <StudentTopbar onMenuClick={() => setMenuOpen(true)} />
        <main className={styles.content}>
          <div className={styles.inner}>{children}</div>
        </main>
      </div>
    </div>
  );
}
