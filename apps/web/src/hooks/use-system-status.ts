import type { DiscordWorkerStatus, SystemStatusResponse } from "@nakama/core/contract";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { queryKeys } from "@/lib/query-keys";

const REFRESH_INTERVAL_MS = 10_000;

const DEFAULT_DISCORD_WORKER_STATUS: DiscordWorkerStatus = {
  ok: true,
  configured: false,
  paired: false,
  running: false,
  connected: false,
};

function normalizeSystemStatus(status: SystemStatusResponse): SystemStatusResponse {
  return {
    ...status,
    discordWorker: status.discordWorker ?? DEFAULT_DISCORD_WORKER_STATUS,
  };
}

export const systemStatusQueryOptions = queryOptions({
  queryKey: queryKeys.systemStatus,
  queryFn: async () => normalizeSystemStatus(await client.getSystemStatus()),
  refetchInterval: REFRESH_INTERVAL_MS,
  refetchIntervalInBackground: true,
});

export function useSystemStatusQuery() {
  return useQuery(systemStatusQueryOptions);
}

export function useRefreshSystemStatus() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: queryKeys.systemStatus });
}
