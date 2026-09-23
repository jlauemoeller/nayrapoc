"use client";

import { Assumption } from "@/lib/models/assumption";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DeleteIcon } from "@/components/icons";
import { deleteAssumption } from "@/lib/actions/assumption";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ButtonSize } from "@/components/ui/button";

type DeleteAssumptionDialogProps = {
  assumption: Assumption;
  buttonSize?: ButtonSize;
};

export function DeleteAssumptionDialog({ assumption, buttonSize }: DeleteAssumptionDialogProps) {
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
      buttonSize={buttonSize}
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
