import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { DecisionPreviewList } from "@/components/decision-preview-list";
import { DecisionService } from "@/lib/services/decisionService";
import { DeleteIcon } from "@/components/icons";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { PageTitle } from "@/components/page-title";
import { ProjectDecisionsTimeline } from "@/components/project-decisions-timeline";
import { ProjectDescriptionEditor } from "@/components/project-description-editor";
import { ProjectService } from "@/lib/services/projectService";
import { ProjectTitleEditor } from "@/components/project-title-editor";
import { RelativeTimeCard } from "@/components/ui/relative-time-card";
import { canViewProject, canUpdateProject, canDeleteProject } from "@/lib/policies/project";
import { currentUser, assertAuthorized } from "@/lib/authorization";
import { notFound } from "next/navigation";

type ProjectPageParams = {
  params: Promise<{ project_id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageParams) {
  const { project_id } = await params;
  const project = await ProjectService.getWithCreator(project_id);

  if (!project) {
    notFound();
  }

  const actor = await currentUser();
  assertAuthorized(canViewProject, actor, project);

  const editable = canUpdateProject(actor, project);
  const breadcrumbs = [{ name: "Projects", link: `/projects` }];
  const decisions = await DecisionService.listWithProjectAndCreatorForProject(project.id);
  const decisionsToReview = decisions.filter((decision) => decision.reviewBy);

  return (
    <div className="container mx-auto pb-4 flex flex-col">
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-4">
        <Breadcrumbs path={breadcrumbs} page="Project" className="mb-6" />
        <div className="flex flex-row items-center gap-4">
          {canDeleteProject(actor, project) ?
            <DeleteProjectDialog project={project} />
          : <Button variant="destructive" disabled>
              <DeleteIcon /> Delete
            </Button>
          }
        </div>
      </div>
      <PageTitle title={<ProjectTitleEditor project={project} editable={editable} />}></PageTitle>
      <div className="text-xs text-muted-foreground">
        Created <RelativeTimeCard className="text-xs text-muted-foreground" date={project.createdAt} /> by{" "}
        {project.creator.firstName} {project.creator.lastName}
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <h3>Decisions to review</h3>
        {decisionsToReview.length > 0 ?
          <DecisionPreviewList
            projectId={project.id}
            decisions={decisionsToReview}
            editable={false}
            hideAddButton={true}
          />
        : <div>🎉 Nothing to do - you are up to date on everything.</div>}
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <h3>Description</h3>
        <div className="flex md:flex-row flex-col gap-12">
          <div className="grow">
            <ProjectDescriptionEditor project={project} editable={editable} />
          </div>
          <ProjectDecisionsTimeline project={project} decisions={decisions} editable={editable} />
        </div>
      </div>
    </div>
  );
}
