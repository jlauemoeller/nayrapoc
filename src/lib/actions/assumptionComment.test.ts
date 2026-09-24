import { vi, describe, it, expect, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import { actorFor, asCurrentUser, resetCurrentUser } from "../testing/actions";
import type { Block } from "@blocknote/core";
import {
  createAssumptionComment,
  updateAssumptionComment,
  updateAssumptionCommentResolutionState,
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
  createUser
} from "@lib/testing/factories";
import { createUserWithAccountScenario } from "../testing/scenarios";

vi.mock("@/lib/authorization", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authorization")>("@/lib/authorization");
  return { ...actual, currentUser: vi.fn() };
});

// revalidatePath needs a Next.js request context, which tests don't have.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { db } = setupTestDb();

const sampleBody = [{ id: "1", type: "paragraph", content: "Looks reasonable" }] as unknown as Block[];

const NONEXISTENT_ID = "00000000-0000-7000-8000-000000000000";

const NOT_AUTHORIZED = { success: false, error: { field: "root", message: "Not authorized" } };

// Every action test starts from an account with a project → decision → assumption.
async function seedAssumption() {
  const { user, account } = await createUserWithAccountScenario(db);
  const project = await createProject(db, account.id, user.id);
  const decision = await createDecision(db, project.id, user.id);
  const assumption = await createAssumption(db, decision.id, user.id);
  return { user, account, assumption };
}

beforeEach(() => {
  resetCurrentUser();
  vi.mocked(revalidatePath).mockClear();
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

    it("revalidates the assumption page", async () => {
      const { user, account, assumption } = await seedAssumption();
      asCurrentUser(actorFor(user, account));

      await createAssumptionComment({ assumptionId: assumption.id, body: sampleBody });

      expect(revalidatePath).toHaveBeenCalledWith(`/assumptions/${assumption.id}`);
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
      const { user, account } = await createUserWithAccountScenario(db);
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

    it("revalidates the assumption page", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id);
      asCurrentUser(actorFor(user, account));

      await updateAssumptionComment(comment.id, { body: sampleBody });

      expect(revalidatePath).toHaveBeenCalledWith(`/assumptions/${assumption.id}`);
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
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumptionComment(NONEXISTENT_ID, { body: sampleBody });

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });

  describe("updateAssumptionCommentResolutionState", () => {
    it("resolves the comment with the actor as resolver", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id);
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumptionCommentResolutionState(comment.id, true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resolvedAt).toBeInstanceOf(Date);
        expect(result.data.resolver?.id).toBe(user.id);
      }
      expect(revalidatePath).toHaveBeenCalledWith(`/assumptions/${assumption.id}`);
    });

    it("unresolves a resolved comment", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id, { resolver_id: user.id, resolved_at: new Date() });
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumptionCommentResolutionState(comment.id, false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resolvedAt).toBeUndefined();
        expect(result.data.resolver).toBeUndefined();
      }
    });

    // Resolving twice (e.g. from two open tabs) must keep the original resolver and time.
    it("leaves an already-resolved comment untouched", async () => {
      const { user, account, assumption } = await seedAssumption();
      const resolvedAt = new Date("2026-03-01T10:00:00Z");
      const comment = await seedComment(db, assumption.id, user.id, { resolver_id: user.id, resolved_at: resolvedAt });
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumptionCommentResolutionState(comment.id, true);

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.resolvedAt?.getTime()).toBe(resolvedAt.getTime());
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("denies a user in the same account who did not create the comment", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id);
      const otherUser = await createUser(db, { account_id: account.id });
      asCurrentUser(actorFor(otherUser, account));

      const result = await updateAssumptionCommentResolutionState(comment.id, true);

      expect(result).toEqual(NOT_AUTHORIZED);
      expect((await AssumptionCommentService.get(comment.id, db))?.resolvedAt).toBeUndefined();
    });

    it("denies (not found) when the comment does not exist", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumptionCommentResolutionState(NONEXISTENT_ID, true);

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

    it("revalidates the assumption page", async () => {
      const { user, account, assumption } = await seedAssumption();
      const comment = await seedComment(db, assumption.id, user.id);
      asCurrentUser(actorFor(user, account));

      await deleteAssumptionComment(comment.id);

      expect(revalidatePath).toHaveBeenCalledWith(`/assumptions/${assumption.id}`);
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
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await deleteAssumptionComment(NONEXISTENT_ID);

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });
});
