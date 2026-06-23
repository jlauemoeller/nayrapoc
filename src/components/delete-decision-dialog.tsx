"use client";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Decision } from "@/lib/models/decision";
import { DeleteIcon } from "@/components/icons";
import { deleteDecision } from "@/lib/actions/decision";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type DeleteDecisionDialogProps = {
  decision: Decision;
};

export function DeleteDecisionDialog({ decision }: DeleteDecisionDialogProps) {
  const router = useRouter();
  const handleDelete = async () => {
    const result = await deleteDecision(decision.id);

    if (!result.success) {
      toast.error("Could not delete the decision");
    } else {
      router.push(`/projects/${decision.projectId}`);
    }
  };

  return (
    <ConfirmationDialog
      title="Delete Decision?"
      triggerIcon={<DeleteIcon />}
      triggerLabel="Delete"
      onConfirm={handleDelete}
      content={
        <>
          <span>
            This will permanently delete the decision <b>{decision.title}</b>.
          </span>
          <span>The action cannot be undone.</span>
        </>
      }
    />
  );
}
