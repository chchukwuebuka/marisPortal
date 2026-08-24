/**
 * Payments service — wired to the real payment API endpoints.
 *
 * The flow is:
 *  1. `POST /applications/{id}/invoice/` — create (or re-fetch) the invoice
 *  2. `POST /payments/initialize/` — get a Paystack payment URL
 *  3. Redirect user to Paystack
 *  4. On callback: `GET /payments/verify/{reference}/` — verify payment
 *
 * The webhook (`/payments/webhook/paystack/`) is handled server-side.
 */

import { api } from "@/lib/api";
import type { Invoice, Payment } from "@/types/domain";

/** Shape returned by POST /applications/{id}/invoice/ */
interface ApiInvoice {
  id: number;
  application: number;
  application_number?: string | null;
  amount: string; // decimal string
  status: string;
  created_at: string;
  paid_at?: string | null;
  items?: { label: string; amount: string }[];
}

/** Shape returned by POST /payments/initialize/ */
interface ApiPaymentInit {
  authorization_url: string;
  access_code: string;
  reference: string;
}

/** Shape returned by GET /payments/verify/{reference}/ */
interface ApiPaymentVerify {
  id: number;
  reference: string;
  amount: string;
  status: string;
  channel?: string;
  paid_at?: string | null;
  invoice?: number;
}

function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** Create or retrieve the application's invoice. */
export async function createInvoice(applicationId: number | string): Promise<Invoice> {
  const raw = await api.post<ApiInvoice>(`/applications/${applicationId}/invoice/`);
  return {
    id: String(raw.id),
    applicationId: String(raw.application),
    applicationNumber: raw.application_number ?? null,
    items: (raw.items ?? []).map((i) => ({
      label: i.label,
      amount: toNum(i.amount),
    })),
    total: toNum(raw.amount),
    status: raw.status === "paid" ? "paid" : "unpaid",
    createdAt: raw.created_at,
    paidAt: raw.paid_at ?? undefined,
  };
}

/** Retrieve an existing invoice without creating one. */
export async function getInvoice(applicationId: number | string): Promise<Invoice | null> {
  try {
    const raw = await api.get<ApiInvoice>(`/applications/${applicationId}/invoice/`);
    return {
      id: String(raw.id),
      applicationId: String(raw.application),
      applicationNumber: raw.application_number ?? null,
      items: (raw.items ?? []).map((i) => ({
        label: i.label,
        amount: toNum(i.amount),
      })),
      total: toNum(raw.amount),
      status: raw.status === "paid" ? "paid" : "unpaid",
      createdAt: raw.created_at,
      paidAt: raw.paid_at ?? undefined,
    };
  } catch {
    return null;
  }
}

/** Initialize a Paystack payment — returns the URL to redirect the user to. */
export async function initializePayment(
  applicationId: number | string,
): Promise<{ authorizationUrl: string; reference: string }> {
  const raw = await api.post<ApiPaymentInit>("/payments/initialize/", {
    application: Number(applicationId),
  });
  return {
    authorizationUrl: raw.authorization_url,
    reference: raw.reference,
  };
}

/** Verify a payment by its reference (after Paystack callback). */
export async function verifyPayment(reference: string): Promise<Payment> {
  const raw = await api.get<ApiPaymentVerify>(`/payments/verify/${reference}/`);
  return {
    id: String(raw.id),
    invoiceId: raw.invoice != null ? String(raw.invoice) : "",
    reference: raw.reference,
    amount: toNum(raw.amount),
    status: raw.status === "success" || raw.status === "successful" ? "successful" : "pending",
    channel: raw.channel,
    paidAt: raw.paid_at ?? undefined,
  };
}
