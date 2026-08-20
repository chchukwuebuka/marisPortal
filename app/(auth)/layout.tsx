import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck, GraduationCap, UploadCloud } from "lucide-react";
import styles from "./auth.module.css";

const FEATURES = [
  { icon: GraduationCap, label: "Apply to ND & HND programmes" },
  { icon: UploadCloud, label: "Upload your documents once" },
  { icon: ClipboardCheck, label: "Track your admission in real time" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <aside className={styles.brandPanel}>
        <Link href="/" className={styles.brandTop}>
          <span className={styles.brandCrest}>
            <Image src="/image/logo.png" alt="Logo" width={40} height={40} />
          </span>
          <span>
            <span className={styles.brandName}>Marist Polytechnic</span>
            <br />
            <span className={styles.brandTag}>Admissions Portal</span>
          </span>
        </Link>

        <div className={styles.brandMid}>
          <h1 className={styles.brandHeadline}>
            Your place at Marist starts here.
          </h1>
          <p className={styles.brandLede}>
            Create an account to apply, submit your documents, and follow your
            application through to admission.
          </p>
          <ul className={styles.features}>
            {FEATURES.map(({ icon: Icon, label }) => (
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
          2026 / 2027 Admissions · Marist Polytechnic
        </p>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formInner}>
          <Link href="/" className={styles.mobileBrand}>
            <span className={styles.mobileCrest}>MP</span>
            <span className={styles.mobileBrandName}>Marist Polytechnic</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
