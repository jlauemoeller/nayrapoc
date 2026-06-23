"use client";

import dynamic from "next/dynamic";
import type { Block } from "@blocknote/core";

// BlockNote references `window` at render time, so it can't be server-rendered.
// `ssr: false` must live in a client component (the page is a Server Component).
const BlockEditorView = dynamic(() => import("./block-editor-view"), { ssr: false });

// Using an interface here instead of a type because the latter triggers
// a false-positive LSP error where the callback function is flagged
// as non-serializable. This check only runs for types though so we can
// silence the in-editor error display by switching to interface.

interface BlockEditorProps {
  initialContent?: Block[];
  editable: boolean;
  id?: string;
  onValueChange?: (document: Block[]) => void;
}

export function BlockEditor({ ...props }: BlockEditorProps) {
  return <BlockEditorView {...props} />;
}
