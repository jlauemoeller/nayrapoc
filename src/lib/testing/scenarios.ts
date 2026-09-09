import type { DbConnection } from "@lib/db/connection";
import {
  createAssumption,
  createAssumptionComment,
  createDecision,
  createProject,
  createUser,
  createUserWithAccount
} from "@lib/testing/factories";

// Scenarios compose factories into a ready-made graph of related records, so a test
// can start from a known world and only spell out what makes it different.
//
// Factories stay one-record-each; scenarios are where the wiring lives.

// ---------------------------------------------------------------------------
// Decision → assumption → comments
//
// One account with two users: `user` creates everything, `resolver` resolves
// the second comment. Comment timestamps are fixed so ordering is deterministic:
// `unresolvedComment` (2026-01-01) is older than `resolvedComment` (2026-02-01).
// ---------------------------------------------------------------------------

export async function buildDecisionWithAssumptionAndCommentsScenario(db: DbConnection) {
  const { user, account } = await createUserWithAccount(db);
  const resolver = await createUser(db, { account_id: account.id });
  const project = await createProject(db, account.id, user.id);
  const decision = await createDecision(db, project.id, user.id);
  const assumption = await createAssumption(db, decision.id, user.id);

  const unresolvedComment = await createAssumptionComment(db, assumption.id, user.id, {
    created_at: new Date("2026-01-01")
  });
  const resolvedComment = await createAssumptionComment(db, assumption.id, user.id, {
    created_at: new Date("2026-02-01"),
    resolver_id: resolver.id,
    resolved_at: new Date("2026-02-02")
  });

  return { user, account, resolver, project, decision, assumption, unresolvedComment, resolvedComment };
}
