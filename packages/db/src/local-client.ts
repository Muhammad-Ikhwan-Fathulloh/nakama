import { LOCAL_CLIENT_EMAIL, LOCAL_CLIENT_USER_ID } from "@tinyclaw/core/local-auth";
import type { DatabaseAdapter } from "./types";

export async function ensureLocalClientAccess(db: DatabaseAdapter): Promise<void> {
  const now = new Date().toISOString();
  let user = await db.getUserByEmail(LOCAL_CLIENT_EMAIL);

  if (!user) {
    await db.createUser({
      id: LOCAL_CLIENT_USER_ID,
      email: LOCAL_CLIENT_EMAIL,
      passwordHash: "unused",
      createdAt: now,
      updatedAt: now,
    });
    user = await db.getUserByEmail(LOCAL_CLIENT_EMAIL);
  }

  if (!user) {
    return;
  }

  for (const org of await db.listOrganizations()) {
    const member = await db.getOrgMember(org.id, user.id);
    if (member) {
      continue;
    }

    await db.upsertOrgMember({
      orgId: org.id,
      userId: user.id,
      role: "admin",
      createdAt: now,
    });
  }
}
