"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  // CreditCard,  // payment feature disabled for now
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  // ReceiptText,  // payment feature disabled for now
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./Sidebar.module.css";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  exact?: boolean;
}

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/applicant/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { label: "Application", href: "/applicant/application", icon: FileText },
  // Payment feature disabled for now:
  // { label: "Payments", href: "/applicant/payments", icon: CreditCard },
  // { label: "Receipts", href: "/applicant/receipts", icon: ReceiptText },
  { label: "Status", href: "/applicant/status", icon: ListChecks },
  { label: "Admission", href: "/applicant/admission", icon: GraduationCap },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(styles.backdrop, open && styles.backdropOpen)}
        onClick={onClose}
        aria-hidden
      />
      <aside className={cn(styles.sidebar, open && styles.sidebarOpen)}>
        <div className={styles.brand}>
          <Link href="/applicant/dashboard" className={styles.brandLink}>
            <Image
              src="/image/logo.png"
              alt="Logo"
              width={38}
              height={38}
              className={styles.crestImg}
            />
            <span className={styles.brandText}>
              <span className={styles.brandName}>Marist Polytechnic</span>
              <span className={styles.brandTag}>Admissions Portal</span>
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

        <nav className={styles.nav} aria-label="Primary">
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
          <p className={styles.footerTitle}>Need help?</p>
          <p className={styles.footerText}>
            Contact admissions@marist.edu.ng for support with your application.
          </p>
        </div>
      </aside>
    </>
  );
}
