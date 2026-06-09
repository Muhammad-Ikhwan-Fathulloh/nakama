import path from "node:path";
import { getUserConfigDir } from "@tinyclaw/core";

export const SKILL_FILE_NAME = "SKILL.md";
export const SKILL_TOOL_FILES = ["tool.ts", "tool.js"] as const;

/** Global workflow skills: ~/.tinyclaw/skills/ */
export function getGlobalSkillsDir(): string {
  const override = process.env.TINYCLAW_SKILLS_DIR?.trim();

  if (override) {
    return override;
  }

  return path.join(getUserConfigDir(), "skills");
}

/** Per-profile skills: ~/.tinyclaw/profiles/{profileId}/skills/ */
export function getProfileSkillsDir(profileId: string): string {
  return path.join(getUserConfigDir(), "profiles", profileId, "skills");
}

/** Project-local skills: {projectRoot}/.agents/skills/ */
export function getProjectSkillsDir(projectRoot?: string): string | null {
  const root = projectRoot?.trim() || process.env.TINYCLAW_PROJECT_ROOT?.trim();

  if (!root) {
    return null;
  }

  return path.join(root, ".agents", "skills");
}

export function resolveSkillDiscoveryDirs(options: {
  profileId?: string;
  projectRoot?: string;
} = {}): string[] {
  const dirs = [getGlobalSkillsDir()];
  const projectDir = getProjectSkillsDir(options.projectRoot);

  if (projectDir) {
    dirs.push(projectDir);
  }

  if (options.profileId) {
    dirs.push(getProfileSkillsDir(options.profileId));
  }

  return [...new Set(dirs)];
}
