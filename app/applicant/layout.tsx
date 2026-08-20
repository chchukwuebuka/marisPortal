import { ApplicationProvider } from "@/providers/ApplicationProvider";
import { AppShell } from "@/components/layout";

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ApplicationProvider>
      <AppShell>{children}</AppShell>
    </ApplicationProvider>
  );
}
