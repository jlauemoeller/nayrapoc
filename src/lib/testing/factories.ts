import { users, accounts, projects, decisions, assumptions, assumptionComments } from "@lib/db/schema";
import type { DbConnection } from "@lib/db/connection";
import type { UserRecord, NewUserRecord } from "@lib/models/user";
import type { AccountRecord, NewAccountRecord } from "@lib/models/account";
import type { ProjectRecord, NewProjectRecord } from "@lib/models/project";
import type { DecisionRecord, NewDecisionRecord } from "@lib/models/decision";
import type { AssumptionRecord, NewAssumptionRecord } from "@lib/models/assumption";
import type { AssumptionCommentRecord, NewAssumptionCommentRecord } from "@lib/models/assumptionComment";

let seq = 0;
function next() {
  return ++seq;
}

// ---------------------------------------------------------------------------
// User factory
// ---------------------------------------------------------------------------

export async function createUser(db: DbConnection, overrides: Partial<NewUserRecord> = {}): Promise<UserRecord> {
  const n = next();
  const [user] = await db
    .insert(users)
    .values({
      first_name: "Test",
      last_name: `User${n}`,
      email: `user${n}@test.example`,
      domain: "tenant",
      account_id: null,
      ...overrides
    })
    .returning();
  return user;
}

// ---------------------------------------------------------------------------
// Account factory
// ---------------------------------------------------------------------------

export async function createAccount(
  db: DbConnection,
  ownerId: string,
  overrides: Partial<NewAccountRecord> = {}
): Promise<AccountRecord> {
  const n = next();
  const [account] = await db
    .insert(accounts)
    .values({
      name: `Test Account ${n}`,
      owner_id: ownerId,
      ...overrides
    })
    .returning();
  return account;
}

// ---------------------------------------------------------------------------
// Project factory
// ---------------------------------------------------------------------------

export async function createProject(
  db: DbConnection,
  accountId: string,
  creatorId: string,
  overrides: Partial<NewProjectRecord> = {}
): Promise<ProjectRecord> {
  const n = next();
  const [project] = await db
    .insert(projects)
    .values({
      name: `Test Project ${n}`,
      description: null,
      account_id: accountId,
      creator_id: creatorId,
      ...overrides
    })
    .returning();
  return project;
}

// ---------------------------------------------------------------------------
// Decision factory
// ---------------------------------------------------------------------------

export async function createDecision(
  db: DbConnection,
  projectId: string,
  creatorId: string,
  overrides: Partial<NewDecisionRecord> = {}
): Promise<DecisionRecord> {
  const n = next();
  const [decision] = await db
    .insert(decisions)
    .values({
      title: `Test Decision ${n}`,
      rationale: null,
      project_id: projectId,
      creator_id: creatorId,
      ...overrides
    })
    .returning();
  return decision;
}

// ---------------------------------------------------------------------------
// Assumption factory
// ---------------------------------------------------------------------------

export async function createAssumption(
  db: DbConnection,
  decisionId: string,
  creatorId: string,
  overrides: Partial<NewAssumptionRecord> = {}
): Promise<AssumptionRecord> {
  const n = next();
  const [assumption] = await db
    .insert(assumptions)
    .values({
      title: `Test Assumption ${n}`,
      rationale: null,
      decision_id: decisionId,
      creator_id: creatorId,
      ...overrides
    })
    .returning();
  return assumption;
}

export function buildAssumptionRecord(overrides: Partial<NewAssumptionRecord> = {}): AssumptionRecord {
  const n = next();

  const now = new Date();

  return {
    id: `${n}`,
    title: `Test Assumption ${n}`,
    rationale: null,
    decision_id: `decision-${n}`,
    creator_id: `creator-${n}`,
    created_at: now,
    updated_at: now,
    rationale_updated_at: now,
    rationale_ai_evaluated_at: null,
    rationale_ai_requested_at: null,
    rationale_ai_evaluation: null,
    rationale_ai_rating: null,
    ...overrides
  };
}
// ---------------------------------------------------------------------------
// AssumptionComment factory
// Unresolved by default; pass `{ resolver_id, resolved_at }` in overrides for a resolved one.
// ---------------------------------------------------------------------------

export async function createAssumptionComment(
  db: DbConnection,
  assumptionId: string,
  creatorId: string,
  overrides: Partial<NewAssumptionCommentRecord> = {}
): Promise<AssumptionCommentRecord> {
  const [assumptionComment] = await db
    .insert(assumptionComments)
    .values({
      body: null,
      assumption_id: assumptionId,
      creator_id: creatorId,
      resolver_id: null,
      resolved_at: null,
      ...overrides
    })
    .returning();
  return assumptionComment;
}
