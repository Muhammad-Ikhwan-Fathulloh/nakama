import { mkdir, writeFile } from "node:fs/promises";
import { getUserConfigDir } from "../user-config";
import { getUserContextPath } from "./paths";

export async function writeUserContext(content: string): Promise<void> {
  const dir = getUserConfigDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(getUserContextPath(), content, {
    encoding: "utf8",
    mode: 0o600,
  });
}
