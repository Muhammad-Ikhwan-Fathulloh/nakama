import { CheckIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: {
  id: Theme;
  label: string;
  icon: typeof SunIcon;
}[] = [
  { id: "light", label: "Light", icon: SunIcon },
  { id: "dark", label: "Dark", icon: MoonIcon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <fieldset className="max-w-[17rem]">
      <legend className="sr-only">Color theme</legend>
      <div className="grid grid-cols-2 gap-2">
        {THEME_OPTIONS.map((option) => {
          const active = theme === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setTheme(option.id)}
              className={cn(
                "rounded-md border p-2 text-left transition-colors",
                active
                  ? "border-primary/45 bg-primary/5"
                  : "border-border bg-background hover:bg-muted/40",
              )}
            >
              <ThemePreview theme={option.id} />

              <div className="flex items-center justify-between gap-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Icon
                    className="size-3 shrink-0 text-muted-foreground"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium text-foreground">
                    {option.label}
                  </span>
                </div>

                {active ? (
                  <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-2.5" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ThemePreview({ theme }: { theme: Theme }) {
  const isLight = theme === "light";

  return (
    <div
      className={cn(
        "mb-2 overflow-hidden rounded-sm border p-1.5",
        isLight ? "border-zinc-200 bg-zinc-50" : "border-zinc-800 bg-zinc-950",
      )}
      aria-hidden="true"
    >
      <div className="mb-1 flex items-center gap-1">
        <div
          className={cn(
            "size-1.5 rounded-full",
            isLight ? "bg-zinc-300" : "bg-zinc-600",
          )}
        />
        <div
          className={cn(
            "h-1 flex-1 rounded-full",
            isLight ? "bg-zinc-200" : "bg-zinc-800",
          )}
        />
      </div>
      <div className="space-y-0.5">
        <div
          className={cn(
            "h-1 w-full rounded-full",
            isLight ? "bg-zinc-200" : "bg-zinc-800",
          )}
        />
        <div
          className={cn(
            "h-1 w-4/5 rounded-full",
            isLight ? "bg-zinc-200/80" : "bg-zinc-800/80",
          )}
        />
      </div>
    </div>
  );
}
