"use client";

import { Decision } from "@/lib/models/decision";
import { PageTitleEditor } from "@/components/page-title-editor";
import { toast } from "sonner";
import { updateDecision } from "@/lib/actions/decision";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type DecisionTitleEditorProps = {
  editable: boolean;
  decision: Decision;
};

export function DecisionTitleEditor({ editable, decision }: DecisionTitleEditorProps) {
  const debouncedSave = useDebouncedCallback((changed: string) => {
    updateDecision(decision.id, { title: changed }).then((result) => {
      if (!result.success) {
        toast.error(<span className="text-destructive">Could not update decision title</span>, {
          position: "top-center"
        });
      }
    });
  }, 300);

  return <PageTitleEditor defaultValue={decision.title} editable={editable} onSubmit={debouncedSave} />;
}
