import * as readline from "node:readline/promises";
import type { TinyClawClient } from "@tinyclaw/client";
import {
  getUserConfigPath,
  promptForProviderConfig,
  type ProviderModelOption,
  type UserProviderName,
} from "@tinyclaw/core";

export async function ensureUserConfiguredViaCli(
  client: TinyClawClient,
): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return false;
  }

  console.log("TinyClaw admin setup\n");
  console.log("No admin user found. Let's create one.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const email = await rl.question("Email: ");
    const password = await rl.question("Password: ", { mask: true });
    const confirmPassword = await rl.question("Confirm password: ", { mask: true });

    if (password !== confirmPassword) {
      console.log("\nPasswords do not match.");
      return false;
    }

    if (password.length < 8) {
      console.log("\nPassword must be at least 8 characters.");
      return false;
    }

    const result = await client.setupUser(email, password);
    console.log("\nAdmin user created successfully.");

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`\nFailed to create admin user: ${message}`);
    return false;
  } finally {
    rl.close();
  }
}

export async function ensureProviderConfiguredViaCli(
  client: TinyClawClient,
): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return false;
  }

  const catalog = await client.getModels();
  const modelHelpers = createModelHelpers(catalog.models);

  console.log("TinyClaw setup\n");
  console.log("No API key found. Let's configure one.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const config = await promptForProviderConfig({
      question: (prompt) => rl.question(prompt),
      writeLine: (line) => console.log(line),
      ...modelHelpers,
    });

    const instance = config.providers[0]!;

    const result = await client.configureProvider({
      apiKey: instance.apiKey,
      model: config.defaultModel ?? undefined,
      provider: instance.type,
      displayName: instance.type === "openai_compatible" ? instance.label : undefined,
      baseUrl: instance.baseUrl,
      customModels: instance.customModels,
    });

    console.log(
      `\nProvider configured (${result.provider}, ${result.currentModel}).`,
    );
    console.log(`Saved to ${getUserConfigPath()}\n`);

    return true;
  } finally {
    rl.close();
  }
}

function createModelHelpers(models: ProviderModelOption[]) {
  return {
    getModelsForProvider: (provider: UserProviderName) =>
      models.filter((model) => model.provider === provider),
    getDefaultModel: (provider: UserProviderName) => {
      const providerModels = models.filter((model) => model.provider === provider);
      return (
        providerModels.find((model) => model.default)?.id ??
        providerModels[0]?.id ??
        "gpt-5.4"
      );
    },
    getModelById: (modelId: string) => models.find((model) => model.id === modelId),
  };
}
