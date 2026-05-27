import { access, readFile } from "node:fs/promises";
import { getUserContextPath } from "./paths";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function loadUserContext(): Promise<string | undefined> {
  const path = getUserContextPath();

  if (!(await fileExists(path))) {
    return undefined;
  }

  const content = (await readFile(path, "utf8")).trim();
  return content || undefined;
}

export async function getUserContextStatus(): Promise<{
  path: string;
  active: boolean;
  content?: string;
}> {
  const path = getUserContextPath();
  const content = await loadUserContext();

  return {
    path,
    active: content !== undefined,
    ...(content !== undefined ? { content } : {}),
  };
}
