"use client";

import { Assumption } from "@/lib/models/assumption";
import { ConfidenceView } from "@/components/confidence-view";
import { toast } from "sonner";
import { updateAssumption } from "@/lib/actions/assumption";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type AssumptionConfidenceEditorProps = Omit<React.ComponentProps<typeof ConfidenceView>, "value"> & {
  assumption: Assumption;
};

export function AssumptionConfidenceEditor({ editable, assumption, ...rest }: AssumptionConfidenceEditorProps) {
  const debouncedSave = useDebouncedCallback((changed: number) => {
    updateAssumption(assumption.id, { confidence: changed }).then((result) => {
      if (!result.success) {
        toast.error(<span className="text-destructive">Could not update assumption</span>, {
          position: "top-center"
        });
      }
    });
  }, 300);

  return (
    <ConfidenceView value={assumption.confidence ?? 0} onValueChange={debouncedSave} editable={editable} {...rest} />
  );
}
