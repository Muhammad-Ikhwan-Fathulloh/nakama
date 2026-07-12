import { PlugIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import {
  useComposioSettings,
  useComposioToolkits,
  useConnectComposioToolkit,
  useDisableComposioToolkit,
  useDisconnectComposioToolkit,
  useEnableComposioToolkit,
  useSyncComposioToolkit,
} from "@/hooks/use-composio";
import { formatError } from "@/lib/client";
import type { ComposioUserConnectionStatus } from "@nakama/core/contract";

function orgStatusLabel(status: string): string {
  return status === "enabled" ? "Enabled for org" : "Disabled";
}

function userConnectionLabel(status: ComposioUserConnectionStatus | undefined): string {
  switch (status) {
    case "connected":
      return "You: Connected";
    case "oauth_in_progress":
      return "You: Connecting…";
    case "error":
      return "You: Error";
    default:
      return "You: Not connected";
  }
}

export function ComposioConnectionsCard() {
  const { activeOrg } = useAuth();
  const isOrgAdmin = activeOrg?.role === "admin";
  const { data: settings } = useComposioSettings();
  const toolkitsQuery = useComposioToolkits();
  const enableMutation = useEnableComposioToolkit();
  const disableMutation = useDisableComposioToolkit();
  const connectMutation = useConnectComposioToolkit();
  const disconnectMutation = useDisconnectComposioToolkit();
  const syncMutation = useSyncComposioToolkit();

  if (toolkitsQuery.isLoading) {
    return (
      <Card className="w-full shadow-none">
        <CardContent className="py-3">
          <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
            <Spinner className="size-5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (toolkitsQuery.error) {
    return (
      <Card className="w-full shadow-none">
        <CardContent className="p-4 text-sm text-destructive">
          {formatError(toolkitsQuery.error)}
        </CardContent>
      </Card>
    );
  }

  const data = toolkitsQuery.data;
  const configured = settings?.configured === true || data?.configured === true;

  if (!configured) {
    return (
      <Card className="w-full shadow-none">
        <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            {isOrgAdmin
              ? "Save your Composio API key first"
              : "Composio is not configured on this server"}
          </p>
          <p>
            {isOrgAdmin
              ? "Once the key is saved above, you can enable toolkits and connect your own accounts here."
              : "Ask an org admin to save the Composio project API key on Integrations."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  if (data.catalogError) {
    return (
      <Card className="w-full shadow-none">
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-medium text-foreground">Could not load Composio toolkits</p>
          <p className="text-destructive">{data.catalogError}</p>
          {isOrgAdmin ? (
            <p className="text-muted-foreground">
              Verify the saved project API key under Settings → Project Settings → API Keys, then
              save it again above.
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const orgBySlug = new Map(data.orgToolkits.map((toolkit) => [toolkit.toolkitSlug, toolkit]));
  const userByToolkitId = new Map(
    data.userConnections.map((connection) => [connection.toolkitId, connection]),
  );

  return (
    <Card className="w-full shadow-none">
      <CardContent className="p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">SaaS toolkits</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Org admins enable which apps are allowed. Each member connects their own accounts for
            chat.
          </p>
        </div>

        {data.catalog.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No toolkits available yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {data.catalog.map((catalogToolkit) => {
              const orgToolkit = orgBySlug.get(catalogToolkit.slug);
              const orgEnabled = orgToolkit?.status === "enabled";
              const userConnection = orgToolkit
                ? userByToolkitId.get(orgToolkit.id)
                : undefined;
              const userStatus = userConnection?.status;
              const busy =
                enableMutation.isPending ||
                disableMutation.isPending ||
                connectMutation.isPending ||
                disconnectMutation.isPending ||
                syncMutation.isPending;

              return (
                <div
                  key={catalogToolkit.slug}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <PlugIcon className="size-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">{catalogToolkit.name}</p>
                      {orgToolkit ? (
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {orgStatusLabel(orgToolkit.status)}
                        </span>
                      ) : (
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Not enabled
                        </span>
                      )}
                      {orgEnabled ? (
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {userConnectionLabel(userStatus)}
                        </span>
                      ) : null}
                    </div>
                    {catalogToolkit.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {catalogToolkit.description}
                      </p>
                    ) : null}
                    {userConnection?.lastError ? (
                      <p className="mt-2 text-xs text-destructive">{userConnection.lastError}</p>
                    ) : null}
                    {orgToolkit?.lastError ? (
                      <p className="mt-2 text-xs text-destructive">{orgToolkit.lastError}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isOrgAdmin && (!orgToolkit || orgToolkit.status === "disabled") ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => enableMutation.mutate(catalogToolkit.slug)}
                      >
                        Enable for org
                      </Button>
                    ) : null}

                    {isOrgAdmin && orgToolkit && orgToolkit.status === "enabled" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => disableMutation.mutate(catalogToolkit.slug)}
                      >
                        Disable for org
                      </Button>
                    ) : null}

                    {orgEnabled && userStatus !== "connected" && userStatus !== "oauth_in_progress" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => connectMutation.mutate(catalogToolkit.slug)}
                      >
                        Connect your account
                      </Button>
                    ) : null}

                    {orgEnabled && userStatus === "connected" ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => syncMutation.mutate(catalogToolkit.slug)}
                        >
                          Sync tools
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => disconnectMutation.mutate(catalogToolkit.slug)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
