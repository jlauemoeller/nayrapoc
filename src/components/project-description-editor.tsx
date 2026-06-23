"use client";

import type { Block } from "@blocknote/core";
import { BlockEditor } from "@/components/block-editor";
import { Project } from "@/lib/models/project";
import { toast } from "sonner";
import { updateProject } from "@/lib/actions/project";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type ProjectRationaleEditorProps = {
  project: Project;
  editable: boolean;
};

export function ProjectDescriptionEditor({ project, ...props }: ProjectRationaleEditorProps) {
  const debouncedSave = useDebouncedCallback((changed: Block[]) => {
    updateProject(project.id, { description: changed }).then((result) => {
      if (!result.success) {
        toast.error(<span className="text-destructive">Could not save description</span>, {
          position: "top-center"
        });
      }
    });
  }, 300);

  return <BlockEditor onValueChange={debouncedSave} initialContent={project.description} {...props} />;
}
