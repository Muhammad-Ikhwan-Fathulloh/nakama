export * from "./user-config";
export * from "./runtime";

export function readEnvValue(
  env: Record<string, string | undefined>,
  key: string,
): string | undefined {
  const value = env[key]?.trim();
  return value || undefined;
}

export interface AppConfig {
  appName: string;
  environment: string;
  databaseUrl: string;
}

export function loadConfig(
  env: Record<string, string | undefined> = process.env,
): AppConfig {
  return {
    appName: env.TINYCLAW_APP_NAME ?? "TinyClaw",
    environment: env.NODE_ENV ?? "development",
    databaseUrl: env.DATABASE_URL ?? "file:data/sqlite/tinyclaw.sqlite",
  };
}
