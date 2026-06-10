import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { createInMemoryDatabaseAdapter } from "@tinyclaw/db";
import { SkillsService } from "./skills-service";

const projectRoot = join(import.meta.dir, "../../../..");

describe("SkillsService", () => {
  test("discovers project skills and syncs them to the database", async () => {
    const db = createInMemoryDatabaseAdapter();
    const service = new SkillsService(db, projectRoot);
    const result = await service.syncDiscoveredSkills();

    expect(result.discovered).toBeGreaterThanOrEqual(1);

    const listed = await service.listSkills();
    const weather = listed.skills.find((skill) => skill.name === "weather");

    expect(weather).toBeDefined();
    expect(weather?.hasTool).toBe(true);
  });

  test("matches weather skill instructions for weather questions", async () => {
    const db = createInMemoryDatabaseAdapter();
    const service = new SkillsService(db, projectRoot);
    await service.syncDiscoveredSkills();

    const weather = (await service.listSkills()).skills.find(
      (skill) => skill.name === "weather",
    );

    expect(weather).toBeDefined();

    await db.assignSkillToProfile("profile_default", weather!.id);

    const matched = await service.formatMatchedSkillsForPrompt(
      "profile_default",
      "What's the weather in Jakarta?",
    );

    expect(matched).toContain("Active Skill: weather");
    expect(matched).toContain("Call the `weather` tool");
  });
});
