import { spawn } from "node:child_process";
import type { DatabaseAdapter, StoredCodingAgentHarnessKind } from "@nakama/db";
import { getProfileSoulDir } from "@nakama/core";
import { loadLocalAuthToken } from "@nakama/core/local-auth";
import {
  buildSpawnEnvForHarness,
  getInferenceGatewayBaseUrl,
  normalizeCodingAgentModel,
} from "./coding-agent-spawn-env";
import {
  getCodingHarnessInstallCommand,
  getCodingHarnessInstallHint,
  resolveCodingAgentHarness,
  saveCodingAgentWorkspaceSettings,
} from "./coding-agent-harness-service";
import { resolveProfileModelId } from "./coding-agent-bash-env";

export const CODING_AGENT_KIND_ALIASES: Record<string, StoredCodingAgentHarnessKind> = {
  claude: "claude_code",
  "claude-code": "claude_code",
  claude_code: "claude_code",
  codex: "codex",
  opencode: "opencode",
};

export interface CodingAgentLaunchPlan {
  command: string;
  args: string[];
  env: Record<string, string>;
  cwd: string;
  harnessId: string;
  harnessKind: StoredCodingAgentHarnessKind;
  harnessName: string;
  model: string | null;
}

export interface PrepareCodingAgentLaunchInput {
  orgId: string;
  profileId: string;
  backend?: string | null;
  model?: string | null;
  cwd?: string | null;
  passthroughArgs?: string[];
  persistSelection?: boolean;
}

export function resolveCodingAgentKindAlias(
  backend: string | null | undefined,
): StoredCodingAgentHarnessKind | null {
  const normalized = backend?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return CODING_AGENT_KIND_ALIASES[normalized] ?? null;
}

export function buildCodingAgentLaunchPlan(input: {
  harness: {
    id: string;
    kind: StoredCodingAgentHarnessKind;
    name: string;
    command: string;
    args: string[];
  };
  cwd: string;
  model: string | null;
  spawnEnv: Record<string, string>;
  passthroughArgs?: string[];
}): CodingAgentLaunchPlan {
  const baseArgs = [...input.harness.args];
  const passthrough = input.passthroughArgs ?? [];
  const args = [...baseArgs, ...passthrough];

  return {
    command: input.harness.command,
    args,
    env: input.spawnEnv,
    cwd: input.cwd,
    harnessId: input.harness.id,
    harnessKind: input.harness.kind,
    harnessName: input.harness.name,
    model: input.model,
  };
}

export async function prepareCodingAgentLaunch(
  db: DatabaseAdapter,
  input: PrepareCodingAgentLaunchInput,
): Promise<CodingAgentLaunchPlan> {
  const profileId = input.profileId.trim();
  const orgId = input.orgId.trim();

  if (!profileId) {
    throw new Error("Profile id is required.");
  }

  if (!orgId) {
    throw new Error("Organization context is required.");
  }

  const profile = await db.getProfile(profileId);

  if (!profile) {
    throw new Error(`Unknown profile: ${profileId}`);
  }

  const preferredKind = resolveCodingAgentKindAlias(input.backend);
  const harness = await resolveCodingAgentHarness(db, preferredKind);

  if (!harness.installed) {
    throw new Error(
      [
        `${harness.name} is not installed.`,
        `Install with: ${getCodingHarnessInstallCommand(harness.kind)}`,
        getCodingHarnessInstallHint(harness.kind),
      ].join(" "),
    );
  }

  const profileModel = normalizeCodingAgentModel(
    input.model?.trim() || (await resolveProfileModelId(db, profileId)),
  );
  const gatewayBaseUrl = getInferenceGatewayBaseUrl();
  const authToken = gatewayBaseUrl ? await resolveInferenceAuthToken() : null;
  const spawnEnv = buildSpawnEnvForHarness(harness.kind, {
    model: profileModel,
    gatewayBaseUrl,
    authToken,
  });
  const cwd = input.cwd?.trim() || getProfileSoulDir(orgId, profileId);

  if (input.persistSelection) {
    await saveCodingAgentWorkspaceSettings(db, {
      selectedHarnessId: harness.id,
    });
  }

  return buildCodingAgentLaunchPlan({
    harness,
    cwd,
    model: profileModel,
    spawnEnv,
    passthroughArgs: input.passthroughArgs,
  });
}

export async function execCodingAgentLaunch(plan: CodingAgentLaunchPlan): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(plan.command, plan.args, {
      cwd: plan.cwd,
      env: {
        ...process.env,
        ...plan.env,
      },
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function resolveInferenceAuthToken(): Promise<string | null> {
  try {
    return await loadLocalAuthToken();
  } catch {
    return null;
  }
}
