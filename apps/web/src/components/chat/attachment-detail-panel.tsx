import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AttachmentDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function AttachmentDetailPanel({
  open,
  onOpenChange,
  title,
  children,
  className,
}: AttachmentDetailPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          data-slot="attachment-detail-panel"
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-xl outline-none",
            "data-open:animate-in data-open:slide-in-from-right data-open:duration-200",
            "data-closed:animate-out data-closed:slide-out-to-right data-closed:duration-200",
            className,
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <DialogTitle className="text-sm font-medium">{title}</DialogTitle>
            <DialogPrimitive.Close
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Close attachment panel" />
              }
            >
              <XIcon className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
