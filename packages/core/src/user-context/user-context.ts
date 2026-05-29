import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getUserConfigDir } from "../user-config";
import { USER_TEMPLATE } from "./templates";

export function getUserContextPath(): string {
  return join(getUserConfigDir(), "USER.md");
}

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

export async function writeUserContext(content: string): Promise<void> {
  const dir = getUserConfigDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(getUserContextPath(), content, {
    encoding: "utf8",
    mode: 0o600,
  });
}

export interface InitUserContextResult {
  path: string;
  created: boolean;
}

export async function initUserContext(): Promise<InitUserContextResult> {
  const path = getUserContextPath();
  const dir = getUserConfigDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });

  if (await fileExists(path)) {
    return { path, created: false };
  }

  await writeFile(path, USER_TEMPLATE, { encoding: "utf8", mode: 0o600 });
  return { path, created: true };
}
