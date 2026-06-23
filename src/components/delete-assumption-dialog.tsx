"use client";

import { Assumption } from "@/lib/models/assumption";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DeleteIcon } from "@/components/icons";
import { deleteAssumption } from "@/lib/actions/assumption";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type DeleteAssumptionDialogProps = {
  assumption: Assumption;
};

export function DeleteAssumptionDialog({ assumption }: DeleteAssumptionDialogProps) {
  const router = useRouter();
  const handleDelete = async () => {
    const result = await deleteAssumption(assumption.id);

    if (!result.success) {
      toast.error("Could not delete the decision");
    } else {
      router.push(`/decisions/${assumption.decisionId}`);
    }
  };

  return (
    <ConfirmationDialog
      title="Delete Assumption?"
      triggerIcon={<DeleteIcon />}
      triggerLabel="Delete"
      onConfirm={handleDelete}
      content={
        <>
          <span>
            This will permanently delete the decision <b>{assumption.title}</b>.
          </span>
          <span>The action cannot be undone.</span>
        </>
      }
    />
  );
}
