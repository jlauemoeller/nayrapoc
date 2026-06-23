"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import type { Block } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { requestUpload } from "@/lib/actions/uploadFile";
import { useCreateBlockNote, useEditorChange } from "@blocknote/react";

// BlockNote's image/video/audio/file blocks call this with the picked File and expect a URL
// back. We presign against our object storage, PUT the file directly to it, then hand back the
// public URL. Throwing surfaces the error in BlockNote's upload UI; the server allowlist in
// presignUpload is the real gate on type/size, so we don't pre-validate here.

async function uploadFile(file: File): Promise<string> {
  const result = await requestUpload({ contentType: file.type, contentLength: file.size });
  if (!result.success) throw new Error(result.error);

  const { url, headers, publicUrl } = result.data;
  const put = await fetch(url, { method: "PUT", headers, body: file });
  if (!put.ok) throw new Error("Upload failed — please try again");

  return publicUrl;
}

// Using an interface here instead of a type because the latter triggers
// a false-positive LSP error where the callback function is flagged
// as non-serializable. This check only runs for types though so we can
// silence the in-editor error display by switching to interface.

interface BlockEditorViewProps {
  initialContent?: Block[];
  editable: boolean;
  id?: string;
  onValueChange?: (document: Block[]) => void;
}

export default function BlockEditorView({ initialContent, onValueChange, ...rest }: BlockEditorViewProps) {
  const editor = useCreateBlockNote({
    // BlockNote rejects an empty array; pass undefined for a fresh document.
    initialContent: initialContent?.length ? initialContent : undefined,
    uploadFile
  });

  useEditorChange((editor) => {
    // editor.document is typed against the editor's chosen schema generics;
    // we store the default-schema Block[] shape, so cast at this single
    // BlockNote-aware boundary.

    if (onValueChange) {
      onValueChange(editor.document as Block[]);
    }
  }, editor);

  return (
    <div className="pt-2 pb-2 border rounded-xl min-w-100">
      <BlockNoteView editor={editor} {...rest} />
    </div>
  );
}
