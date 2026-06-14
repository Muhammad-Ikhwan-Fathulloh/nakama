import { BookOpenIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useSkillQuery } from "@/hooks/use-app-queries";
import { formatError } from "@/lib/client";
import { cn } from "@/lib/utils";

interface SkillDetailDialogProps {
  skillId: string | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveFromProfile?: (skillId: string, skillName: string) => void;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

function formatSkillMeta(skill: {
  hasTool: boolean;
  disableModelInvocation: boolean;
}): string[] {
  const parts: string[] = [];

  if (skill.hasTool) {
    parts.push("includes tool");
  }

  if (skill.disableModelInvocation) {
    parts.push("explicit invoke only");
  }

  return parts;
}

export function SkillDetailDialog({
  skillId,
  busy,
  onOpenChange,
  onRemoveFromProfile,
}: SkillDetailDialogProps) {
  const {
    data: skill,
    isLoading,
    error,
  } = useSkillQuery(skillId);

  const errorMessage = error ? formatError(error) : null;
  const meta = skill ? formatSkillMeta(skill) : [];

  return (
    <Dialog open={Boolean(skillId)} onOpenChange={onOpenChange}>
      <DialogContent className="no-scrollbar flex max-h-[min(90dvh,85vh)] w-[calc(100%-1.5rem)] flex-col gap-4 overflow-y-auto p-4 sm:max-w-3xl sm:gap-6 sm:p-6">
        {isLoading && !skill ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading skill…
          </div>
        ) : skill ? (
          <>
            <DialogHeader className="gap-2 pr-8 sm:gap-3">
              <DialogTitle className="flex items-center gap-2 text-base">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground">
                  <BookOpenIcon className="size-4" aria-hidden />
                </span>
                {skill.name}
              </DialogTitle>
              <DialogDescription className="leading-relaxed">{skill.description}</DialogDescription>
              {meta.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {meta.map((label) => (
                    <span
                      key={label}
                      className="inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
            </DialogHeader>

            <div className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto">
              {errorMessage ? (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}

              <dl className="grid gap-3 text-sm sm:grid-cols-[7rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground">Source</dt>
                <dd className="type-code break-all text-foreground">{skill.sourcePath}</dd>

                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground">{formatTimestamp(skill.createdAt)}</dd>

                <dt className="text-muted-foreground">Updated</dt>
                <dd className="text-foreground">{formatTimestamp(skill.updatedAt)}</dd>
              </dl>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Instructions</p>
                {skill.body.trim() ? (
                  <Textarea
                    className="no-scrollbar min-h-48 font-mono text-xs leading-relaxed sm:min-h-64"
                    value={skill.body}
                    readOnly
                    aria-label={`Instructions for ${skill.name}`}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No instructions in SKILL.md body.</p>
                )}
              </div>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 border-t-0 bg-transparent p-0 pt-2 pb-2 sm:flex-row sm:justify-between sm:gap-3">
              {onRemoveFromProfile ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={busy || isLoading}
                  onClick={() => onRemoveFromProfile(skill.id, skill.name)}
                >
                  <Trash2Icon className="size-4" aria-hidden />
                  Remove from profile
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}

              <Button
                type="button"
                variant="outline"
                className={cn("w-full sm:w-auto", onRemoveFromProfile && "sm:ml-auto")}
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        ) : errorMessage ? (
          <>
            <DialogHeader>
              <DialogTitle>Skill details</DialogTitle>
              <DialogDescription>{errorMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="border-t-0 bg-transparent p-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
