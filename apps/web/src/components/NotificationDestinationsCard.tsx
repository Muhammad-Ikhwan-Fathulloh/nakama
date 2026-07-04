import { useState } from "react";
import type { NotificationDestinationWithSecret } from "@tinyclaw/core/contract";
import { RefreshCwIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  useCreateNotificationDestination,
  useDeleteNotificationDestination,
  useNotificationDestinations,
  useRegenerateNotificationDestinationKey,
} from "@/hooks/use-notification-destinations";
import { formatError } from "@/lib/client";
import {
  buildNotificationWebhookUrl,
  formatTelegramDestinationLabel,
} from "@/lib/notification-destinations";

function LatestSecret({
  latestSecret,
}: {
  latestSecret: NotificationDestinationWithSecret | null;
}) {
  if (!latestSecret) {
    return null;
  }

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const webhookUrl = buildNotificationWebhookUrl(origin, latestSecret.destination.webhookPath);

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium text-foreground">Latest webhook credentials</p>
      <p className="mt-2 text-xs text-muted-foreground">Webhook URL</p>
      <code className="block break-all text-xs text-foreground">{webhookUrl}</code>
      <p className="mt-3 text-xs text-muted-foreground">API key</p>
      <code className="block break-all text-xs text-foreground">{latestSecret.apiKey}</code>
    </div>
  );
}

export function NotificationDestinationsCard() {
  const { data, isLoading, error } = useNotificationDestinations();
  const createMutation = useCreateNotificationDestination();
  const rotateMutation = useRegenerateNotificationDestinationKey();
  const deleteMutation = useDeleteNotificationDestination();

  const [name, setName] = useState("");
  const [chatId, setChatId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [latestSecret, setLatestSecret] = useState<NotificationDestinationWithSecret | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);

  const destinations = data?.destinations ?? [];

  function resetForm() {
    setName("");
    setChatId("");
    setTopicId("");
  }

  function handleCreate() {
    setFormError(null);
    const parsedChatId = Number(chatId.trim());
    const parsedTopicId = topicId.trim() ? Number(topicId.trim()) : null;

    if (!Number.isInteger(parsedChatId) || parsedChatId <= 0) {
      setFormError("Chat ID must be a positive integer.");
      return;
    }

    if (
      parsedTopicId !== null &&
      (!Number.isInteger(parsedTopicId) || parsedTopicId <= 0)
    ) {
      setFormError("Topic ID must be a positive integer when provided.");
      return;
    }

    createMutation.mutate(
      {
        name: name.trim() || `Telegram ${parsedChatId}`,
        channel: "telegram",
        telegram: {
          chatId: parsedChatId,
          ...(parsedTopicId !== null ? { topicId: parsedTopicId } : {}),
        },
      },
      {
        onSuccess: (created) => {
          setLatestSecret(created);
          resetForm();
        },
        onError: (mutationError) => {
          setFormError(formatError(mutationError));
        },
      },
    );
  }

  async function handleRotate(destinationId: string) {
    setFormError(null);

    rotateMutation.mutate(destinationId, {
      onSuccess: (rotated) => {
        setLatestSecret(rotated);
      },
      onError: (mutationError) => {
        setFormError(formatError(mutationError));
      },
    });
  }

  async function handleDelete(destinationId: string) {
    setFormError(null);

    deleteMutation.mutate(destinationId, {
      onSuccess: () => {
        if (latestSecret?.destination.id === destinationId) {
          setLatestSecret(null);
        }
      },
      onError: (mutationError) => {
        setFormError(formatError(mutationError));
      },
    });
  }

  return (
    <Card className="w-full shadow-none">
      <CardContent className="space-y-4 py-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Notification Destinations</p>
          <p className="text-xs text-muted-foreground">
            Create a Telegram destination, then use the webhook URL and API key from TinyClaw
            to send simple notifications.
          </p>
        </div>

        <LatestSecret latestSecret={latestSecret} />

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Telegram chat ID</span>
            <Input value={chatId} onChange={(event) => setChatId(event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Telegram topic ID (optional)</span>
            <Input value={topicId} onChange={(event) => setTopicId(event.target.value)} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Spinner className="size-4" /> : null}
            Create destination
          </Button>
          <span className="text-xs text-muted-foreground">Channel: Telegram</span>
        </div>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        {error ? <p className="text-sm text-destructive">{formatError(error)}</p> : null}

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">
              <Spinner className="size-5" />
            </div>
          ) : destinations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No notification destinations yet.
            </div>
          ) : (
            destinations.map((destination) => (
              <div
                key={destination.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">{destination.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTelegramDestinationLabel(destination.telegram)}
                  </p>
                  <code className="block break-all text-xs text-muted-foreground">
                    {destination.webhookPath}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotate(destination.id)}
                    disabled={rotateMutation.isPending}
                  >
                    <RefreshCwIcon className="size-4" />
                    Rotate key
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(destination.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2Icon className="size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
