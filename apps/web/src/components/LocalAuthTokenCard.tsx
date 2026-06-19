import { useState } from "react";
import { CopyIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useRotateLocalAuthToken } from "@/hooks/use-local-auth-token";
import { formatError } from "@/lib/client";

export function LocalAuthTokenCard() {
  const rotateMutation = useRotateLocalAuthToken();
  const [rotatedToken, setRotatedToken] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function copyToken(): Promise<void> {
    if (!rotatedToken) {
      return;
    }

    await navigator.clipboard.writeText(rotatedToken);
    setHint("Copied to clipboard");
  }

  function handleRotate(): void {
    setFormError(null);
    setHint(null);
    setRotatedToken(null);

    rotateMutation.mutate(undefined, {
      onSuccess: (response) => {
        setRotatedToken(response.token);
        setHint("New token generated. Copy it now — it will not be shown again.");
      },
      onError: (error) => {
        setFormError(formatError(error));
      },
    });
  }

  const statusLine = formError ?? hint;

  return (
    <Card className="w-full shadow-none">
      <CardContent className="divide-y divide-border p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-foreground">Local API token</p>
            <p className="text-xs text-muted-foreground">
              Used by the CLI, Telegram, and WhatsApp bridges on this machine. Rotate if the token
              may have leaked.
            </p>
            {statusLine ? (
              <p
                className={
                  formError ? "text-xs text-destructive" : "text-xs text-emerald-200"
                }
                role="status"
              >
                {statusLine}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={rotateMutation.isPending}
            onClick={handleRotate}
          >
            {rotateMutation.isPending ? (
              <Spinner />
            ) : (
              <>
                <RefreshCwIcon className="size-3.5" aria-hidden="true" />
                Rotate token
              </>
            )}
          </Button>
        </div>

        {rotatedToken ? (
          <div className="space-y-3 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Running workers reload the token from disk after the next failed request. Restart them
              if anything stays disconnected.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="max-w-full break-all rounded-md border border-border bg-background px-2.5 py-1 text-xs">
                {rotatedToken}
              </code>
              <Button type="button" size="sm" variant="outline" onClick={() => void copyToken()}>
                <CopyIcon className="size-4" />
                Copy
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
