import { Project } from "@/lib/models/project";
import { SessionUser } from "@/lib/models/user";
import { hasRole, isTenant } from "@/lib/policies/policy";

export function canListProjects(actor: SessionUser, accountId: string): boolean {
  return isTenant(actor, accountId) && hasRole(actor, ["admin", "owner", "member"]);
}

export function canViewProject(actor: SessionUser, project: Project): boolean {
  return isTenant(actor, project.accountId) && hasRole(actor, ["admin", "owner", "member"]);
}

export function canCreateProject(actor: SessionUser, accountId: string): boolean {
  return isTenant(actor, accountId) && hasRole(actor, ["admin", "owner"]);
}

export function canUpdateProject(actor: SessionUser, project: Project): boolean {
  return isTenant(actor, project.accountId) && hasRole(actor, ["admin", "owner"]);
}

export function canDeleteProject(actor: SessionUser, project: Project): boolean {
  return isTenant(actor, project.accountId) && hasRole(actor, ["admin", "owner"]);
}
