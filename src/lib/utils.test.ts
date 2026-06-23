import { describe, it, expect } from "vitest";
import { clipText } from "@lib/utils";

const HELLO = "Hello World, nice to meet you! Let's talk";

type Case = [string, string, number];

const CASES: Case[] = [
  [HELLO, "Hello World, ...", 16],
  [HELLO, "Hello World, nice to meet you!", 33],
  [HELLO, "Hello Wo...", 11],
  ["Just testing, 1, 2, 3, testing", "Just testing...", 15]
];

describe("clipText", () => {
  it("passes all cases", () => {
    CASES.forEach(([input, expected, limit], i) => {
      const clipped = clipText(input, limit);
      expect(clipped).toSatisfy(
        (val) => val === expected,
        `Expected "${input}" to return "${expected}" in test ${i} - got "${clipped}"`
      );
    });
  });
});
