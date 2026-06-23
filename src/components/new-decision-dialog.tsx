"use client";

import { Decision } from "@/lib/models/decision";
import { NewDecisionForm } from "@/components/new-decision-form";
import { NewItemDialog } from "@/components/new-item-dialog";
import { useRouter } from "next/navigation";

type NewDecisionDialogProps = {
  projectId: string;
};

export function NewDecisionDialog({ projectId }: NewDecisionDialogProps) {
  const router = useRouter();

  return (
    <NewItemDialog<Decision>
      triggerLabel="Add decision"
      description="Provide a title for the decision you wish to add"
      onSuccess={(d) => router.push(`/decisions/${d.id}`)}
    >
      {({ formId, onSubmittingChange, onSuccess }) => (
        <NewDecisionForm
          id={formId}
          projectId={projectId}
          onSubmittingChange={onSubmittingChange}
          onSuccess={onSuccess}
        />
      )}
    </NewItemDialog>
  );
}
