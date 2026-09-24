import { describe, it, expect } from "vitest";
import type { Block } from "@blocknote/core";
import { asMarkdown } from "@lib/services/blockDocumentMarkdown";

describe("asMarkdown", () => {
  it("returns an empty string for a missing document", async () => {
    expect(await asMarkdown(undefined)).toBe("");
  });

  it("renders blocks as markdown", async () => {
    const document = [
      {
        id: "1",
        type: "heading",
        props: { level: 2 },
        content: [{ type: "text", text: "Why", styles: {} }],
        children: []
      },
      {
        id: "2",
        type: "paragraph",
        props: {},
        content: [{ type: "text", text: "Boring", styles: { bold: true } }],
        children: []
      }
    ] as unknown as Block[];

    expect((await asMarkdown(document)).trim()).toBe("## Why\n\n**Boring**");
  });
});
