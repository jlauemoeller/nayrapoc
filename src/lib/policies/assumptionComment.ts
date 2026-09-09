import { AssumptionComment } from "@/lib/models/assumptionComment";
import { Assumption } from "@/lib/models/assumption";
import { SessionUser } from "@/lib/models/user";
import { hasRole, isTenant } from "@/lib/policies/policy";

export function canListAssumptionComments(
  actor: SessionUser,
  assumption: Assumption<"with-decision-and-project">
): boolean {
  return isTenant(actor, assumption.decision.project.accountId) && hasRole(actor, ["admin", "owner", "member"]);
}

export function canViewAssumptionComment(
  actor: SessionUser,
  assumption: Assumption<"with-decision-and-project">
): boolean {
  return isTenant(actor, assumption.decision.project.accountId) && hasRole(actor, ["admin", "owner", "member"]);
}

export function canCreateAssumptionComment(
  actor: SessionUser,
  assumption: Assumption<"with-decision-and-project">
): boolean {
  return isTenant(actor, assumption.decision.project.accountId) && hasRole(actor, ["admin", "owner"]);
}

export function canUpdateAssumptionComment(
  actor: SessionUser,
  assumption: Assumption<"with-decision-and-project">,
  assumptionComment: AssumptionComment
): boolean {
  return (
    isTenant(actor, assumption.decision.project.accountId) &&
    hasRole(actor, ["admin", "owner", "member"]) &&
    isRelated(assumption, assumptionComment) &&
    isCreator(actor, assumptionComment)
  );
}

export function canDeleteAssumptionComment(
  actor: SessionUser,
  assumption: Assumption<"with-decision-and-project">,
  assumptionComment: AssumptionComment
): boolean {
  return (
    isTenant(actor, assumption.decision.project.accountId) &&
    hasRole(actor, ["admin", "owner", "member"]) &&
    isRelated(assumption, assumptionComment) &&
    isCreator(actor, assumptionComment)
  );
}

function isRelated({ id }: Assumption, { assumptionId }: AssumptionComment): boolean {
  return id === assumptionId;
}

function isCreator({ id }: SessionUser, { creatorId }: AssumptionComment): boolean {
  return id === creatorId;
}
