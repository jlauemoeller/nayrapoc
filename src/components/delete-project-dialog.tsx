"use client";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DeleteIcon } from "@/components/icons";
import { Project } from "@/lib/models/project";
import { deleteProject } from "@/lib/actions/project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type DeleteProjectDialogProps = {
  project: Project;
};

export function DeleteProjectDialog({ project }: DeleteProjectDialogProps) {
  const router = useRouter();
  const handleDelete = async () => {
    const result = await deleteProject(project.id);

    if (!result.success) {
      toast.error("Could not delete the project");
    } else {
      router.push(`/projects`);
    }
  };

  return (
    <ConfirmationDialog
      title="Delete Project?"
      triggerIcon={<DeleteIcon />}
      triggerLabel="Delete"
      onConfirm={handleDelete}
      content={
        <>
          <span>
            This will permanently delete the project <b>{project.name}</b> and all decisions.
          </span>
          <span>The action cannot be undone.</span>
        </>
      }
    />
  );
}
