import { Project, ProjectDecisionCounts } from "@/lib/models/project";
import { ProjectPreviewItem } from "@/components/project-preview-item";
import { ProjectService } from "@/lib/services/projectService";

type ProjectPreviewListProps = {
  projects: Project<"with-creator">[];
};

export async function ProjectPreviewList({ projects }: ProjectPreviewListProps) {
  const decisionCounts =
    projects.length > 0 ? await ProjectService.getProjectDecisionCountsForAccount(projects[0].accountId) : [];
  const decisionCountsIndex = decisionCounts.reduce<Record<string, ProjectDecisionCounts>>(
    (acc, counts) => ((acc[counts.projectId] = counts), acc),
    {}
  );

  const items = projects.map((project) => (
    <ProjectPreviewItem key={project.id} project={project} counts={decisionCountsIndex[project.id]} />
  ));

  return <div className="grid md:grid-cols-2 grid-cols-1 gap-4">{items}</div>;
}
