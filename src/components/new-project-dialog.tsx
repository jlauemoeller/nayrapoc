"use client";

import { ButtonVariant, ButtonSize } from "@/components/ui/button";
import { NewItemDialog } from "@/components/new-item-dialog";
import { NewProjectForm } from "@/components/new-project-form";
import { Project } from "@/lib/models/project";
import { useRouter } from "next/navigation";

type NewProjectDialogProps = {
  accountId: string;
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export function NewProjectDialog({ accountId, buttonSize, buttonVariant }: NewProjectDialogProps) {
  const router = useRouter();

  return (
    <NewItemDialog<Project>
      triggerLabel="Add project"
      description="Add a new project"
      buttonSize={buttonSize}
      buttonVariant={buttonVariant}
      onSuccess={(p) => router.push(`/projects/${p.id}`)}
    >
      {({ formId, onSubmittingChange, onSuccess }) => (
        <NewProjectForm
          id={formId}
          accountId={accountId}
          onSubmittingChange={onSubmittingChange}
          onSuccess={onSuccess}
        />
      )}
    </NewItemDialog>
  );
}
