import { afterEach, describe, expect, spyOn, test } from "bun:test";
import type { PromptSuggestion } from "./commands";
import { PersistentPrompt } from "./persistent-prompt";
import type { PromptLineResult } from "./prompt";
import type { ComposerRenderer, ComposerState } from "./terminal-renderer";
import type { TerminalInput } from "./terminal-input";

class FakeRenderer implements ComposerRenderer {
  state: ComposerState | null = null;

  setComposerState(state: ComposerState): void {
    this.state = state;
  }
}

class FakeTerminalInput {
  onInput(): () => void {
    return () => {};
  }
}

describe("PersistentPrompt", () => {
  const prompts: PersistentPrompt[] = [];
  let stdoutWriteSpy: ReturnType<typeof spyOn<typeof process.stdout, "write">> | null = null;

  afterEach(() => {
    for (const prompt of prompts) {
      prompt.stop();
    }

    prompts.length = 0;
    stdoutWriteSpy?.mockRestore();
    stdoutWriteSpy = null;
  });

  test("prefill renders suggestions for the inserted value", () => {
    stdoutWriteSpy = spyOn(process.stdout, "write").mockImplementation(() => true);
    const renderer = new FakeRenderer();
    const suggestions: PromptSuggestion[] = [
      {
        label: "claude-sonnet",
        description: "Claude Sonnet [Anthropic]",
        insertValue: "/model provider-a::claude-sonnet",
      },
    ];
    const prompt = new PersistentPrompt({
      renderer,
      terminalInput: new FakeTerminalInput() as unknown as TerminalInput,
      getSuggestions: (input) => (input === "/model " ? suggestions : []),
      onSubmit: (_result: PromptLineResult) => {},
      onCancel: () => {},
    });

    prompts.push(prompt);
    prompt.start();
    prompt.prefill("/model ");

    expect(renderer.state).toEqual({
      prefix: "> ",
      value: "/model ",
      cursorVisible: true,
      suggestions: [
        {
          label: "claude-sonnet",
          description: "Claude Sonnet [Anthropic]",
        },
      ],
      selectedIndex: 0,
    });
  });
});
