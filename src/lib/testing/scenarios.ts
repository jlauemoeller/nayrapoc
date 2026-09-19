import type { DbConnection } from "@lib/db/connection";
import {
  createAccount,
  createAssumption,
  createAssumptionComment,
  createDecision,
  createProject,
  createUser
} from "@lib/testing/factories";
import { AccountRecord, NewAccountRecord } from "../models/account";
import { UserRecord, NewUserRecord } from "../models/user";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// User + Account factory (handles the circular FK)
// Creates the user first (account_id = null), then the account, then links them.
// ---------------------------------------------------------------------------

export async function createUserWithAccountScenario(
  db: DbConnection,
  userOverrides: Partial<NewUserRecord> = {},
  accountOverrides: Partial<NewAccountRecord> = {}
): Promise<{ user: UserRecord; account: AccountRecord }> {
  const user = await createUser(db, userOverrides);
  const account = await createAccount(db, user.id, accountOverrides);
  const [linkedUser] = await db.update(users).set({ account_id: account.id }).where(eq(users.id, user.id)).returning();
  return { user: linkedUser, account };
}

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

export async function createDecisionWithAssumptionAndCommentsScenario(db: DbConnection) {
  const { user, account } = await createUserWithAccountScenario(db);
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

export async function createDecisionWithProjectScenario(db: DbConnection) {
  const { user, account } = await createUserWithAccountScenario(db);
  const project = await createProject(db, account.id, user.id);
  const decision = await createDecision(db, project.id, user.id);
  return { user, account, project, decision };
}
