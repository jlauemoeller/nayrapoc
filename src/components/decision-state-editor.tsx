"use client";

import { Decision, DecisionState } from "@/lib/models/decision";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { updateDecision } from "@/lib/actions/decision";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type DecisionStateEditorProps = {
  editable: boolean;
  decision: Decision;
};

export function DecisionStateEditor({ editable, decision }: DecisionStateEditorProps) {
  const router = useRouter();

  const changeHandler = (changed: DecisionState) => {
    updateDecision(decision.id, { state: changed }).then((result) => {
      if (result.success) {
        // Perform a simple full refresh here to force other componentis to reload the decision we
        // just updated. We choose this simplistic approach in this POC in order not to complicate
        // matters unnecessarily -- real project should take advantage of Next 16's "use cache" with
        // cacheTag and revalidateTag.
        router.refresh();
      } else {
        toast.error(<span className="text-destructive">Could not update decision</span>, {
          position: "top-center"
        });
      }
    });
  };

  return (
    <Select onValueChange={changeHandler} value={decision.state} disabled={!editable}>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Select a state" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Decision Status</SelectLabel>
          <SelectItem value="proposed">Proposed</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="retired">Retired</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
