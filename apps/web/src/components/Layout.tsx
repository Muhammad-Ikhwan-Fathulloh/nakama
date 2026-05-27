import { Outlet, useLocation } from "react-router-dom";
import { ConnectionBar } from "@/components/ConnectionBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAppContext } from "@/context/app-context";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { usePrefetchAppData } from "@/hooks/use-app-queries";
import { NAV_ITEMS, pageIdFromPath, SETTINGS_NAV_ITEM } from "@/lib/navigation";

export function Layout() {
  const location = useLocation();
  const { navigateToPage } = useAppNavigation();
  const page = pageIdFromPath(location.pathname) ?? "chat";
  const { error } = useAppContext();
  const prefetchAppData = usePrefetchAppData();
  const activeNav =
    page === "settings"
      ? SETTINGS_NAV_ITEM
      : NAV_ITEMS.find((item) => item.id === page);

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar">
        <div className="border-b border-border px-5 py-5.5">
          <div className="flex items-center gap-3">
            <img
              src="/tinyclaw.png"
              alt="TinyClaw"
              className="size-9 shrink-0 rounded-lg object-contain"
            />
            <div>
              <p className="type-brand">TinyClaw</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map((item) => {
            const active = item.id === page;

            return (
              <button
                key={item.id}
                type="button"
                title={item.description}
                aria-current={active ? "page" : undefined}
                onClick={() => navigateToPage(item.id)}
                onMouseEnter={item.id === "automations" ? prefetchAppData : undefined}
                onFocus={item.id === "automations" ? prefetchAppData : undefined}
                data-active={active || undefined}
                className="sidebar-nav-link"
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border p-3">
          <button
            type="button"
            title={SETTINGS_NAV_ITEM.description}
            aria-current={page === "settings" ? "page" : undefined}
            onClick={() => navigateToPage("settings")}
            onMouseEnter={prefetchAppData}
            onFocus={prefetchAppData}
            data-active={page === "settings" || undefined}
            className="sidebar-nav-link !w-auto shrink-0"
          >
            {SETTINGS_NAV_ITEM.label}
          </button>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {page !== "chat" && page !== "status" ? (
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
            <div className="space-y-0.5">
              <h1 className="type-page-title">{activeNav?.label}</h1>
              <p className="type-body max-w-xl">{activeNav?.description}</p>
            </div>

            <ConnectionBar />
          </header>
        ) : null}

        {error ? (
          <div className="shrink-0 border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <main
          className={
            page === "chat"
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto p-6"
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

