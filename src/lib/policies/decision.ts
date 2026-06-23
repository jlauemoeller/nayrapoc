import { Decision } from "@/lib/models/decision";
import { Project } from "@/lib/models/project";
import { SessionUser } from "@/lib/models/user";
import { hasRole, isTenant } from "@/lib/policies/policy";

export function canListDecisions(actor: SessionUser, project: Project): boolean {
  return isTenant(actor, project.accountId) && hasRole(actor, ["admin", "owner", "member"]);
}

export function canViewDecision(actor: SessionUser, decision: Decision<"with-project">): boolean {
  return isTenant(actor, decision.project.accountId) && hasRole(actor, ["admin", "owner", "member"]);
}

export function canCreateDecision(actor: SessionUser, project: Project): boolean {
  return isTenant(actor, project.accountId) && hasRole(actor, ["admin", "owner"]);
}

export function canUpdateDecision(actor: SessionUser, decision: Decision<"with-project">): boolean {
  return isTenant(actor, decision.project.accountId) && hasRole(actor, ["admin", "owner"]);
}

export function canDeleteDecision(actor: SessionUser, decision: Decision<"with-project">): boolean {
  return isTenant(actor, decision.project.accountId) && hasRole(actor, ["admin", "owner"]);
}
