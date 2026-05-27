import { useEffect, useState } from "react";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  useInitUserContextMutation,
  useUserContextQuery,
  useWriteUserContextMutation,
} from "@/hooks/use-resource-mutations";
import { formatError } from "@/lib/client";
import { cn } from "@/lib/utils";

export function UserContextCard() {
  const {
    data: status,
    isLoading,
    error: loadError,
    refetch,
  } = useUserContextQuery({ includeContent: true });
  const initMutation = useInitUserContextMutation();
  const writeMutation = useWriteUserContextMutation();

  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const busy = initMutation.isPending || writeMutation.isPending;
  const isDirty = content !== savedContent;
  const isActive = status?.active === true;

  useEffect(() => {
    if (status?.content !== undefined) {
      setContent(status.content);
      setSavedContent(status.content);
    } else if (status && !status.active) {
      setContent("");
      setSavedContent("");
    }
  }, [status]);

  useEffect(() => {
    if (loadError) {
      setFormError(formatError(loadError));
    }
  }, [loadError]);

  async function handleInit() {
    setFormError(null);
    setHint(null);

    try {
      const result = await initMutation.mutateAsync();
      await refetch();
      setHint(result.created ? "Template created." : "USER.md already exists.");
    } catch (error) {
      setFormError(formatError(error));
    }
  }

  async function handleSave() {
    setFormError(null);
    setHint(null);

    try {
      await writeMutation.mutateAsync(content);
      setSavedContent(content);
      setHint("Saved. Start a new chat session to apply changes.");
      await refetch();
    } catch (error) {
      setFormError(formatError(error));
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              About you (USER.md)
            </CardTitle>
            <CardDescription>
              Stable context about you — name, preferences, projects. Separate from Soul, which
              defines who the agent is.
            </CardDescription>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              isActive
                ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-200"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {isActive ? "Configured" : "Not set"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Loading…
          </div>
        ) : (
          <>
            {status?.path ? (
              <p className="text-xs text-muted-foreground break-all">{status.path}</p>
            ) : null}

            {!isActive ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" disabled={busy} onClick={() => void handleInit()}>
                  {initMutation.isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Initializing…
                    </>
                  ) : (
                    "Initialize template"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Or create USER.md manually in your TinyClaw config directory.
                </p>
              </div>
            ) : (
              <>
                <Textarea
                  value={content}
                  disabled={busy}
                  rows={14}
                  className="font-mono text-sm"
                  aria-label="USER.md content"
                  onChange={(event) => {
                    setContent(event.target.value);
                    setHint(null);
                    if (formError) {
                      setFormError(null);
                    }
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || !isDirty}
                    onClick={() => void handleSave()}
                  >
                    {writeMutation.isPending ? (
                      <>
                        <Spinner className="mr-2" />
                        Saving…
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                  {isDirty ? (
                    <span className="text-xs text-muted-foreground">Unsaved changes</span>
                  ) : null}
                </div>
              </>
            )}

            {hint ? (
              <p className="text-xs text-emerald-200" role="status">
                {hint}
              </p>
            ) : null}
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
