import { spawn } from "node:child_process";
import type { NakamaClient } from "@nakama/client";
import type { CodingAgentLaunchPlanResponse } from "@nakama/core";
import { pickProfileForOrg } from "@nakama/core";
import { ensureServerRunning } from "@nakama/core/ensure-server";
import { loadLocalAuthToken } from "@nakama/core/local-auth";
import { createClient } from "@nakama/client";
import { loadSavedCliProfileId } from "./cli-config";
import { resolveProfileInput, resolveStartupProfile } from "./profile";

export interface LaunchCliOptions {
  argv?: string[];
}

export function isLaunchCommand(argv = process.argv.slice(2)): boolean {
  return argv[0] === "launch";
}

export function parseLaunchArgs(argv = process.argv.slice(2)): {
  backend?: string;
  profileId?: string;
  model?: string;
  cwd?: string;
  yes: boolean;
  persistSelection: boolean;
  passthroughArgs: string[];
} {
  const launchArgv = argv[0] === "launch" ? argv.slice(1) : argv;
  let backend: string | undefined;
  let profileId: string | undefined;
  let model: string | undefined;
  let cwd: string | undefined;
  let yes = false;
  let persistSelection = false;
  const passthroughArgs: string[] = [];
  let parsingPassthrough = false;

  for (let index = 0; index < launchArgv.length; index += 1) {
    const arg = launchArgv[index]!;

    if (parsingPassthrough) {
      passthroughArgs.push(arg);
      continue;
    }

    if (arg === "--") {
      parsingPassthrough = true;
      continue;
    }

    if (arg === "--profile" || arg === "-p") {
      profileId = launchArgv[index + 1]?.trim();
      index += 1;
      continue;
    }

    if (arg.startsWith("--profile=")) {
      profileId = arg.slice("--profile=".length).trim();
      continue;
    }

    if (arg === "--model" || arg === "-m") {
      model = launchArgv[index + 1]?.trim();
      index += 1;
      continue;
    }

    if (arg.startsWith("--model=")) {
      model = arg.slice("--model=".length).trim();
      continue;
    }

    if (arg === "--cwd") {
      cwd = launchArgv[index + 1]?.trim();
      index += 1;
      continue;
    }

    if (arg.startsWith("--cwd=")) {
      cwd = arg.slice("--cwd=".length).trim();
      continue;
    }

    if (arg === "--yes" || arg === "-y") {
      yes = true;
      continue;
    }

    if (arg === "--save-harness") {
      persistSelection = true;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown launch flag: ${arg}`);
    }

    if (!backend) {
      backend = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  return {
    backend,
    profileId,
    model,
    cwd,
    yes,
    persistSelection,
    passthroughArgs,
  };
}

export async function runLaunch(options: LaunchCliOptions = {}): Promise<number> {
  const parsed = parseLaunchArgs(options.argv);

  if (!parsed.backend) {
    throw new Error(
      [
        "Usage: nakama launch <backend> [--profile ID] [--model MODEL] [--cwd DIR] [--yes] [--save-harness] [-- ARGS...]",
        "",
        "Backends: claude, codex, opencode",
      ].join("\n"),
    );
  }

  const { serverUrl } = await ensureServerRunning();
  const client = createClient({
    baseUrl: serverUrl,
    authToken: await loadLocalAuthToken("cli@nakama.internal"),
  });

  await client.getMe();

  const profile = await resolveLaunchProfile(client, {
    profileId: parsed.profileId,
    yes: parsed.yes,
  });

  const plan = await client.prepareCodingAgentLaunch({
    profileId: profile.id,
    backend: parsed.backend,
    model: parsed.model,
    cwd: parsed.cwd ?? process.cwd(),
    passthroughArgs: parsed.passthroughArgs,
    persistSelection: parsed.persistSelection,
  });

  printLaunchSummary(plan);
  return execCodingAgentLaunch(plan);
}

async function resolveLaunchProfile(
  client: NakamaClient,
  options: { profileId?: string; yes: boolean },
) {
  const { profiles } = await client.listProfiles();

  if (profiles.length === 0) {
    throw new Error("No bot profiles found.");
  }

  const explicitProfileId = options.profileId?.trim();

  if (explicitProfileId) {
    const match = resolveProfileInput(profiles, explicitProfileId);

    if (!match) {
      throw new Error(`Unknown profile: ${explicitProfileId}`);
    }

    return match;
  }

  if (options.yes) {
    const savedProfileId = await loadSavedCliProfileId();
    const saved = savedProfileId
      ? profiles.find((profile) => profile.id === savedProfileId)
      : null;

    return saved ?? pickProfileForOrg(profiles);
  }

  const startup = await resolveStartupProfile(client, {});
  return startup.profile;
}

function printLaunchSummary(plan: CodingAgentLaunchPlanResponse): void {
  const commandLine = [plan.command, ...plan.args].join(" ");

  console.log(`Launching ${plan.harnessName} (${plan.harnessKind})`);
  console.log(`Profile model: ${plan.model ?? "default"}`);
  console.log(`Working directory: ${plan.cwd}`);
  console.log(`Command: ${commandLine}`);

  if (Object.keys(plan.env).length > 0) {
    console.log("Spawn env: inference gateway routing enabled");
  }

  console.log("");
}

export async function execCodingAgentLaunch(plan: CodingAgentLaunchPlanResponse): Promise<number> {
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

export function formatLaunchError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
