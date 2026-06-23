import { PageTitle } from "@/components/page-title";
import { ProjectPreviewList } from "@/components/project-preview-list";
import { ProjectService } from "@/lib/services/projectService";
import { canCreateProject, canListProjects } from "@/lib/policies/project";
import { currentUser, assertAuthorized } from "@/lib/authorization";

export default async function ProjectsPage() {
  const actor = await currentUser();
  assertAuthorized(canListProjects, actor, actor.accountId);

  const projects = await ProjectService.listWithCreatorForAccount(actor.accountId);
  const editable = canCreateProject(actor, actor.accountId);

  return (
    <div className="container mx-auto py-4 flex flex-col gap-4">
      <PageTitle title="Projects" hint="Know your future by understanding your past"></PageTitle>
      <ProjectPreviewList accountId={actor.accountId} projects={projects} editable={editable} />
    </div>
  );
}
