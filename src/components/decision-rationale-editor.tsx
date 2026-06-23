"use client";

import type { Block } from "@blocknote/core";
import { BlockEditor } from "@/components/block-editor";
import { Decision } from "@/lib/models/decision";
import { toast } from "sonner";
import { updateDecisionRationale } from "@/lib/actions/decision";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type DecisionRationaleEditorProps = {
  decision: Decision;
  editable: boolean;
};

export function DecisionRationaleEditor({ decision, ...props }: DecisionRationaleEditorProps) {
  const debouncedSave = useDebouncedCallback((changed: Block[]) => {
    updateDecisionRationale(decision.id, changed).then((result) => {
      if (!result.success) {
        toast.error(<span className="text-destructive">Could not save rationale</span>, {
          position: "top-center"
        });
      }
    });
  }, 300);

  return <BlockEditor onValueChange={debouncedSave} initialContent={decision.rationale} {...props} />;
}
