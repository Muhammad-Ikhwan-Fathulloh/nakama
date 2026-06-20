import { ImageIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { AttachmentDetailPanel } from "@/components/chat/attachment-detail-panel";
import { cn } from "@/lib/utils";

interface ImageAttachmentPreviewProps {
  url?: string;
  description?: string | null;
  caption?: string | null;
  onRemove?: () => void;
  className?: string;
}

function previewText(description?: string | null, caption?: string | null): string | null {
  const described = description?.trim();
  if (described) {
    return described;
  }

  const message = caption?.trim();
  return message || null;
}

export function ImageAttachmentPreview({
  url,
  description,
  caption,
  onRemove,
  className,
}: ImageAttachmentPreviewProps) {
  const [open, setOpen] = useState(false);
  const interactive = !onRemove && Boolean(url || description?.trim() || caption?.trim());
  const chipPreview = previewText(description, caption);

  const chip = (
    <>
      {url ? (
        <img
          src={url}
          alt=""
          className="size-10 shrink-0 rounded-md border border-border object-cover"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
        </div>
      )}
      <div className="min-w-0 max-w-[10rem]">
        <p className="text-xs font-medium text-foreground">Image</p>
        {chipPreview ? (
          <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{chipPreview}</p>
        ) : null}
      </div>
    </>
  );

  return (
    <>
      {interactive ? (
        <button
          type="button"
          className={cn(
            "relative inline-flex max-w-full shrink-0 items-center gap-2 rounded-lg border border-border bg-muted px-2 py-2 text-left transition-colors hover:bg-muted/70",
            className,
          )}
          onClick={() => setOpen(true)}
        >
          {chip}
        </button>
      ) : (
        <div
          className={cn(
            "relative inline-flex max-w-full shrink-0 items-center gap-2 rounded-lg border border-border bg-muted px-2 py-2",
            onRemove ? "pr-8" : undefined,
            className,
          )}
        >
          {chip}
          {onRemove ? (
            <button
              type="button"
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-transparent text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Remove image"
              onClick={onRemove}
            >
              <XIcon className="size-3" />
            </button>
          ) : null}
        </div>
      )}

      {interactive ? (
        <AttachmentDetailPanel open={open} onOpenChange={setOpen} title="Image">
          <div className="space-y-4">
            {url ? (
              <img
                src={url}
                alt=""
                className="max-h-[min(50vh,28rem)] w-full rounded-lg border border-border object-contain"
              />
            ) : null}
            {caption?.trim() ? (
              <section className="space-y-1">
                <h3 className="text-xs font-medium text-muted-foreground">Message</h3>
                <p className="whitespace-pre-wrap text-sm text-foreground">{caption.trim()}</p>
              </section>
            ) : null}
            {description?.trim() ? (
              <section className="space-y-1">
                <h3 className="text-xs font-medium text-muted-foreground">Description</h3>
                <p className="whitespace-pre-wrap text-sm text-foreground">{description.trim()}</p>
              </section>
            ) : null}
          </div>
        </AttachmentDetailPanel>
      ) : null}
    </>
  );
}
