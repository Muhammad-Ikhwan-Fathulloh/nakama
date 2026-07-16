import { AutomationsDialogs } from "@/pages/automations/automations-dialogs";
import { AutomationsPageLayout } from "@/pages/automations/automations-page-layout";
import { useAutomationsPage } from "@/pages/automations/use-automations-page";

export function AutomationsPage() {
  const state = useAutomationsPage();

  return (
    <>
      <AutomationsPageLayout {...state} />
      <AutomationsDialogs {...state} />
    </>
  );
}
