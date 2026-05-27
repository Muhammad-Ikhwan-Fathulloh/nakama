import {
  getUserContextStatus,
  initUserContext,
  loadUserContext,
  writeUserContext,
  type InitUserContextResult,
} from "@tinyclaw/core";

export class UserContextService {
  async getStatus(includeContent = false) {
    const status = await getUserContextStatus();

    if (!includeContent) {
      const { content: _content, ...rest } = status;
      return rest;
    }

    return status;
  }

  async load(): Promise<string | undefined> {
    return loadUserContext();
  }

  async write(content: string): Promise<void> {
    await writeUserContext(content);
  }

  async init(): Promise<InitUserContextResult> {
    return initUserContext();
  }
}
