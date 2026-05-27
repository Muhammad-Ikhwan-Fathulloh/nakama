import { useCallback, useEffect, useState } from "react";
import {
  getInitialSidebarCollapsed,
  SIDEBAR_COLLAPSED_KEY,
} from "@/lib/sidebar";

export function useSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(getInitialSidebarCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // Ignore storage failures (private browsing, etc.)
    }
  }, [collapsed]);

  const toggle = useCallback(() => {
    setCollapsedState((current) => !current);
  }, []);

  return { collapsed, toggle };
}
