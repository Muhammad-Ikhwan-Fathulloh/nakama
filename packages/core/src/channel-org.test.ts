import { describe, expect, test } from "bun:test";
import {
  findOrgBySelectionInput,
  formatOrgSelectionPrompt,
  prepareChannelOrgContext,
} from "./channel-org";
import type { UserOrgSummary } from "./contract";

const orgs: UserOrgSummary[] = [
  {
    id: "org_a",
    name: "Acme",
    slug: "acme",
    role: "admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "org_b",
    name: "Beta",
    slug: "beta",
    role: "member",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("findOrgBySelectionInput", () => {
  test("matches list index", () => {
    expect(findOrgBySelectionInput("2", orgs)?.id).toBe("org_b");
  });

  test("matches slug", () => {
    expect(findOrgBySelectionInput("acme", orgs)?.id).toBe("org_a");
  });
});

describe("prepareChannelOrgContext", () => {
  test("auto-selects when only one org exists", async () => {
    let saved: string | undefined;

    const result = await prepareChannelOrgContext({
      listOrgs: async () => ({ orgs: [orgs[0]!] }),
      getSelectedOrgId: () => undefined,
      saveSelectedOrgId: async (orgId) => {
        saved = orgId;
      },
    });

    expect(result).toEqual({
      status: "ready",
      orgId: "org_a",
      orgName: "Acme",
    });
    expect(saved).toBe("org_a");
  });

  test("prompts when multiple orgs and nothing stored", async () => {
    const result = await prepareChannelOrgContext({
      listOrgs: async () => ({ orgs }),
      getSelectedOrgId: () => undefined,
      saveSelectedOrgId: async () => {},
    });

    expect(result.status).toBe("prompt");
    if (result.status === "prompt") {
      expect(result.message).toBe(formatOrgSelectionPrompt(orgs));
    }
  });

  test("accepts numeric selection replies", async () => {
    let saved: string | undefined;

    const result = await prepareChannelOrgContext({
      listOrgs: async () => ({ orgs }),
      getSelectedOrgId: () => undefined,
      saveSelectedOrgId: async (orgId) => {
        saved = orgId;
      },
      text: "2",
    });

    expect(result).toEqual({
      status: "ready",
      orgId: "org_b",
      orgName: "Beta",
      justSelected: true,
    });
    expect(saved).toBe("org_b");
  });
});
