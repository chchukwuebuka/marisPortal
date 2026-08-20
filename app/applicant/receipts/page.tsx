"use client";

import { Printer } from "lucide-react";
import { useApplication } from "@/hooks/useApplication";
import { PageHeader } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  CardBody,
  LoadingBlock,
} from "@/components/ui";
import { formatDateTime, formatNaira } from "@/lib/format";
import { buildInvoiceItems, findProgramme } from "@/services";
import styles from "./receipts.module.css";

export default function ReceiptsPage() {
  const { applicant, application, payment, paid, hydrated } = useApplication();

  if (!hydrated) {
    return <LoadingBlock label="Loading your receipt…" />;
  }

  if (!paid || !payment) {
    return (
      <>
        <PageHeader eyebrow="Payments" title="Receipt" />
        <Card>
          <CardBody className={styles.empty}>
            <p className={styles.emptyTitle}>No receipt available yet</p>
            <p className={styles.emptyText}>
              Once you pay your application fee, your official receipt will
              appear here.
            </p>
            <Button href="/applicant/payments" variant="secondary">
              Pay application fee
            </Button>
          </CardBody>
        </Card>
      </>
    );
  }

  const items = buildInvoiceItems();
  const programme = findProgramme(application.programme?.programmeId);
  const fullName = `${applicant.firstName} ${applicant.lastName}`;

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="Receipt"
        actions={
          <Button
            variant="outline"
            leftIcon={<Printer size={16} />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        }
      />

      <div className={styles.sheet} id="receipt">
        <div className={styles.head}>
          <div className={styles.brand}>
            <span className={styles.crest}>MP</span>
            <div>
              <p className={styles.org}>Marist Polytechnic</p>
              <p className={styles.docType}>Official Payment Receipt</p>
            </div>
          </div>
          <Badge tone="success" className={styles.paidBadge}>
            PAID
          </Badge>
        </div>

        <dl className={styles.meta}>
          <div className={styles.metaRow}>
            <dt>Applicant</dt>
            <dd>{fullName}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Email</dt>
            <dd>{applicant.email}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Application no.</dt>
            <dd className={styles.mono}>
              {application.applicationNumber ?? "Pending submission"}
            </dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Programme</dt>
            <dd>{programme ? `${programme.level} ${programme.name}` : "—"}</dd>
          </div>
        </dl>

        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.label} className={styles.item}>
              <span>{item.label}</span>
              <span className={styles.mono}>{formatNaira(item.amount)}</span>
            </li>
          ))}
          <li className={styles.total}>
            <span>Total paid</span>
            <span className={styles.mono}>{formatNaira(payment.amount)}</span>
          </li>
        </ul>

        <dl className={styles.payMeta}>
          <div className={styles.metaRow}>
            <dt>Payment reference</dt>
            <dd className={styles.mono}>{payment.reference}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Channel</dt>
            <dd>{payment.channel ?? "—"}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Date paid</dt>
            <dd>{payment.paidAt ? formatDateTime(payment.paidAt) : "—"}</dd>
          </div>
        </dl>

        <p className={styles.footer}>
          This is a system-generated receipt and does not require a signature.
        </p>
      </div>
    </>
  );
}
