import { AuthGuard } from "@/components/auth/AuthGuard";
import { StudentAppShell } from "@/components/layout";
import { StudentProvider } from "@/providers/StudentProvider";

export const metadata = {
  title: "Student Portal - Marist Polytechnic",
  description: "Marist Polytechnic Student Management System",
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <StudentProvider>
        <StudentAppShell>{children}</StudentAppShell>
      </StudentProvider>
    </AuthGuard>
  );
}
