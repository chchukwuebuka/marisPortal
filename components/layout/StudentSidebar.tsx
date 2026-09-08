"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FolderArchive,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStudent } from "@/providers/StudentProvider";
import styles from "./StudentSidebar.module.css";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  exact?: boolean;
}

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/student/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Profile & Biodata",
    href: "/student/profile",
    icon: User,
  },
  {
    label: "Course Registration",
    href: "/student/courses/registration",
    icon: BookOpen,
  },
  {
    label: "Registered Courses",
    href: "/student/courses",
    icon: GraduationCap,
    exact: true,
  },
  {
    label: "Registration Slip",
    href: "/student/courses/slip",
    icon: FileText,
  },
  {
    label: "Results & CGPA",
    href: "/student/results",
    icon: Award,
  },
  {
    label: "School Fees & Invoices",
    href: "/student/fees",
    icon: CreditCard,
  },
  {
    label: "Hostel Accommodation",
    href: "/student/hostel",
    icon: Building2,
  },
  {
    label: "Administrative Requests",
    href: "/student/requests",
    icon: ClipboardList,
  },
  {
    label: "Document Centre",
    href: "/student/documents",
    icon: FolderArchive,
  },
  {
    label: "Guardians & Emergency",
    href: "/student/guardians",
    icon: Users,
  },
  {
    label: "Academic Status",
    href: "/student/status",
    icon: History,
  },
];

export function StudentSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { student } = useStudent();

  return (
    <>
      <div
        className={cn(styles.backdrop, open && styles.backdropOpen)}
        onClick={onClose}
        aria-hidden
      />
      <aside className={cn(styles.sidebar, open && styles.sidebarOpen)}>
        <div className={styles.brand}>
          <Link href="/student/dashboard" className={styles.brandLink}>
            <Image
              src="/image/logo.png"
              alt="Logo"
              width={38}
              height={38}
              className={styles.crestImg}
            />
            <span className={styles.brandText}>
              <span className={styles.brandName}>Marist Polytechnic</span>
              <span className={styles.brandTag}>Student Portal (SMS)</span>
            </span>
          </Link>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {student && (
          <div className={styles.studentCard}>
            <div className={styles.matricLabel}>Matriculation No.</div>
            <div className={styles.matricValue}>{student.matricNumber}</div>
            <div className={styles.studentSub}>
              <span className={styles.levelTag}>
                {student.currentLevel?.code || "Level 1"}
              </span>
              <span className={styles.statusPill}>{student.status}</span>
            </div>
          </div>
        )}

        <nav className={styles.nav} aria-label="Student Navigation">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(styles.link, active && styles.linkActive)}
                aria-current={active ? "page" : undefined}
                onClick={onClose}
              >
                <span className={styles.linkIcon}>
                  <Icon size={18} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <Link href="/applicant/dashboard" className={styles.backLink}>
            <Shield size={16} />
            <span>Admissions Portal</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
