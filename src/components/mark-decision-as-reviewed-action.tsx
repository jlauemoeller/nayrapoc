"use client";

import { Button } from "@/components/ui/button";
import { Decision } from "@/lib/models/decision";
import { toast } from "sonner";
import { updateDecision } from "@/lib/actions/decision";
import { useRouter } from "next/navigation";

type MarkDecisionAsReviewedActionProps = {
  editable: boolean;
  decision: Decision;
};

export function MarkDecisionAsReviewedAction({ editable, decision }: MarkDecisionAsReviewedActionProps) {
  const router = useRouter();

  const changeHandler = () => {
    updateDecision(decision.id, { reviewedAt: new Date(), reviewBy: null }).then((result) => {
      if (result.success) {
        // Perform a simple full refresh here to force other component to reload the decision we
        // just updated. We choose this simplistic approach in this POC in order not to complicate
        // matters unnecessarily --real project should take advantage of Next 16's "use cache" with
        // cacheTag and revalidateTag
        router.refresh();
      } else {
        toast.error(<span className="text-destructive">Could not update decision</span>, {
          position: "top-center"
        });
      }
    });
  };

  return (
    <Button onClick={changeHandler} disabled={!editable}>
      Mark as reviewed
    </Button>
  );
}
