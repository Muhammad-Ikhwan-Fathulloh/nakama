import fixPath from "fix-path";

let ensured = false;

export function ensureProcessPath(): void {
  if (ensured || process.env.NAKAMA_DISABLE_FIX_PATH === "1") {
    return;
  }

  fixPath();
  ensured = true;
}

export function resetProcessPathState(): void {
  ensured = false;
}
