"use client";

import type { Block } from "@blocknote/core";
import { Assumption } from "@/lib/models/assumption";
import { BlockEditor } from "@/components/block-editor";
import { toast } from "sonner";
import { updateAssumptionRationale } from "@/lib/actions/assumption";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type AssumptionRationaleEditorProps = {
  assumption: Assumption;
  editable: boolean;
};

export function AssumptionRationaleEditor({ assumption, ...props }: AssumptionRationaleEditorProps) {
  const debouncedSave = useDebouncedCallback((changed: Block[]) => {
    updateAssumptionRationale(assumption.id, changed).then((result) => {
      if (!result.success) {
        toast.error(<span className="text-destructive">Could not update assumption</span>, {
          position: "top-center"
        });
      }
    });
  }, 300);

  return <BlockEditor onValueChange={debouncedSave} initialContent={assumption.rationale} {...props} />;
}
