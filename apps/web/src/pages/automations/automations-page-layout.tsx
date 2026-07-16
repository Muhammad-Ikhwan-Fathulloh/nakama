import { MessageSquareIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatFutureRelativeTime, formatSessionRelativeTime } from "@/lib/chat-history";
import { cn } from "@/lib/utils";
import {
  AutomationDetailActions,
  AutomationDetailSkeleton,
  AutomationListItem,
  AutomationListSkeleton,
  AutomationPanelPlaceholder,
  AutomationSearch,
  AutomationStateBadge,
  AutomationsEmptyState,
  ListSkeleton,
  MetaStat,
  RunHistoryList,
  SoftPill,
} from "@/pages/automations/automations-components";
import {
  automationsShellMinHeight,
  runHistoryScrollClass,
  sectionClass,
} from "@/pages/automations/automations-page.shared";
import type { AutomationsPageState } from "@/pages/automations/use-automations-page";

export function AutomationsPageLayout(state: AutomationsPageState) {
  const {
    automations,
    unreadByAutomationId,
    selectedId,
    setSelectedId,
    runs,
    runsLoading,
    busy,
    searchQuery,
    setSearchQuery,
    runningId,
    error,
    setDeleteTarget,
    setDeleteRunTarget,
    isSearching,
    loading,
    refreshing,
    initialLoading,
    automationsRefreshing,
    selected,
    filteredAutomations,
    selectedRunSummary,
    selectedSubtitle,
    handleRun,
    openEdit,
    refresh,
    goToCreateAutomation,
    refetchRuns,
  } = state;

  return (
    <div className="flex min-h-full flex-col gap-4">
      {error ? (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <section
        className={cn(
          sectionClass,
          automationsShellMinHeight,
          "flex flex-col overflow-hidden",
        )}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4 lg:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedId ?? undefined}
              disabled={busy || refreshing || automations.length === 0}
              onValueChange={(value) => {
                if (value) {
                  setSelectedId(String(value));
                }
              }}
            >
              <SelectTrigger className="min-w-0 flex-1" aria-label="Selected automation">
                <SelectValue placeholder="Select automation" />
              </SelectTrigger>
              <SelectContent>
                {filteredAutomations.map((automation) => (
                  <SelectItem key={automation.id} value={automation.id}>
                    {automation.name}
                    {(unreadByAutomationId[automation.id] ?? 0) > 0
                      ? ` (${unreadByAutomationId[automation.id]})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={busy || refreshing}
                aria-label="Refresh automations"
                onClick={() => void refresh()}
              >
                {refreshing ? (
                  <Spinner className="size-4" />
                ) : (
                  <RefreshCwIcon className="size-4" aria-hidden />
                )}
              </Button>
              <Button type="button" size="sm" onClick={goToCreateAutomation}>
                <MessageSquareIcon className="size-4" aria-hidden />
                Create automation
              </Button>
            </div>
          </div>

          <AutomationSearch
            value={searchQuery}
            disabled={initialLoading || automations.length === 0 || busy}
            isSearching={isSearching}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery("")}
          />
        </div>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden min-h-0 min-w-0 flex-col border-b border-border lg:flex lg:border-r lg:border-b-0">
            <div className="shrink-0 space-y-3 border-b border-border px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {filteredAutomations.length} shown
                  {filteredAutomations.length !== automations.length
                    ? ` of ${automations.length}`
                    : ""}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy || automationsRefreshing}
                  aria-label="Refresh automations"
                  onClick={() => void refresh()}
                >
                  {automationsRefreshing ? (
                    <Spinner className="size-3.5" />
                  ) : (
                    <RefreshCwIcon className="size-3.5" aria-hidden />
                  )}
                </Button>
              </div>

              <AutomationSearch
                value={searchQuery}
                disabled={initialLoading || automations.length === 0 || busy}
                isSearching={isSearching}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery("")}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {initialLoading ? (
                <AutomationListSkeleton />
              ) : automations.length === 0 ? (
                <div className="flex min-h-[12rem] items-center justify-center">
                  <AutomationsEmptyState />
                </div>
              ) : filteredAutomations.length === 0 ? (
                <div className="flex min-h-[12rem] flex-col items-center justify-center px-2 py-10 text-center">
                  <SearchIcon className="size-5 text-muted-foreground" aria-hidden />
                  <p className="mt-3 text-sm font-medium text-foreground">No matching automations</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try a different search term.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border border-b border-border">
                  {filteredAutomations.map((automation) => (
                    <li key={automation.id}>
                      <AutomationListItem
                        automation={automation}
                        selected={selectedId === automation.id}
                        unreadCount={unreadByAutomationId[automation.id] ?? 0}
                        busy={busy}
                        onSelect={() => setSelectedId(automation.id)}
                        onDelete={setDeleteTarget}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-5">
            {loading ? (
              <AutomationDetailSkeleton />
            ) : automations.length === 0 ? (
              <AutomationPanelPlaceholder>
                <AutomationsEmptyState />
                <Button type="button" size="sm" onClick={goToCreateAutomation}>
                  Create automation
                </Button>
              </AutomationPanelPlaceholder>
            ) : !selected ? (
              <AutomationPanelPlaceholder>
                Select an automation to view runs.
              </AutomationPanelPlaceholder>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-5 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-h-[4.75rem] min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="type-section-title">{selected.name}</h2>
                      <AutomationStateBadge enabled={selected.enabled} />
                    </div>
                    <p
                      className={cn(
                        "type-body mt-1 line-clamp-2 min-h-[2.5rem] text-sm",
                        selected.description ? "text-foreground" : "text-transparent",
                      )}
                    >
                      {selected.description || "No description"}
                    </p>
                    <p className="type-body mt-1 text-xs">{selectedSubtitle}</p>
                  </div>

                  <AutomationDetailActions
                    automation={selected}
                    busy={busy}
                    runningId={runningId}
                    onRun={handleRun}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    className="hidden lg:flex"
                  />
                </div>

                <AutomationDetailActions
                  automation={selected}
                  busy={busy}
                  runningId={runningId}
                  onRun={handleRun}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  className="mb-5 lg:hidden"
                />

                <div className="mb-5 grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetaStat
                    label="Trigger"
                    value={selected.trigger.type === "manual" ? "Manual" : "Scheduled"}
                    tone="default"
                  />
                  <MetaStat
                    label="Next run"
                    value={selected.nextRunAt ? formatFutureRelativeTime(selected.nextRunAt) : "Not scheduled"}
                    tone="default"
                  />
                  <MetaStat
                    label="Last run"
                    value={selected.lastRunAt ? formatSessionRelativeTime(selected.lastRunAt) : "No runs yet"}
                    tone="default"
                  />
                  <MetaStat
                    label="Unread runs"
                    value={String(selectedRunSummary.unread)}
                    tone={selectedRunSummary.unread > 0 ? "attention" : "default"}
                  />
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
                  <SoftPill label={`${runs.length} total`} />
                  <SoftPill label={`${selectedRunSummary.completed} success`} tone="success" />
                  <SoftPill label={`${selectedRunSummary.failed} failed`} tone="danger" />
                  {selectedRunSummary.running > 0 ? (
                    <SoftPill label={`${selectedRunSummary.running} running`} tone="default" />
                  ) : null}
                </div>

                <div className="flex min-h-0 flex-1 flex-col border-t border-border pt-5">
                  <div className="mb-4 flex h-10 shrink-0 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="type-section-title">Run history</h3>
                      <p className="type-body mt-1 min-h-[1rem] text-xs">
                        {runsLoading
                          ? "Loading runs…"
                          : runs.length === 0
                            ? "No runs yet"
                            : `${runs.length} run${runs.length === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      disabled={runsLoading || busy}
                      aria-label="Refresh run history"
                      onClick={() => void refetchRuns()}
                    >
                      {runsLoading ? (
                        <Spinner className="size-4" />
                      ) : (
                        <RefreshCwIcon className="size-4" aria-hidden />
                      )}
                    </Button>
                  </div>

                  <div className={runHistoryScrollClass}>
                    {runsLoading ? (
                      <ListSkeleton rows={3} />
                    ) : runs.length === 0 ? (
                      <div className="flex min-h-[10rem] items-center justify-center">
                        <p className="type-body text-xs text-muted-foreground">No runs yet.</p>
                      </div>
                    ) : (
                      <RunHistoryList
                        runs={runs}
                        busy={busy}
                        onDeleteRun={setDeleteRunTarget}
                      />
                    )}
                  </div>
                </div>

                <div className="type-body mt-5 shrink-0 rounded-md border border-border bg-muted/40 p-3 text-xs lg:hidden dark:bg-muted/30">
                  <p className="font-medium text-foreground">How it works</p>
                  <p className="mt-2">
                    Run now triggers a manual execution. Scheduled automations run automatically
                    when enabled.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
