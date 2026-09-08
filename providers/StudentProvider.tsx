"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as studentService from "@/services/students";
import type {
  Student,
  StudentGuardian,
  StudentProfile,
  StudentStatusHistory,
} from "@/types/student";

export interface StudentContextValue {
  student: Student | null;
  profile: StudentProfile | null;
  guardians: StudentGuardian[];
  statusHistory: StudentStatusHistory[];
  loading: boolean;
  error: string | null;
  refreshStudent: () => Promise<void>;
  updateProfile: (data: Partial<StudentProfile>) => Promise<StudentProfile>;
  addGuardian: (
    data: Omit<StudentGuardian, "id" | "createdAt">,
  ) => Promise<StudentGuardian>;
  removeGuardian: (id: number) => Promise<void>;
}

const StudentContext = createContext<StudentContextValue | null>(null);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [guardians, setGuardians] = useState<StudentGuardian[]>([]);
  const [statusHistory, setStatusHistory] = useState<StudentStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studentData = await studentService.getMyStudent();
      setStudent(studentData);
      setProfile(studentData.profile || null);
      setGuardians(studentData.guardians || []);

      // Load status history
      try {
        const history = await studentService.getMyStatusHistory();
        setStatusHistory(history);
      } catch {
        // Status history can fail softly
      }
    } catch (err: unknown) {
      const isForbidden =
        (err as { status?: number })?.status === 403 ||
        (err instanceof Error &&
          (err.message.toLowerCase().includes("only students") ||
            err.message.toLowerCase().includes("forbidden") ||
            err.message.toLowerCase().includes("403")));

      const message = isForbidden
        ? "Only registered students may access the Student Management Portal. If you have been offered admission, please ensure you have accepted your offer and paid fees."
        : err instanceof Error
        ? err.message
        : "Unable to load student record. Please verify your admission acceptance.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateProfile = useCallback(
    async (payload: Partial<StudentProfile>) => {
      const updated = await studentService.updateMyProfile(payload);
      setProfile(updated);
      setStudent((prev) =>
        prev ? { ...prev, profile: { ...(prev.profile || {}), ...updated } } : null,
      );
      return updated;
    },
    [],
  );

  const addGuardian = useCallback(
    async (payload: Omit<StudentGuardian, "id" | "createdAt">) => {
      const created = await studentService.addGuardian(payload);
      setGuardians((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  const removeGuardian = useCallback(async (id: number) => {
    await studentService.deleteGuardian(id);
    setGuardians((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const value: StudentContextValue = {
    student,
    profile,
    guardians,
    statusHistory,
    loading,
    error,
    refreshStudent: loadData,
    updateProfile,
    addGuardian,
    removeGuardian,
  };

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
}

export function useStudent(): StudentContextValue {
  const ctx = useContext(StudentContext);
  if (!ctx) {
    throw new Error("useStudent must be used within a <StudentProvider>");
  }
  return ctx;
}
