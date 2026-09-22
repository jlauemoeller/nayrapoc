import type { Block } from "@blocknote/core";
import { ServerBlockNoteEditor } from "@blocknote/server-util";

// Server-only: @blocknote/server-util depends on jsdom. Keep this out of
// `models/`, which client components import for schemas and types.
export async function asMarkdown(document: Block[] | undefined): Promise<string> {
  if (!document) return "";

  const editor = ServerBlockNoteEditor.create();
  return editor.blocksToMarkdownLossy(document);
}
