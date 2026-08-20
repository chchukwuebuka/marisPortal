"use client";

import { useState } from "react";
import { CheckCircle2, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { PageHeader } from "@/components/layout";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  LoadingBlock,
} from "@/components/ui";
import { formatDateTime, formatNaira } from "@/lib/format";
import { buildInvoiceItems, createInvoice, payInvoice } from "@/services";
import styles from "./payments.module.css";

export default function PaymentsPage() {
  const { application, payment, paid, setPayment, hydrated } = useApplication();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) {
    return <LoadingBlock label="Loading payment details…" />;
  }

  const items = buildInvoiceItems();
  const total = items.reduce((sum, i) => sum + i.amount, 0);

  async function handlePay() {
    setError(null);
    setProcessing(true);
    try {
      const invoice = await createInvoice(
        application.id,
        application.applicationNumber,
      );
      const result = await payInvoice(invoice);
      setPayment(result);
    } catch {
      setError("We couldn't complete your payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (paid && payment) {
    return (
      <>
        <PageHeader eyebrow="Application Fee" title="Payment" />
        <div className={styles.center}>
          <Card>
            <CardBody className={styles.paidCard}>
              <span className={styles.paidIcon}>
                <CheckCircle2 size={30} />
              </span>
              <h2 className={styles.paidTitle}>Payment successful</h2>
              <p className={styles.paidText}>
                Your application fee has been received and verified. You can now
                submit your application for review.
              </p>

              <dl className={styles.receipt}>
                <div className={styles.receiptRow}>
                  <dt>Reference</dt>
                  <dd className={styles.mono}>{payment.reference}</dd>
                </div>
                <div className={styles.receiptRow}>
                  <dt>Amount paid</dt>
                  <dd className={styles.mono}>{formatNaira(payment.amount)}</dd>
                </div>
                <div className={styles.receiptRow}>
                  <dt>Channel</dt>
                  <dd>{payment.channel ?? "—"}</dd>
                </div>
                <div className={styles.receiptRow}>
                  <dt>Date</dt>
                  <dd>
                    {payment.paidAt ? formatDateTime(payment.paidAt) : "—"}
                  </dd>
                </div>
              </dl>

              <div className={styles.paidActions}>
                <Button href="/applicant/receipts">View receipt</Button>
                <Button href="/applicant/dashboard" variant="outline">
                  Back to dashboard
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Application Fee"
        title="Payment"
        description="Pay the non-refundable application fee to unlock submission of your application."
      />
      <div className={styles.center}>
        <Card>
          <CardHeader
            title="Application fee invoice"
            subtitle="Marist Polytechnic — 2026/2027 admissions"
            icon={<CreditCard size={18} />}
          />
          <CardBody>
            <ul className={styles.items}>
              {items.map((item) => (
                <li key={item.label} className={styles.item}>
                  <span>{item.label}</span>
                  <span className={styles.mono}>{formatNaira(item.amount)}</span>
                </li>
              ))}
              <li className={styles.total}>
                <span>Total</span>
                <span className={styles.mono}>{formatNaira(total)}</span>
              </li>
            </ul>

            <div className={styles.secureNote}>
              <ShieldCheck size={16} />
              <span>
                Payment is processed by a secure gateway and verified on our
                server before your account is credited. This is a simulated
                gateway for this demo — no real charge is made.
              </span>
            </div>

            {error && (
              <div className={styles.error}>
                <Alert tone="error">{error}</Alert>
              </div>
            )}

            <Button
              onClick={handlePay}
              loading={processing}
              fullWidth
              leftIcon={<Lock size={16} />}
            >
              {processing
                ? "Contacting payment gateway…"
                : `Pay ${formatNaira(total)}`}
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
