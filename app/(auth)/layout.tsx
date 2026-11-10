import Image from "next/image";
import Link from "next/link";
import { AuthBrandPanel } from "./AuthBrandPanel";
import styles from "./auth.module.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <AuthBrandPanel />

      <main className={styles.formPanel}>
        <div className={styles.formInner}>
          <Link href="/" className={styles.mobileBrand}>
            <Image
              src="/image/logo.png"
              alt=""
              width={40}
              height={40}
              className={styles.mobileCrest}
            />
            <span className={styles.mobileBrandName}>Marist Polytechnic</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
