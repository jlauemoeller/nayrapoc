import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Block } from "@blocknote/core";

// Mock only `currentUser` — there is no HTTP session in the test runner, so the
// real `getServerSession` can't run. `isAuthorized` (and the policies it calls)
// is kept real via `importActual` so the action's authorization gating is
// genuinely exercised against real account data.
vi.mock("@/lib/authorization", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authorization")>("@/lib/authorization");
  return { ...actual, currentUser: vi.fn() };
});

import { currentUser } from "@/lib/authorization";
import { SessionUser, UserRecord } from "@/lib/models/user";
import { AccountRecord } from "@/lib/models/account";
import {
  createAssumptionComment,
  updateAssumptionComment,
  deleteAssumptionComment
} from "@/lib/actions/assumptionComment";
import { AssumptionCommentService } from "@/lib/services/assumptionCommentService";
import { setupTestDb } from "@lib/testing/dbTest";
import {
  createAccount,
  createAssumption,
  createAssumptionComment as seedComment,
  createDecision,
  createProject,
  createUser,
  createUserWithAccount
} from "@lib/testing/factories";

const { db } = setupTestDb();

const sampleBody = [{ type: "paragraph", content: "Looks reasonable" }] as unknown as Block[];

const NONEXISTENT_ID = "00000000-0000-7000-8000-000000000000";

const NOT_AUTHORIZED = { success: false, error: { field: "root", message: "Not authorized" } };

// Build the SessionUser the mocked `currentUser` will return. Defaults to an
// owner in the resource's account (the authorized case); override `accountId`,
// `role` or `id` to construct denial scenarios.
function actorFor(user: UserRecord, account: AccountRecord, overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    domain: "tenant",
    role: "owner",
    accountId: account.id,
    ...overrides
  };
}

function asCurrentUser(actor: SessionUser) {
  vi.mocked(currentUser).mockResolvedValue(actor);
}

// Every action test starts from an account with a project → decision → assumption.
async function seedAssumption() {
  const { user, account } = await createUserWithAccount(db);
  const project = await createProject(db, account.id, user.id);
  const decision = await createDecision(db, project.id, user.id);
  const assumption = await createAssumption(db, decision.id, user.id);
  return { user, account, assumption };
}

beforeEach(() => {
  vi.mocked(currentUser).mockReset();
});

describe("assumption comment actions", () => {
  describe("createAssumptionComment", () => {
    it("creates the comment with the actor as creator and returns it with preloads", async () => {
      const { user, account, assumption } = await seedAssumption();
      asCurrentUser(actorFor(user, account));

      const result = await createAssumptionComment({ assumptionId: assumption.id, body: sampleBody });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assumptionId).toBe(assumption.id);
        expect(result.data.creatorId).toBe(user.id);
        expect(result.data.body).toEqual(sampleBody);
        expect(result.data.creator.id).toBe(user.id);
        expect(result.data.resolver).toBeUndefined();
      }
    });

    it("denies a member (insufficient role)", async () => {
      const { user, account, assumption } = await seedAssumption();
      asCurrentUser(actorFor(user, account, { role: "member" }));

      const result = await createAssumptionComment({ assumptionId: assumption.id, body: sampleBody });

      expect(result).toEqual(NOT_AUTHORIZED);
    });

    it("denies an actor from another account", async () => {
      const { user, account, assumption } = await seedAssumption();
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await createAssumptionComment({ assumptionId: assumption.id, body: sampleBody });

      expect(result).toEqual(NOT_AUTHORIZED);
    });

    it("denies (not found) when the assumption does not exist", async () => {
      const { user, account } = await createUserWithAccount(db);
      asCurrentUser(actorFor(user, account));

      const result = await createAssumptionComment({ assumptionId: NONEXISTENT_ID, body: sampleBody });

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });

  describe("updateAssumptionComment", () => {
    it("updates the body on success", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id);
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumptionComment(comment.id, { body: sampleBody });

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.body).toEqual(sampleBody);
    });

    it("denies a user in the same account who did not create the comment", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id);
      const otherUser = await createUser(db, { account_id: account.id });
      asCurrentUser(actorFor(otherUser, account));

      const result = await updateAssumptionComment(comment.id, { body: sampleBody });

      expect(result).toEqual(NOT_AUTHORIZED);
    });

    it("denies an actor from another account", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id);
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await updateAssumptionComment(comment.id, { body: sampleBody });

      expect(result).toEqual(NOT_AUTHORIZED);
    });

    it("denies (not found) when the comment does not exist", async () => {
      const { user, account } = await createUserWithAccount(db);
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumptionComment(NONEXISTENT_ID, { body: sampleBody });

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });

  describe("deleteAssumptionComment", () => {
    it("deletes the comment and returns success", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id);
      asCurrentUser(actorFor(user, account));

      const result = await deleteAssumptionComment(comment.id);

      expect(result).toEqual({ success: true, data: undefined });
      expect(await AssumptionCommentService.get(comment.id, db)).toBeUndefined();
    });

    it("denies a non-creator in the same account and leaves the row intact", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id);
      const otherUser = await createUser(db, { account_id: account.id });
      asCurrentUser(actorFor(otherUser, account));

      const result = await deleteAssumptionComment(comment.id);

      expect(result).toEqual(NOT_AUTHORIZED);
      expect(await AssumptionCommentService.get(comment.id, db)).toBeDefined();
    });

    it("denies an actor from another account and leaves the row intact", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id);
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await deleteAssumptionComment(comment.id);

      expect(result).toEqual(NOT_AUTHORIZED);
      expect(await AssumptionCommentService.get(comment.id, db)).toBeDefined();
    });

    it("denies (not found) when the comment does not exist", async () => {
      const { user, account } = await createUserWithAccount(db);
      asCurrentUser(actorFor(user, account));

      const result = await deleteAssumptionComment(NONEXISTENT_ID);

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });
});
