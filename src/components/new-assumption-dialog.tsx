"use client";

import { Assumption } from "@/lib/models/assumption";
import { Decision } from "@/lib/models/decision";
import { NewAssumptionForm } from "@/components/new-assumption-form";
import { NewItemDialog } from "@/components/new-item-dialog";
import { useRouter } from "next/navigation";

type NewAssumptionDialogProps = {
  decision: Decision;
};

export function NewAssumptionDialog({ decision }: NewAssumptionDialogProps) {
  const router = useRouter();

  return (
    <NewItemDialog<Assumption>
      triggerLabel="Add assumption"
      description={`Add a new assumption for the decision "${decision.title}"`}
      onSuccess={(a) => router.push(`/assumptions/${a.id}`)}
    >
      {({ formId, onSubmittingChange, onSuccess }) => (
        <NewAssumptionForm
          id={formId}
          decisionId={decision.id}
          onSubmittingChange={onSubmittingChange}
          onSuccess={onSuccess}
        />
      )}
    </NewItemDialog>
  );
}
