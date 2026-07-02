import { describe, expect, test } from "bun:test";
import { diffFrames, serializeDiffOps, type FrameModel } from "./terminal-frame";
import { plainLine } from "./styled-text";

describe("terminal frame diff", () => {
  test("does not clear every row on initial render", () => {
    const next: FrameModel = {
      topRow: 1,
      scrollTop: 1,
      scrollBottom: 4,
      lines: [plainLine(""), plainLine(""), plainLine(""), plainLine(""), plainLine("> ")],
      cursor: { row: 5, col: 3, visible: false },
    };

    const ops = diffFrames(null, next);
    const writeLineRows = ops
      .filter((op) => op.kind === "write_line")
      .map((op) => op.row);

    expect(writeLineRows).toEqual([5]);
  });

  test("uses scroll-up optimization for tail-follow updates", () => {
    const previous: FrameModel = {
      topRow: 1,
      scrollTop: 1,
      scrollBottom: 4,
      lines: [plainLine("a"), plainLine("b"), plainLine("c"), plainLine("d"), plainLine("> ")],
      cursor: { row: 5, col: 3, visible: false },
    };
    const next: FrameModel = {
      topRow: 1,
      scrollTop: 1,
      scrollBottom: 4,
      lines: [plainLine("b"), plainLine("c"), plainLine("d"), plainLine("e"), plainLine("> ")],
      cursor: { row: 5, col: 3, visible: false },
    };

    const ops = diffFrames(previous, next);
    expect(ops.some((op) => op.kind === "scroll_up")).toBe(true);
    expect(ops.some((op) => op.kind === "write_line" && op.row === 4)).toBe(true);

    const ansi = serializeDiffOps(ops);
    expect(ansi).toContain("\x1b[4;1H\n");
  });

  test("uses scroll-up with pinned status line at bottom of scroll region", () => {
    const statusLine = plainLine("[thinking]");
    const previous: FrameModel = {
      topRow: 1,
      scrollTop: 1,
      scrollBottom: 5,
      lines: [
        plainLine("a"),
        plainLine("b"),
        plainLine("c"),
        plainLine("d"),
        statusLine,
        plainLine("> "),
      ],
      cursor: { row: 6, col: 3, visible: false },
    };
    const next: FrameModel = {
      topRow: 1,
      scrollTop: 1,
      scrollBottom: 5,
      lines: [
        plainLine("b"),
        plainLine("c"),
        plainLine("d"),
        plainLine("e"),
        statusLine,
        plainLine("> "),
      ],
      cursor: { row: 6, col: 3, visible: false },
    };

    const ops = diffFrames(previous, next);
    expect(ops.some((op) => op.kind === "scroll_up")).toBe(true);

    // The new content line at the bottom of the scrolling area should be written
    expect(ops.some((op) => op.kind === "write_line" && op.row === 4)).toBe(true);

    // The pinned status line at index 4 (row 5) must be re-written at its
    // original position since scroll_up shifted it by 1.
    expect(ops.some((op) => op.kind === "write_line" && op.row === 5)).toBe(true);
  });

});
