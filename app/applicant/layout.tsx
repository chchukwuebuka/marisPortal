import { ApplicationProvider } from "@/providers/ApplicationProvider";
import { CatalogueProvider } from "@/providers/CatalogueProvider";
import { AppShell } from "@/components/layout";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <CatalogueProvider>
        <ApplicationProvider>
          <AppShell>{children}</AppShell>
        </ApplicationProvider>
      </CatalogueProvider>
    </AuthGuard>
  );
}
