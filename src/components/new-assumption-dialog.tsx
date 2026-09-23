"use client";

import { Assumption } from "@/lib/models/assumption";
import { Decision } from "@/lib/models/decision";
import { NewAssumptionForm } from "@/components/new-assumption-form";
import { NewItemDialog } from "@/components/new-item-dialog";
import { useRouter } from "next/navigation";
import { ButtonSize, ButtonVariant } from "@/components/ui/button";

type NewAssumptionDialogProps = {
  decision: Decision;
  buttonSize?: ButtonSize;
  buttonVariant?: ButtonVariant;
};

export function NewAssumptionDialog({ decision, buttonSize, buttonVariant }: NewAssumptionDialogProps) {
  const router = useRouter();

  return (
    <NewItemDialog<Assumption>
      triggerLabel="Add assumption"
      description={`Add a new assumption for the decision "${decision.title}"`}
      buttonSize={buttonSize}
      buttonVariant={buttonVariant}
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
