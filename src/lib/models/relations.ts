import { AccountRecord, toAccount, type Account } from "@lib/models/account";
import { AssumptionRecord, toAssumption, type Assumption } from "@lib/models/assumption";
import { DecisionRecord, toDecision, type Decision } from "@lib/models/decision";
import { ProjectRecord, toProject, type Project } from "@lib/models/project";
import { UserRecord, toUser, type User } from "@lib/models/user";

export type UserWithAccountResult = { user: UserRecord; account: AccountRecord };
export type AccountWithOwnerResult = { account: AccountRecord; owner: UserRecord };
export type ProjectWithAccountResult = { project: ProjectRecord; account: AccountRecord };
export type ProjectWithCreatorResult = { project: ProjectRecord; creator: UserRecord };
export type DecisionWithProjectResult = { decision: DecisionRecord; project: ProjectRecord };
export type DecisionWithCreatorResult = { decision: DecisionRecord; creator: UserRecord };

export type DecisionWithProjectAndCreatorResult = {
  decision: DecisionRecord;
  project: ProjectRecord;
  creator: UserRecord;
};

export type AssumptionWithDecisionResult = { assumption: AssumptionRecord; decision: DecisionRecord };

export type AssumptionWithDecisionAndProjectResult = {
  assumption: AssumptionRecord;
  decision: DecisionRecord;
  project: ProjectRecord;
};

export type AssumptionWithDecisionAndCreatorResult = {
  assumption: AssumptionRecord;
  decision: DecisionRecord;
  creator: UserRecord;
};

export type AssumptionWithDecisionCreatorAndProjectResult = {
  assumption: AssumptionRecord;
  decision: DecisionRecord;
  project: ProjectRecord;
  creator: UserRecord;
};

export function toUserWithAccount(result: UserWithAccountResult): User<"with-account"> {
  return { ...toUser(result.user), account: toAccount(result.account) };
}

export function toUserWithAccountIfAny(result: UserWithAccountResult | undefined): User<"with-account"> | undefined {
  return result ? toUserWithAccount(result) : undefined;
}

export function toAccountWithOwner(result: AccountWithOwnerResult): Account<"with-owner"> {
  return { ...toAccount(result.account), owner: toUser(result.owner) };
}

export function toAccountWithOwnerIfAny(result: AccountWithOwnerResult | undefined): Account<"with-owner"> | undefined {
  return result ? toAccountWithOwner(result) : undefined;
}

export function toProjectWithAccount(result: ProjectWithAccountResult): Project<"with-account"> {
  return { ...toProject(result.project), account: toAccount(result.account) };
}

export function toProjectWithAccountIfAny(
  result: ProjectWithAccountResult | undefined
): Project<"with-account"> | undefined {
  return result ? toProjectWithAccount(result) : undefined;
}

export function toProjectWithCreator(result: ProjectWithCreatorResult): Project<"with-creator"> {
  return { ...toProject(result.project), creator: toUser(result.creator) };
}

export function toProjectWithCreatorIfAny(
  result: ProjectWithCreatorResult | undefined
): Project<"with-creator"> | undefined {
  return result ? toProjectWithCreator(result) : undefined;
}

export function toDecisionWithProject(result: DecisionWithProjectResult): Decision<"with-project"> {
  return { ...toDecision(result.decision), project: toProject(result.project) };
}

export function toDecisionWithProjectIfAny(
  result: DecisionWithProjectResult | undefined
): Decision<"with-project"> | undefined {
  return result ? toDecisionWithProject(result) : undefined;
}

export function toDecisionWithCreator(result: DecisionWithCreatorResult): Decision<"with-creator"> {
  return { ...toDecision(result.decision), creator: toUser(result.creator) };
}

export function toDecisionWithCreatorIfAny(
  result: DecisionWithCreatorResult | undefined
): Decision<"with-creator"> | undefined {
  return result ? toDecisionWithCreator(result) : undefined;
}

export function toDecisionWithProjectAndCreator(
  result: DecisionWithProjectAndCreatorResult
): Decision<"with-project-and-creator"> {
  return { ...toDecision(result.decision), project: toProject(result.project), creator: toUser(result.creator) };
}

export function toDecisionWithProjectAndCreatorIfAny(
  result: DecisionWithProjectAndCreatorResult | undefined
): Decision<"with-project-and-creator"> | undefined {
  return result ? toDecisionWithProjectAndCreator(result) : undefined;
}

export function toAssumptionWithDecision(result: AssumptionWithDecisionResult): Assumption<"with-decision"> {
  return { ...toAssumption(result.assumption), decision: toDecision(result.decision) };
}

export function toAssumptionWithDecisionIfAny(
  result: AssumptionWithDecisionResult | undefined
): Assumption<"with-decision"> | undefined {
  return result ? toAssumptionWithDecision(result) : undefined;
}

export function toAssumptionWithDecisionAndProject(
  result: AssumptionWithDecisionAndProjectResult
): Assumption<"with-decision-and-project"> {
  return {
    ...toAssumption(result.assumption),
    decision: toDecisionWithProject({ decision: result.decision, project: result.project })
  };
}

export function toAssumptionWithDecisionAndProjectIfAny(
  result: AssumptionWithDecisionAndProjectResult | undefined
): Assumption<"with-decision-and-project"> | undefined {
  return result ? toAssumptionWithDecisionAndProject(result) : undefined;
}

export function toAssumptionWithDecisionAndCreator(
  result: AssumptionWithDecisionAndCreatorResult
): Assumption<"with-decision-and-creator"> {
  return {
    ...toAssumption(result.assumption),
    decision: toDecision(result.decision),
    creator: toUser(result.creator)
  };
}

export function toAssumptionWithDecisionAndCreatorIfAny(
  result: AssumptionWithDecisionAndCreatorResult | undefined
): Assumption<"with-decision-and-creator"> | undefined {
  return result ? toAssumptionWithDecisionAndCreator(result) : undefined;
}

export function toAssumptionWithDecisionCreatorAndProject(
  result: AssumptionWithDecisionCreatorAndProjectResult
): Assumption<"with-decision-creator-and-project"> {
  return {
    ...toAssumption(result.assumption),
    decision: toDecisionWithProject({ decision: result.decision, project: result.project }),
    creator: toUser(result.creator)
  };
}

export function toAssumptionWithDecisionCreatorAndProjectIfAny(
  result: AssumptionWithDecisionCreatorAndProjectResult | undefined
): Assumption<"with-decision-creator-and-project"> | undefined {
  return result ? toAssumptionWithDecisionCreatorAndProject(result) : undefined;
}
