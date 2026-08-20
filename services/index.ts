/**
 * Single import surface for data access. Today these are mock implementations;
 * swapping to the real Django API means changing only the files behind here.
 */

export * from "./catalogue";
export * from "./documents";
export * from "./payments";

export {
  MOCK_APPLICANT,
  FEE_CONFIG,
  buildInvoiceItems,
  invoiceTotal,
  createInitialApplication,
  buildDocumentSlots,
  generateApplicationNumber,
  generateVerificationCode,
  uid,
} from "./mock/data";
