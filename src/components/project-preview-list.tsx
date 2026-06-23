import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { Project, ProjectDecisionCounts } from "@/lib/models/project";
import { ProjectIcon, AddIcon } from "@/components/icons";
import { ProjectPreviewItem } from "@/components/project-preview-item";
import { ProjectService } from "@/lib/services/projectService";

type ProjectPreviewListProps = {
  accountId: string;
  projects: Project<"with-creator">[];
  editable: boolean;
};

export async function ProjectPreviewList({ accountId, projects, editable }: ProjectPreviewListProps) {
  const decisionCounts = await ProjectService.getProjectDecisionCountsForAccount(accountId);
  const decisionCountsIndex = decisionCounts.reduce<Record<string, ProjectDecisionCounts>>(
    (acc, counts) => ((acc[counts.projectId] = counts), acc),
    {}
  );

  const items = projects.map((project) => (
    <ProjectPreviewItem key={project.id} project={project} counts={decisionCountsIndex[project.id]} />
  ));

  return projects.length > 0 ?
      <div className="flex flex-col gap-4">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">{items}</div>
        <div className="flex flex-row justify-start mt-4">
          {editable ?
            <NewProjectDialog accountId={accountId} />
          : <Button disabled>
              <AddIcon /> Add project
            </Button>
          }
        </div>
      </div>
    : <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ProjectIcon />
          </EmptyMedia>
          <EmptyTitle>No Projects Yet</EmptyTitle>
          <EmptyDescription>Get started by adding your first project.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {editable ?
            <NewProjectDialog accountId={accountId} />
          : <Button disabled>
              <AddIcon /> Add project
            </Button>
          }
        </EmptyContent>
      </Empty>;
}
