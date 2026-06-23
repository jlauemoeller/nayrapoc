"use client";

import { Button } from "@/components/ui/button";
import { ClearIcon } from "@/components/icons";
import { DatePicker } from "@/components/date-picker";
import { Decision } from "@/lib/models/decision";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateDecision } from "@/lib/actions/decision";
import { useRouter } from "next/navigation";

type DecisionReviewByEditorProps = {
  editable: boolean;
  decision: Decision;
};

export function DecisionReviewByEditor({ editable, decision }: DecisionReviewByEditorProps) {
  const router = useRouter();

  const changeHandler = (changed: Date | undefined | null) => {
    updateDecision(decision.id, { reviewBy: changed }).then((result) => {
      if (result.success) {
        // Perform a simple full refresh here to force other component to reload the decision we
        // just updated. We choose this simplistic approach in this POC in order not to complicate
        // matters unnecessarily -- other options would have been to use useState from a common
        // client root component (which we don't really have here), bake a revalidatePath into
        // the action (but that couples the action to the page from which it was called, which
        // is not ideal), or go full tilt and take advantage of Next 16's "use cache" with
        // cacheTag and revalidateTag - probably the best option overall.
        router.refresh();
      } else {
        toast.error(<span className="text-destructive">Could not update decision</span>, {
          position: "top-center"
        });
      }
    });
  };

  const formatted = decision.reviewBy ? format(decision.reviewBy, "PPP") : "";

  return (
    <div className="flex flex-row gap-1 items-center">
      {editable && !decision.reviewBy && (
        <DatePicker value={decision.reviewBy} onValueChange={changeHandler} label="Set review deadline" />
      )}
      {editable && decision.reviewBy && (
        <div className="flex flex-row gap-2 items-center">
          Review by <DatePicker value={decision.reviewBy} onValueChange={changeHandler} label="Change" />
          <Button
            variant="secondary"
            onClick={() => {
              changeHandler(null);
            }}
          >
            <ClearIcon />
          </Button>
        </div>
      )}
      {!editable && !decision.reviewBy && <span>No review date set</span>}
      {!editable && decision.reviewBy && <span>{formatted}</span>}
    </div>
  );
}
