import { Assumption } from "@/lib/models/assumption";
import { Decision } from "@/lib/models/decision";
import { SessionUser } from "@/lib/models/user";
import { hasRole, isTenant } from "@/lib/policies/policy";

export function canListAssumptions(actor: SessionUser, decision: Decision<"with-project">): boolean {
  return isTenant(actor, decision.project.accountId) && hasRole(actor, ["admin", "owner", "member"]);
}

export function canViewAssumption(actor: SessionUser, assumption: Assumption<"with-decision-and-project">): boolean {
  return isTenant(actor, assumption.decision.project.accountId) && hasRole(actor, ["admin", "owner", "member"]);
}

export function canCreateAssumption(actor: SessionUser, decision: Decision<"with-project">): boolean {
  return isTenant(actor, decision.project.accountId) && hasRole(actor, ["admin", "owner"]);
}

export function canUpdateAssumption(actor: SessionUser, assumption: Assumption<"with-decision-and-project">): boolean {
  return isTenant(actor, assumption.decision.project.accountId) && hasRole(actor, ["admin", "owner"]);
}

export function canDeleteAssumption(actor: SessionUser, assumption: Assumption<"with-decision-and-project">): boolean {
  return isTenant(actor, assumption.decision.project.accountId) && hasRole(actor, ["admin", "owner"]);
}
