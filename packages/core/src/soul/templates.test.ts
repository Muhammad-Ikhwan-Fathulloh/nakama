import { describe, expect, test } from "bun:test";
import {
  BAD_OUTPUTS_TEMPLATE,
  GOOD_OUTPUTS_TEMPLATE,
  INSTRUCTIONS_TEMPLATE,
  SOUL_TEMPLATE,
  STYLE_TEMPLATE,
} from "./templates";

const PLACEHOLDER_PATTERN = /\[[^\]]+\]/;

describe("default soul templates", () => {
  test("templates avoid bracket placeholders", () => {
    expect(SOUL_TEMPLATE).not.toContain("# Your Name");
    expect(SOUL_TEMPLATE).not.toMatch(PLACEHOLDER_PATTERN);

    for (const template of [
      STYLE_TEMPLATE,
      INSTRUCTIONS_TEMPLATE,
      GOOD_OUTPUTS_TEMPLATE,
      BAD_OUTPUTS_TEMPLATE,
    ]) {
      expect(template).not.toMatch(PLACEHOLDER_PATTERN);
    }
  });

});
