import { describe, expect, test } from "bun:test";
import { createInMemoryDatabaseAdapter } from "./adapters/in-memory";
import { WORKSPACE_SETTINGS_ID } from "./constants";

describe("workspace settings", () => {
  test("persists vision model in the database adapter", async () => {
    const db = createInMemoryDatabaseAdapter();

    expect(await db.getWorkspaceSettings()).toBeNull();

    await db.upsertWorkspaceSettings({
      id: WORKSPACE_SETTINGS_ID,
      visionModel: "p-openai::gpt-4o-mini",
      updatedAt: "2026-06-20T10:00:00.000Z",
    });

    expect(await db.getWorkspaceSettings()).toEqual({
      id: WORKSPACE_SETTINGS_ID,
      visionModel: "p-openai::gpt-4o-mini",
      updatedAt: "2026-06-20T10:00:00.000Z",
    });

    await db.upsertWorkspaceSettings({
      id: WORKSPACE_SETTINGS_ID,
      visionModel: null,
      updatedAt: "2026-06-20T10:05:00.000Z",
    });

    expect(await db.getWorkspaceSettings()).toEqual({
      id: WORKSPACE_SETTINGS_ID,
      visionModel: null,
      updatedAt: "2026-06-20T10:05:00.000Z",
    });
  });
});
