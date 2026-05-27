import { access, mkdir, writeFile } from "node:fs/promises";
import { getUserConfigDir } from "../user-config";
import { getUserContextPath } from "./paths";
import { USER_TEMPLATE } from "./templates";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
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
