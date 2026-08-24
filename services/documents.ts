/**
 * Document requirements and uploads. Requirements are scoped to a specific
 * application (`GET /applications/{id}/requirements/`) and files are real
 * multipart uploads that come back with a server `file_url` and status.
 */

import { api } from "@/lib/api";
import { toDomainDocument, toDomainRequirement } from "@/lib/api/adapters";
import type {
  ApiApplicationDocument,
  ApiDocumentRequirement,
} from "@/lib/api/types";
import type { ApplicationDocument, DocumentRequirement } from "@/types/domain";

export interface RequirementsBundle {
  requirements: DocumentRequirement[];
  documents: ApplicationDocument[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Pull an ApplicationDocument off a requirement row, if one is nested there. */
function nestedDocument(row: Record<string, unknown>): ApiApplicationDocument | null {
  const doc = row.document ?? row.uploaded_document ?? row.application_document;
  return isRecord(doc) ? (doc as unknown as ApiApplicationDocument) : null;
}

function normalize(raw: unknown): {
  reqs: ApiDocumentRequirement[];
  docs: ApiApplicationDocument[];
} {
  if (Array.isArray(raw)) {
    const reqs: ApiDocumentRequirement[] = [];
    const docs: ApiApplicationDocument[] = [];
    for (const item of raw) {
      if (!isRecord(item)) continue;
      reqs.push(item as unknown as ApiDocumentRequirement);
      const doc = nestedDocument(item);
      if (doc) docs.push(doc);
    }
    return { reqs, docs };
  }
  if (isRecord(raw)) {
    const reqSrc =
      raw.requirements ?? raw.results ?? raw.document_requirements ?? raw.data ?? [];
    const docSrc = raw.documents ?? raw.uploaded_documents ?? [];
    const reqs = Array.isArray(reqSrc)
      ? (reqSrc as ApiDocumentRequirement[])
      : [];
    const docs = Array.isArray(docSrc)
      ? (docSrc as ApiApplicationDocument[])
      : [];
    if (docs.length === 0) {
      for (const item of reqs) {
        if (!isRecord(item)) continue;
        const doc = nestedDocument(item as Record<string, unknown>);
        if (doc) docs.push(doc);
      }
    }
    return { reqs, docs };
  }
  return { reqs: [], docs: [] };
}

/** GET /applications/{id}/requirements/ — the requirements + any uploads so far. */
export async function getRequirements(
  appId: number,
): Promise<RequirementsBundle> {
  try {
    const raw = await api.get<unknown>(`/applications/${appId}/requirements/`);
    const { reqs, docs } = normalize(raw);
    const domainReqs = reqs
      .slice()
      .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0))
      .map(toDomainRequirement);

    return {
      requirements: domainReqs,
      documents: docs.map(toDomainDocument),
    };
  } catch (err) {
    // The backend is the single source of truth for document requirements. If it
    // can't be reached we surface an empty checklist rather than inventing a
    // stale, hardcoded default set.
    console.error("Failed to load document requirements from the server:", err);
    return {
      requirements: [],
      documents: [],
    };
  }
}

/** POST /applications/{id}/documents/ — upload a file for a requirement. */
export async function uploadDocument(
  appId: number,
  requirementId: number,
  file: File,
): Promise<ApplicationDocument | null> {
  const form = new FormData();
  form.append("requirement", String(requirementId));
  form.append("file", file);
  const doc = await api.upload<ApiApplicationDocument | null>(
    `/applications/${appId}/documents/`,
    form,
  );
  // Some deployments answer the upload with 200 and no body. When that happens
  // we return null so the caller re-reads the authoritative document list.
  return doc && doc.id != null ? toDomainDocument(doc) : null;
}

/** POST /documents/{id}/reupload/ — replace the file on an existing document. */
export async function reuploadDocument(
  documentId: number,
  file: File,
): Promise<ApplicationDocument> {
  const form = new FormData();
  form.append("file", file);
  const doc = await api.upload<ApiApplicationDocument>(
    `/documents/${documentId}/reupload/`,
    form,
  );
  return toDomainDocument(doc);
}
