"use client";

import { PageTitleEditor } from "@/components/page-title-editor";
import { Assumption } from "@/lib/models/assumption";
import { updateAssumption } from "@/lib/actions/assumption";
import { toast } from "sonner";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type AssumptionTitleEditorProps = {
  editable: boolean;
  assumption: Assumption;
};

export function AssumptionTitleEditor({ editable, assumption }: AssumptionTitleEditorProps) {
  const debouncedSave = useDebouncedCallback((changed: string) => {
    updateAssumption(assumption.id, { title: changed }).then((result) => {
      if (!result.success) {
        toast.error(<span className="text-destructive">Could not update assumption</span>, {
          position: "top-center"
        });
      }
    });
  }, 300);

  return <PageTitleEditor defaultValue={assumption.title} editable={editable} onSubmit={debouncedSave} />;
}
