import type {
  AcademicSession,
  Department,
  Programme,
  School,
} from "@/types/domain";
import {
  DEPARTMENTS,
  PROGRAMMES,
  SCHOOLS,
  SESSIONS,
  delay,
} from "./mock/data";

/* Async accessors (mock API — swap these for real fetch calls later). */

export async function getSessions(): Promise<AcademicSession[]> {
  await delay();
  return SESSIONS;
}

export async function getSchools(): Promise<School[]> {
  await delay();
  return SCHOOLS;
}

export async function getDepartments(schoolId: string): Promise<Department[]> {
  await delay();
  return DEPARTMENTS.filter((d) => d.schoolId === schoolId);
}

export async function getProgrammes(departmentId: string): Promise<Programme[]> {
  await delay();
  return PROGRAMMES.filter((p) => p.departmentId === departmentId);
}

export async function getProgramme(id: string): Promise<Programme | undefined> {
  await delay(150);
  return PROGRAMMES.find((p) => p.id === id);
}

/* Synchronous finders for read-only name resolution (review, summaries). */

export const findSession = (id?: string): AcademicSession | undefined =>
  SESSIONS.find((s) => s.id === id);
export const findActiveSession = (): AcademicSession =>
  SESSIONS.find((s) => s.isActive) ?? SESSIONS[0];
export const findSchool = (id?: string): School | undefined =>
  SCHOOLS.find((s) => s.id === id);
export const findDepartment = (id?: string): Department | undefined =>
  DEPARTMENTS.find((d) => d.id === id);
export const findProgramme = (id?: string): Programme | undefined =>
  PROGRAMMES.find((p) => p.id === id);

/* Synchronous lists for cascading selects (instant, no simulated latency). */

export const listSchools = (): School[] => SCHOOLS;
export const listDepartments = (schoolId?: string): Department[] =>
  DEPARTMENTS.filter((d) => d.schoolId === schoolId);
export const listProgrammes = (departmentId?: string): Programme[] =>
  PROGRAMMES.filter((p) => p.departmentId === departmentId);
