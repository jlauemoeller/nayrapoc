import { PageTitle } from "@/components/page-title";
import { ProjectPreviewList } from "@/components/project-preview-list";
import { ProjectService } from "@/lib/services/projectService";
import { canCreateProject, canListProjects } from "@/lib/policies/project";
import { currentUser, assertAuthorized } from "@/lib/authorization";
import { AddIcon, ProjectIcon } from "@/components/icons";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

export default async function ProjectsPage() {
  const actor = await currentUser();
  assertAuthorized(canListProjects, actor, actor.accountId);

  const projects = await ProjectService.listWithCreatorForAccount(actor.accountId);
  const editable = canCreateProject(actor, actor.accountId);

  return (
    <div className="container mx-auto py-4 flex flex-col gap-4">
      <PageTitle
        title="Projects"
        actions={
          editable ?
            <NewProjectDialog accountId={actor.accountId} />
          : <Button disabled>
              <AddIcon /> Add project
            </Button>
        }
      ></PageTitle>
      {projects.length > 0 ?
        <ProjectPreviewList projects={projects} />
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
              <NewProjectDialog accountId={actor.accountId} />
            : <Button disabled>
                <AddIcon /> Add project
              </Button>
            }
          </EmptyContent>
        </Empty>
      }
    </div>
  );
}
