import type { Invoice, Payment } from "@/types/domain";
import { buildInvoiceItems, delay, uid } from "./mock/data";

/** Create the application-fee invoice (§14). */
export async function createInvoice(
  applicationId: string,
  applicationNumber?: string | null,
): Promise<Invoice> {
  await delay();
  const items = buildInvoiceItems();
  return {
    id: uid("inv"),
    applicationId,
    applicationNumber: applicationNumber ?? null,
    items,
    total: items.reduce((sum, i) => sum + i.amount, 0),
    status: "unpaid",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Simulate the full payment round-trip (§15): initialize → gateway → webhook
 * verification. In production this is NEVER trusted from the frontend redirect;
 * the backend verifies via the gateway webhook. Here we mock a verified success.
 */
export async function payInvoice(invoice: Invoice): Promise<Payment> {
  await delay(1100); // gateway + verification round-trip
  return {
    id: uid("pay"),
    invoiceId: invoice.id,
    reference: uid("REF").toUpperCase(),
    amount: invoice.total,
    status: "successful",
    channel: "Card",
    paidAt: new Date().toISOString(),
  };
}
