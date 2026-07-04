import { describe, expect, test } from "bun:test";
import { createInMemoryDatabaseAdapter } from "./adapters/in-memory";

describe("notification destinations", () => {
  test("persists and lists org-scoped telegram destinations", async () => {
    const db = createInMemoryDatabaseAdapter();

    await db.upsertNotificationDestination({
      id: "dest_1",
      name: "Payments",
      channel: "telegram",
      config: { chatId: 1001, topicId: 22 },
      secretHash: "hash_1",
      orgId: "org_1",
      createdAt: "2026-07-04T10:00:00.000Z",
      updatedAt: "2026-07-04T10:00:00.000Z",
    });

    await db.upsertNotificationDestination({
      id: "dest_2",
      name: "Ops",
      channel: "telegram",
      config: { chatId: 1002, topicId: null },
      secretHash: "hash_2",
      orgId: "org_2",
      createdAt: "2026-07-04T11:00:00.000Z",
      updatedAt: "2026-07-04T11:00:00.000Z",
    });

    expect(await db.getNotificationDestination("dest_1")).toEqual({
      id: "dest_1",
      name: "Payments",
      channel: "telegram",
      config: { chatId: 1001, topicId: 22 },
      secretHash: "hash_1",
      orgId: "org_1",
      createdAt: "2026-07-04T10:00:00.000Z",
      updatedAt: "2026-07-04T10:00:00.000Z",
    });

    expect(await db.listNotificationDestinationsForOrg("org_1")).toEqual([
      {
        id: "dest_1",
        name: "Payments",
        channel: "telegram",
        config: { chatId: 1001, topicId: 22 },
        secretHash: "hash_1",
        orgId: "org_1",
        createdAt: "2026-07-04T10:00:00.000Z",
        updatedAt: "2026-07-04T10:00:00.000Z",
      },
    ]);
  });

  test("updates and deletes destinations", async () => {
    const db = createInMemoryDatabaseAdapter();

    await db.upsertNotificationDestination({
      id: "dest_1",
      name: "Payments",
      channel: "telegram",
      config: { chatId: 1001, topicId: 22 },
      secretHash: "hash_1",
      orgId: "org_1",
      createdAt: "2026-07-04T10:00:00.000Z",
      updatedAt: "2026-07-04T10:00:00.000Z",
    });

    await db.upsertNotificationDestination({
      id: "dest_1",
      name: "Payments Updated",
      channel: "telegram",
      config: { chatId: 1001, topicId: null },
      secretHash: "hash_2",
      orgId: "org_1",
      createdAt: "2026-07-04T10:00:00.000Z",
      updatedAt: "2026-07-04T10:05:00.000Z",
    });

    expect((await db.getNotificationDestination("dest_1"))?.secretHash).toBe("hash_2");
    expect(await db.deleteNotificationDestination("dest_1")).toBe(true);
    expect(await db.getNotificationDestination("dest_1")).toBeNull();
  });
});
