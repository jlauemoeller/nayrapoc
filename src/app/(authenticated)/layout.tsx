import { AppSidebar } from "@/components/app-sidebar";
import { ProjectService } from "@/lib/services/projectService";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { canListProjects, canCreateProject } from "@/lib/policies/project";
import { currentUser } from "@/lib/authorization";

export default async function Layout({ children, header }: { children: React.ReactNode; header: React.ReactNode }) {
  const actor = await currentUser();

  const projects = canListProjects(actor, actor.accountId) ? await ProjectService.listForAccount(actor.accountId) : [];
  const canCreateProjectsForAccount = canCreateProject(actor, actor.accountId);

  return (
    <SidebarProvider>
      <AppSidebar accountId={actor.accountId} projects={projects} canCreateProjects={canCreateProjectsForAccount} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2" />
            {header}
          </div>
        </header>
        <main className="flex-1 m-8 mt-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
