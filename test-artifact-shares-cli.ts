import { mkdir, writeFile, rm } from "node:fs/promises";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getProfileArtifactsDir, getProfileSoulDir } from "@nakama/core";
import { createInMemoryDatabaseAdapter } from "@nakama/db";
import { createHonoApp } from "./apps/server/src/http/app";
import { AuthService } from "./apps/server/src/services/auth-service";
import { OrgService } from "./apps/server/src/services/org-service";
import { setupFreshInstallSession } from "./apps/server/src/http/test-session-helpers";

async function manualCliTest() {
  console.log("🚀 Starting manual CLI test for artifact shares...\n");

  // 0. Create temp config dir
  const originalConfigDir = process.env.NAKAMA_CONFIG_DIR;
  const testConfigDir = mkdtempSync(join(tmpdir(), "nakama-artifact-shares-cli-test-"));
  process.env.NAKAMA_CONFIG_DIR = testConfigDir;
  console.log(`� Using temp config dir: ${testConfigDir}`);

  try {
    // 1. Create app
    const databaseAdapter = createInMemoryDatabaseAdapter();
    const authService = new AuthService();
    const app = createHonoApp({
      agent: {} as never,
      automationService: {} as never,
      taskService: {} as never,
      systemStatus: { getStatus: async () => ({ ok: true }) } as never,
      workerManager: {} as never,
      mcpService: {} as never,
      authService,
      orgService: new OrgService(databaseAdapter, authService),
      databaseAdapter,
      webDistDir: null,
    });

    const session = await setupFreshInstallSession(app, databaseAdapter);
    const orgId = session.orgId!;
    const profileId = "cli-test-profile";
    const now = new Date().toISOString();

    // 2. Create test profile
    console.log("\n📝 Step 1: Creating test profile...");
    await databaseAdapter.upsertProfile({
      id: profileId,
      orgId,
      name: "CLI Test Profile",
      systemPrompt: "test",
      model: "openrouter/auto",
      isSuper: false,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Create test artifact file in profile's artifacts dir
    console.log("\n📝 Step 2: Creating test artifact...");
    const artifactsDir = getProfileArtifactsDir(orgId, profileId);
    const soulDir = getProfileSoulDir(orgId, profileId);
    await mkdir(artifactsDir, { recursive: true });
    await mkdir(soulDir, { recursive: true });
    const testArtifactPath = join(artifactsDir, "test-report.md");
    await writeFile(testArtifactPath, "# Hello from CLI Test!\n\nThis is a test artifact shared via CLI.", "utf8");
    console.log(`✅ Artifact created at: ${testArtifactPath}`);

    // 4. Publish artifact share
    console.log("\n🚀 Step 3: Publishing artifact share...");
    const publishUrl = `http://localhost:4310/v1/profiles/${profileId}/artifacts/shares`;
    const publishRequest = new Request(publishUrl, {
      method: "POST",
      headers: session.headers(
        {
          "Content-Type": "application/json",
          "X-CSRF-Token": session.csrfToken,
        },
        orgId,
      ),
      body: JSON.stringify({ path: "test-report.md" }),
    });
    const publishResponse = await app.fetch(publishRequest);
    console.log(`📡 Publish response status: ${publishResponse.status}`);
    
    const published = await publishResponse.json() as { id: string; token: string };
    console.log(`✅ Artifact share published!`);
    console.log(`   Share ID: ${published.id}`);
    console.log(`   Share Token: ${published.token}`);
    console.log(`   Public URL: http://localhost:4310/v1/public/artifact-shares/${encodeURIComponent(published.token)}`);

    // 5. Read artifact share anonymously
    console.log("\n🔍 Step 4: Reading artifact anonymously...");
    const publicUrl = `http://localhost:4310/v1/public/artifact-shares/${encodeURIComponent(published.token)}`;
    const publicResponse = await app.fetch(new Request(publicUrl));
    console.log(`📡 Read response status: ${publicResponse.status}`);
    const artifactContent = await publicResponse.text();
    console.log(`✅ Artifact content:\n---\n${artifactContent}\n---`);

    // 6. Check security headers
    console.log("\n🔒 Step 5: Checking security headers...");
    console.log(`   Content-Security-Policy: ${publicResponse.headers.get("Content-Security-Policy")}`);
    console.log(`   X-Frame-Options: ${publicResponse.headers.get("X-Frame-Options")}`);
    console.log(`   X-Content-Type-Options: ${publicResponse.headers.get("X-Content-Type-Options")}`);
    console.log(`   X-XSS-Protection: ${publicResponse.headers.get("X-XSS-Protection")}`);

    // 7. Revoke artifact share
    console.log("\n❌ Step 6: Revoking artifact share...");
    const revokeUrl = `http://localhost:4310/v1/profiles/${profileId}/artifacts/shares/${published.id}`;
    const revokeRequest = new Request(revokeUrl, {
      method: "DELETE",
      headers: session.headers(
        {
          "X-CSRF-Token": session.csrfToken,
        },
        orgId,
      ),
    });
    const revokeResponse = await app.fetch(revokeRequest);
    console.log(`📡 Revoke response status: ${revokeResponse.status}`);
    console.log("✅ Artifact share revoked!");

    // 8. Verify share is no longer accessible
    console.log("\n🔍 Step 7: Verifying revoked share is 404...");
    const afterRevokeResponse = await app.fetch(new Request(publicUrl));
    console.log(`📡 After revoke response status: ${afterRevokeResponse.status}`);
    console.log("✅ Share no longer accessible (404)!");

    // 9. Cleanup profile dirs
    console.log("\n🧹 Cleaning up profile directories...");
    await rm(artifactsDir, { recursive: true, force: true });
    await rm(soulDir, { recursive: true, force: true });

    console.log("\n🎉 Manual CLI test passed!");
  } finally {
    // Cleanup temp config dir
    console.log("\n🧹 Cleaning up temp config dir...");
    if (originalConfigDir === undefined) {
      delete process.env.NAKAMA_CONFIG_DIR;
    } else {
      process.env.NAKAMA_CONFIG_DIR = originalConfigDir;
    }
    rmSync(testConfigDir, { recursive: true, force: true });
    console.log("✅ Temp config dir cleaned up!");
  }
}

manualCliTest().catch(console.error);
