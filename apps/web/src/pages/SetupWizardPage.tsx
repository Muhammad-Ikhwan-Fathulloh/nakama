import { Navigate } from "react-router-dom";
import { SetupWizard } from "@/components/setup-wizard/SetupWizard";
import { SetupLayout } from "@/components/SetupLayout";
import { useAppContext } from "@/context/app-context";
import { pathForPage } from "@/lib/navigation";

export function SetupWizardPage() {
  const { health } = useAppContext();

  if (health?.providerConfigured === true) {
    return <Navigate to={pathForPage("chat")} replace />;
  }

  return (
    <SetupLayout>
      <SetupWizard />
    </SetupLayout>
  );
}
