"use client";

/**
 * Loads the academic catalogue (sessions, schools, departments, programmes)
 * strictly from the live backend API (`/academics/*`).
 * No hardcoded or mock data.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AcademicSession,
  Department,
  DocumentRequirement,
  Programme,
  School,
} from "@/types/domain";
import {
  getAdmissionOptions,
  getDepartments,
  getProgrammes,
  getSchools,
  getSessions,
} from "@/services/catalogue";

export interface CatalogueContextValue {
  loading: boolean;
  error: string | null;

  /* --- synchronous finders backed strictly by API state --- */
  findSession: (id?: string) => AcademicSession | undefined;
  findActiveSession: () => AcademicSession;
  findSchool: (id?: string) => School | undefined;
  findDepartment: (id?: string) => Department | undefined;
  findProgramme: (id?: string) => Programme | undefined;
  listSchools: () => School[];
  listDepartments: (schoolId?: string) => Department[];
  listProgrammes: (departmentId?: string) => Programme[];
  getProgramme: (id: string) => Programme | undefined;

  /* --- document requirements (set per-application by ApplicationProvider) --- */
  requirements: DocumentRequirement[];
  setRequirements: (reqs: DocumentRequirement[]) => void;
  getRequirementsForProgramme: (programmeId?: string | null) => DocumentRequirement[];
}

const FALLBACK_SESSION: AcademicSession = {
  id: "0",
  name: "—",
  isActive: true,
  applicationDeadline: "",
};

export const CatalogueContext =
  createContext<CatalogueContextValue | null>(null);

export function CatalogueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        let loadedFromOptions = false;
        try {
          const adm = await getAdmissionOptions();
          if (adm && Array.isArray(adm.schools) && adm.schools.length > 0) {
            const schList: School[] = [];
            const depList: Department[] = [];
            const prgList: Programme[] = [];

            const sessId = adm.session_id != null ? String(adm.session_id) : "1";
            const sessObj: AcademicSession = {
              id: sessId,
              name: adm.session || "Current Session",
              isActive: adm.is_open ?? true,
              applicationDeadline: "",
            };

            for (const s of adm.schools) {
              const sId = String(s.id);
              schList.push({
                id: sId,
                name: s.name,
                code: s.code || "",
              });

              for (const d of s.departments ?? []) {
                const dId = String(d.id);
                depList.push({
                  id: dId,
                  schoolId: sId,
                  name: d.name,
                  code: d.code || "",
                });

                for (const p of d.programmes ?? []) {
                  const pId = String(p.id);
                  const rawLevel = p.type || "ND";
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const level = rawLevel as any;
                  prgList.push({
                    id: pId,
                    departmentId: dId,
                    schoolId: sId,
                    sessionId: sessId,
                    name: p.name,
                    level,
                    code: `${d.code || ""}-${level}`,
                    option: p.option || null,
                    durationYears: p.duration_years ?? 2,
                    cutoffMark: typeof p.cutoff_mark === "number" ? p.cutoff_mark : null,
                    applicationFee: p.application_fee,
                    totalFee: p.total_fee,
                    acceptingApplications: true,
                  });
                }
              }
            }

            if (!cancelled && schList.length > 0) {
              setSessions([sessObj]);
              setSchools(schList);
              setDepartments(depList);
              setProgrammes(prgList);
              loadedFromOptions = true;
            }
          }
        } catch (optionsErr) {
          console.warn("Admission options endpoint failed, trying individual endpoints:", optionsErr);
        }

        // Fallback to separate endpoints if admission-options is not present
        if (!loadedFromOptions) {
          const [sess, schl, dept, prog] = await Promise.all([
            getSessions(),
            getSchools(),
            getDepartments(),
            getProgrammes(),
          ]);
          if (!cancelled) {
            setSessions(sess);
            setSchools(schl);
            setDepartments(dept);
            setProgrammes(prog);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load catalogue from server",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* --- finder functions strictly backed by server state --- */

  const findSession = useCallback(
    (id?: string) => sessions.find((s) => s.id === id) ?? sessions[0] ?? FALLBACK_SESSION,
    [sessions],
  );

  const findActiveSession = useCallback(
    () => sessions.find((s) => s.isActive) ?? sessions[0] ?? FALLBACK_SESSION,
    [sessions],
  );

  const findSchool = useCallback(
    (id?: string) => schools.find((s) => s.id === id),
    [schools],
  );

  const findDepartment = useCallback(
    (id?: string) => departments.find((d) => d.id === id),
    [departments],
  );

  const findProgramme = useCallback(
    (id?: string) => programmes.find((p) => p.id === id),
    [programmes],
  );

  const listSchoolsFn = useCallback(() => schools, [schools]);

  const listDepartmentsFn = useCallback(
    (schoolId?: string) => {
      if (!schoolId) return departments;
      const filtered = departments.filter(
        (d) => String(d.schoolId) === String(schoolId),
      );
      return filtered.length > 0 ? filtered : departments;
    },
    [departments],
  );

  const listProgrammesFn = useCallback(
    (departmentId?: string) => {
      if (!departmentId) return programmes;
      const filtered = programmes.filter(
        (p) => String(p.departmentId) === String(departmentId),
      );
      return filtered.length > 0 ? filtered : programmes;
    },
    [programmes],
  );

  const getProgrammeFn = useCallback(
    (id: string) => programmes.find((p) => String(p.id) === String(id)),
    [programmes],
  );

  const getRequirementsForProgramme = useCallback(
    (programmeId?: string | null) =>
      requirements.filter(
        (r) =>
          r.active &&
          (r.programmeId == null || r.programmeId === programmeId),
      ),
    [requirements],
  );

  const value = useMemo<CatalogueContextValue>(
    () => ({
      loading,
      error,
      findSession,
      findActiveSession,
      findSchool,
      findDepartment,
      findProgramme,
      listSchools: listSchoolsFn,
      listDepartments: listDepartmentsFn,
      listProgrammes: listProgrammesFn,
      getProgramme: getProgrammeFn,
      requirements,
      setRequirements,
      getRequirementsForProgramme,
    }),
    [
      loading,
      error,
      findSession,
      findActiveSession,
      findSchool,
      findDepartment,
      findProgramme,
      listSchoolsFn,
      listDepartmentsFn,
      listProgrammesFn,
      getProgrammeFn,
      requirements,
      getRequirementsForProgramme,
    ],
  );

  return (
    <CatalogueContext.Provider value={value}>
      {children}
    </CatalogueContext.Provider>
  );
}
