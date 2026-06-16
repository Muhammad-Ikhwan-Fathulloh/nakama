import { Navigate } from "react-router-dom";
import { useMemo } from "react";
import { SetupWizard } from "@/components/setup-wizard/SetupWizard";
import { SetupLayout } from "@/components/SetupLayout";
import { useAppContext } from "@/context/app-context";
import { pathForPage } from "@/lib/navigation";

export function SetupWizardPage() {
  const { health } = useAppContext();

  const setupCompleted = useMemo(() => {
    return localStorage.getItem("tinyclaw:setup-completed") === "true";
  }, []);

  // Only redirect if setup was fully completed (all wizard steps done).
  // Don't redirect while the wizard is in progress — the user needs to
  // finish all steps (Provider → About You → Telegram → WhatsApp).
  if (health?.providerConfigured === true && setupCompleted) {
    return <Navigate to={pathForPage("chat")} replace />;
  }

  return (
    <SetupLayout>
      <SetupWizard />
    </SetupLayout>
  );
}
