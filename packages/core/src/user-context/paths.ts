import { join } from "node:path";
import { getUserConfigDir } from "../user-config";

export function getUserContextPath(): string {
  return join(getUserConfigDir(), "USER.md");
}
