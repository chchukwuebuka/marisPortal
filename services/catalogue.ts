/**
 * Academic catalogue reads against the live API (`/academics/*`).
 *
 * Supports both:
 *  1. `getAdmissionOptions()`: fetches the full hierarchical School -> Department -> Programme tree in one call.
 *  2. Individual endpoints: `getSessions()`, `getSchools()`, `getDepartments()`, `getProgrammes()`.
 */

import { api } from "@/lib/api";
import {
  toDomainDepartment,
  toDomainProgramme,
  toDomainSchool,
  toDomainSession,
} from "@/lib/api/adapters";
import type {
  AcademicSession,
  Department,
  Programme,
  School,
} from "@/types/domain";

export interface ApiProgramme {
  id: number;
  offering_id?: number;
  name: string;
  type?: string; // 'ND' | 'HND' | 'BSC' | 'BENG'
  option?: string | null; // e.g. "Cybersecurity Option"
  duration_years?: number;
  cutoff_mark?: number | null;
  application_fee?: string;
  processing_fee?: string;
  total_fee?: string;
}

export interface ApiDepartment {
  id: number;
  name: string;
  code?: string;
  programmes?: ApiProgramme[];
}

export interface ApiSchool {
  id: number;
  name: string;
  code?: string;
  departments?: ApiDepartment[];
}

export interface AdmissionOptionsResponse {
  session?: string;
  session_id?: number;
  is_open?: boolean;
  schools: ApiSchool[];
}

/**
 * Fetch the hierarchical School -> Department -> Programme tree
 */
export async function getAdmissionOptions(
  session?: string,
): Promise<AdmissionOptionsResponse> {
  const data = await api.get<AdmissionOptionsResponse>(
    "/academics/admission-options/",
    {
      query: session ? { session } : undefined,
    },
  );
  return data;
}

function extractList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["results", "data", "schools", "departments", "programmes", "sessions", "items"]) {
      if (Array.isArray(o[key])) return o[key] as T[];
    }
  }
  return [];
}

export async function getSessions(): Promise<AcademicSession[]> {
  try {
    const raw = await api.get<unknown>("/academics/sessions/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractList<any>(raw).map(toDomainSession);
  } catch (err) {
    console.error("Failed to fetch sessions:", err);
    return [];
  }
}

export async function getSchools(): Promise<School[]> {
  try {
    const raw = await api.get<unknown>("/academics/schools/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractList<any>(raw).map(toDomainSchool);
  } catch (err) {
    console.error("Failed to fetch schools:", err);
    return [];
  }
}

/** All departments, or just those in one school when `schoolId` is given. */
export async function getDepartments(schoolId?: string): Promise<Department[]> {
  try {
    const raw = await api.get<unknown>("/academics/departments/", {
      query: schoolId ? { school: schoolId } : undefined,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractList<any>(raw).map(toDomainDepartment);
  } catch (err) {
    console.error("Failed to fetch departments:", err);
    return [];
  }
}

/** All programmes, or just those in one department when `departmentId` is given. */
export async function getProgrammes(
  departmentId?: string,
): Promise<Programme[]> {
  try {
    const raw = await api.get<unknown>("/academics/programmes/", {
      query: departmentId ? { department: departmentId } : undefined,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractList<any>(raw).map(toDomainProgramme);
  } catch (err) {
    console.error("Failed to fetch programmes:", err);
    return [];
  }
}
