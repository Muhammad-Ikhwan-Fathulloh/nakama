import { nanoid } from "nanoid";

export type ID = string;
export { nanoid };

export function createId(prefix: string): ID {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function generateTemporaryPassword(size = 12): string {
  return nanoid(size);
}
