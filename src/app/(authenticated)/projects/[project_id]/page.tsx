import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { DecisionPreviewList } from "@/components/decision-preview-list";
import { DecisionService } from "@/lib/services/decisionService";
import { AddIcon, DecisionIcon, DeleteIcon } from "@/components/icons";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { PageTitle } from "@/components/page-title";
import { ProjectDescriptionEditor } from "@/components/project-description-editor";
import { ProjectService } from "@/lib/services/projectService";
import { ProjectTitleEditor } from "@/components/project-title-editor";
import { RelativeTimeCard } from "@/components/ui/relative-time-card";
import { canViewProject, canUpdateProject, canDeleteProject } from "@/lib/policies/project";
import { currentUser, assertAuthorized } from "@/lib/authorization";
import { notFound } from "next/navigation";
import { DecisionTable } from "@/components/decision-table";
import { NewDecisionDialog } from "@/components/new-decision-dialog";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import z from "zod";

type ProjectPageParams = {
  params: Promise<{ project_id: string }>;
  searchParams: Promise<{ page: string }>;
};

const DECISIONS_PER_PAGE = 10;

const pageSchema = z.coerce.number().int().min(1).catch(1);

export default async function ProjectPage({ params, searchParams }: ProjectPageParams) {
  const { project_id } = await params;
  const { page } = await searchParams;

  const project = await ProjectService.getWithCreator(project_id);

  if (!project) {
    notFound();
  }

  const actor = await currentUser();
  assertAuthorized(canViewProject, actor, project);

  const editable = canUpdateProject(actor, project);
  const breadcrumbs = [{ name: "Projects", link: `/projects` }];
  const decisionsToReview = await DecisionService.listNeedsReviewWithCreatorForProject(project.id);
  const totalDecisions = await DecisionService.count(project.id);

  const pageNumber = pageSchema.parse(page);
  const decisionsPlusOne = await DecisionService.paginateWithCreatorForProject(
    project.id,
    DECISIONS_PER_PAGE + 1,
    (pageNumber - 1) * DECISIONS_PER_PAGE
  );

  const hasNextPage = decisionsPlusOne.length > DECISIONS_PER_PAGE;
  const decisions = hasNextPage ? decisionsPlusOne.slice(0, decisionsPlusOne.length - 1) : decisionsPlusOne;

  return (
    <div className="container mx-auto pb-4 flex flex-col gap-8">
      <div>
        <Breadcrumbs path={breadcrumbs} page="Project" className="mb-6" />
        <PageTitle
          title={<ProjectTitleEditor project={project} editable={editable} />}
          actions={
            canDeleteProject(actor, project) ?
              <DeleteProjectDialog project={project} buttonSize="sm" />
            : <Button variant="destructive" size="sm" disabled>
                <DeleteIcon /> Delete
              </Button>
          }
        ></PageTitle>
        <div className="text-xs text-muted-foreground">
          Created <RelativeTimeCard className="text-xs text-muted-foreground" date={project.createdAt} /> by{" "}
          {project.creator.firstName} {project.creator.lastName}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3>Description</h3>
        <div className="flex md:flex-row flex-col gap-12">
          <div className="grow">
            <ProjectDescriptionEditor project={project} editable={editable} />
          </div>
        </div>
      </div>
      {decisionsToReview.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          <h3>Decisions Marked for Review</h3>
          <DecisionPreviewList decisions={decisionsToReview} />
        </div>
      )}
      <div>
        <div className="flex flex-row justify-between mb-2 gap-4">
          <h3>Decisions</h3>
          {decisions.length > 0 && addButton(editable, project.id)}
        </div>
        {decisions.length === 0 ?
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <DecisionIcon />
              </EmptyMedia>
              <EmptyTitle>No Decisions Yet</EmptyTitle>
              <EmptyDescription>Get started by adding your first decision.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{addButton(editable, project.id)}</EmptyContent>
          </Empty>
        : <DecisionTable decisions={decisions} total={totalDecisions} page={pageNumber} hasNextPage={hasNextPage} />}
      </div>
    </div>
  );
}

function addButton(editable: boolean, projectId: string) {
  return editable ?
      <NewDecisionDialog projectId={projectId} buttonSize="sm" buttonVariant="default" />
    : <Button disabled size="sm">
        <AddIcon /> Add decision
      </Button>;
}
