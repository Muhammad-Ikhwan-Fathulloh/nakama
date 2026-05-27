export const SIDEBAR_COLLAPSED_KEY = "tinyclaw-sidebar-collapsed";

export function getInitialSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}
