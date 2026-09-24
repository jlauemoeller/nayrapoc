"use client";

import type { Block } from "@blocknote/core";
import { AssumptionComment } from "@/lib/models/assumptionComment";
import { BlockEditor } from "@/components/block-editor";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AssumptionCommentEditorProps {
  assumptionComment?: AssumptionComment;
  onSubmit: (body: Block[]) => void;
  className: string;
}

export function AssumptionCommentEditor({ assumptionComment, onSubmit, ...props }: AssumptionCommentEditorProps) {
  const [body, setBody] = useState<Block[]>(assumptionComment?.body ?? []);
  const [editorKey, setEditorKey] = useState(0);

  const handleSubmit = () => {
    const temp = body;
    setBody([]);
    setEditorKey((k) => k + 1);
    onSubmit(temp);
  };

  return (
    <div className="flex flex-col gap-4 min-h-64">
      <BlockEditor
        key={editorKey}
        initialContent={assumptionComment?.body}
        editable={true}
        onValueChange={setBody}
        {...props}
      />
      <div className="text-right">
        <Button onClick={handleSubmit}>Comment</Button>
      </div>
    </div>
  );
}
