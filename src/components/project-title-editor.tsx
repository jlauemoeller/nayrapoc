"use client";

import { PageTitleEditor } from "@/components/page-title-editor";
import { Project } from "@/lib/models/project";
import { toast } from "sonner";
import { updateProject } from "@/lib/actions/project";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

type ProjectTitleEditorProps = {
  editable: boolean;
  project: Project;
};

export function ProjectTitleEditor({ editable, project }: ProjectTitleEditorProps) {
  const debouncedSave = useDebouncedCallback((changed: string) => {
    updateProject(project.id, { name: changed }).then((result) => {
      if (!result.success) {
        toast.error(<span className="text-destructive">Could not update project name</span>, {
          position: "top-center"
        });
      }
    });
  }, 300);

  return <PageTitleEditor defaultValue={project.name} editable={editable} onSubmit={debouncedSave} />;
}
