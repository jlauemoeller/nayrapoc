import { describe, it, expect } from "vitest";
import type { Block } from "@blocknote/core";
import { AssumptionCommentRepository } from "@lib/repositories/assumptionCommentRepository";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAssumption, createAssumptionComment } from "@lib/testing/factories";
import { createDecisionWithAssumptionAndCommentsScenario } from "@lib/testing/scenarios";

const { db } = setupTestDb();

const sampleBody = [{ type: "paragraph", content: "Looks reasonable" }] as unknown as Block[];

describe("AssumptionCommentRepository", () => {
  describe("get", () => {
    it("returns the comment when found", async () => {
      const { unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentRepository.get(unresolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(unresolvedComment.id);
    });

    it("returns undefined when the comment does not exist", async () => {
      const result = await AssumptionCommentRepository.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getWithAssumption", () => {
    it("returns the comment joined with its assumption", async () => {
      const { assumption, unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentRepository.getWithAssumption(unresolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.assumptionComment.id).toBe(unresolvedComment.id);
      expect(result!.assumption.id).toBe(assumption.id);
    });

    it("returns undefined when the comment does not exist", async () => {
      const result = await AssumptionCommentRepository.getWithAssumption("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getWithAssumptionAndCreator", () => {
    it("returns the comment joined with its assumption and creator", async () => {
      const { user, assumption, unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentRepository.getWithAssumptionAndCreator(unresolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.assumptionComment.id).toBe(unresolvedComment.id);
      expect(result!.assumption.id).toBe(assumption.id);
      expect(result!.creator.id).toBe(user.id);
    });
  });

  describe("getWithAssumptionCreatorAndResolver", () => {
    it("returns a null resolver when the comment is unresolved", async () => {
      const { user, assumption, unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentRepository.getWithAssumptionCreatorAndResolver(unresolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.assumptionComment.id).toBe(unresolvedComment.id);
      expect(result!.assumption.id).toBe(assumption.id);
      expect(result!.creator.id).toBe(user.id);
      expect(result!.resolver).toBeNull();
    });

    // The creator and resolver are both `users` rows, so this checks that the two
    // aliased joins pick out distinct users rather than the same one twice.
    it("returns the resolver when the comment is resolved by a different user", async () => {
      const { user, resolver, resolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentRepository.getWithAssumptionCreatorAndResolver(resolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.creator.id).toBe(user.id);
      expect(result!.resolver?.id).toBe(resolver.id);
    });

    it("returns undefined when the comment does not exist", async () => {
      const result = await AssumptionCommentRepository.getWithAssumptionCreatorAndResolver(
        "00000000-0000-7000-8000-000000000000",
        db
      );
      expect(result).toBeUndefined();
    });
  });

  describe("listForAssumptionWithCreatorAndResolver", () => {
    it("returns comments with creator and resolver, scoped to the given assumption", async () => {
      const { user, decision, assumption, unresolvedComment, resolvedComment } =
        await createDecisionWithAssumptionAndCommentsScenario(db);
      const otherAssumption = await createAssumption(db, decision.id, user.id);
      await createAssumptionComment(db, otherAssumption.id, user.id);

      const result = await AssumptionCommentRepository.listForAssumptionWithCreatorAndResolver(assumption.id, db);

      expect(result.map((r) => r.assumptionComment.id).sort()).toEqual(
        [unresolvedComment.id, resolvedComment.id].sort()
      );
      expect(result.every((r) => r.creator.id === user.id)).toBe(true);
    });

    it("returns comments oldest first", async () => {
      const { assumption, unresolvedComment, resolvedComment } =
        await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentRepository.listForAssumptionWithCreatorAndResolver(assumption.id, db);

      expect(result.map((r) => r.assumptionComment.id)).toEqual([unresolvedComment.id, resolvedComment.id]);
    });

    it("returns a null resolver for unresolved comments and the user for resolved ones", async () => {
      const { assumption, resolver } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentRepository.listForAssumptionWithCreatorAndResolver(assumption.id, db);

      expect(result.map((r) => r.resolver?.id ?? null)).toEqual([null, resolver.id]);
    });

    it("returns an empty array when the assumption has no comments", async () => {
      const { user, decision } = await createDecisionWithAssumptionAndCommentsScenario(db);
      const emptyAssumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionCommentRepository.listForAssumptionWithCreatorAndResolver(emptyAssumption.id, db);
      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("returns Ok(comment) on success", async () => {
      const { user, assumption } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentRepository.create(
        {
          body: sampleBody,
          assumption_id: assumption.id,
          creator_id: user.id
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.body).toEqual(sampleBody);
        expect(result.value.assumption_id).toBe(assumption.id);
        expect(result.value.creator_id).toBe(user.id);
        expect(result.value.resolver_id).toBeNull();
        expect(result.value.resolved_at).toBeNull();
        expect(result.value.id).toBeDefined();
      }
    });

    // Missing FKs are "unexpected" — no handler is registered, so they throw rather than
    // returning a typed Err.
    it("throws when assumption_id does not exist", async () => {
      const { user } = await createDecisionWithAssumptionAndCommentsScenario(db);

      await expect(
        AssumptionCommentRepository.create(
          {
            assumption_id: "00000000-0000-7000-8000-000000000000",
            creator_id: user.id
          },
          db
        )
      ).rejects.toThrow();
    });

    it("throws when creator_id does not exist", async () => {
      const { assumption } = await createDecisionWithAssumptionAndCommentsScenario(db);

      await expect(
        AssumptionCommentRepository.create(
          {
            assumption_id: assumption.id,
            creator_id: "00000000-0000-7000-8000-000000000000"
          },
          db
        )
      ).rejects.toThrow();
    });

    it("throws when resolver_id does not exist", async () => {
      const { user, assumption } = await createDecisionWithAssumptionAndCommentsScenario(db);

      await expect(
        AssumptionCommentRepository.create(
          {
            assumption_id: assumption.id,
            creator_id: user.id,
            resolver_id: "00000000-0000-7000-8000-000000000000",
            resolved_at: new Date()
          },
          db
        )
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("returns Ok(comment) with the updated fields", async () => {
      const { resolver, unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);
      const resolvedAt = new Date("2026-03-01T10:00:00Z");

      const result = await AssumptionCommentRepository.update(
        unresolvedComment.id,
        { resolver_id: resolver.id, resolved_at: resolvedAt },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resolver_id).toBe(resolver.id);
        expect(result.value.resolved_at?.getTime()).toBe(resolvedAt.getTime());
      }
    });

    it("throws when the comment is not found", async () => {
      await expect(
        AssumptionCommentRepository.update("00000000-0000-7000-8000-000000000000", { body: sampleBody }, db)
      ).rejects.toThrow("update failed");
    });
  });

  describe("delete", () => {
    it("returns true when the comment exists", async () => {
      const { unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentRepository.delete(unresolvedComment.id, db);

      expect(result).toBe(true);
    });

    it("returns false when the comment does not exist", async () => {
      const result = await AssumptionCommentRepository.delete("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBe(false);
    });

    it("actually removes the comment from the database", async () => {
      const { unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      await AssumptionCommentRepository.delete(unresolvedComment.id, db);

      const found = await AssumptionCommentRepository.get(unresolvedComment.id, db);
      expect(found).toBeUndefined();
    });
  });
});
