"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "./new-project-dialog";
import { Project } from "@/lib/models/project";
import { ProjectIcon, ProjectsIcon, TeamIcon, LogoutIcon, AddIcon } from "./icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader
} from "@/components/ui/sidebar";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

type AppSidebarProps = {
  accountId: string;
  projects: Project[];
  canCreateProjects: boolean;
};

export function AppSidebar({ accountId, projects, canCreateProjects }: AppSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return !!pathname.match(`^.*/${path}$`);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/">
          <span className="block text-3xl p-2">nayra</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("projects")}>
                  <Link href="/projects">
                    <ProjectsIcon />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("users")}>
                  <Link href="/users">
                    <TeamIcon />
                    <span>Team</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
          <div className="flex flex-row justify-start mb-2">
            {canCreateProjects ?
              <NewProjectDialog accountId={accountId} buttonSize="sm" buttonVariant="outline" />
            : <Button disabled size="sm" variant="outline">
                <AddIcon />
                Add Project
              </Button>
            }
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {projects.length > 0 ?
                projects.map((project: Project) => {
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton asChild isActive={isActive(project.id)}>
                        <Link href={`/projects/${project.id}`}>
                          <ProjectIcon />
                          <span>{project.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              : <span>Create your first project</span>}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => signOut({ callbackUrl: "/login" })} className="cursor-pointer">
                <LogoutIcon />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
