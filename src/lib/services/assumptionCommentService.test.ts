import { describe, it, expect } from "vitest";
import type { Block } from "@blocknote/core";
import { AssumptionCommentService } from "@lib/services/assumptionCommentService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAssumption, createAssumptionComment } from "@lib/testing/factories";
import { buildDecisionWithAssumptionAndCommentsScenario } from "@lib/testing/scenarios";

const { db } = setupTestDb();

const sampleBody = [{ type: "paragraph", content: "Looks reasonable" }] as unknown as Block[];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AssumptionCommentService", () => {
  describe("get", () => {
    it("returns the domain comment when found", async () => {
      const { user, assumption, unresolvedComment } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.get(unresolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(unresolvedComment.id);
      expect(result!.assumptionId).toBe(assumption.id);
      expect(result!.creatorId).toBe(user.id);
    });

    // The DB stores absent values as null; the domain model normalizes them to undefined.
    it("maps null resolver columns to undefined", async () => {
      const { unresolvedComment } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.get(unresolvedComment.id, db);

      expect(result!.resolverId).toBeUndefined();
      expect(result!.resolvedAt).toBeUndefined();
      expect(result!.body).toBeUndefined();
    });

    it("returns undefined when the comment does not exist", async () => {
      const result = await AssumptionCommentService.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithAssumption", () => {
    it("returns the comment joined with its assumption", async () => {
      const { assumption, unresolvedComment } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.getWithAssumption(unresolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(unresolvedComment.id);
      expect(result!.assumption.id).toBe(assumption.id);
    });

    it("returns undefined when the comment does not exist", async () => {
      const result = await AssumptionCommentService.getWithAssumption("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithAssumptionCreatorAndResolver", () => {
    it("returns an undefined resolver when the comment is unresolved", async () => {
      const { user, assumption, unresolvedComment } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.getWithAssumptionCreatorAndResolver(unresolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(unresolvedComment.id);
      expect(result!.assumption.id).toBe(assumption.id);
      expect(result!.creator.id).toBe(user.id);
      expect(result!.resolver).toBeUndefined();
    });

    it("returns the resolver as a domain user when the comment is resolved", async () => {
      const { user, resolver, resolvedComment } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.getWithAssumptionCreatorAndResolver(resolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.creator.id).toBe(user.id);
      expect(result!.resolver?.id).toBe(resolver.id);
      expect(result!.resolver?.email).toBe(resolver.email);
    });

    it("returns undefined when the comment does not exist", async () => {
      const result = await AssumptionCommentService.getWithAssumptionCreatorAndResolver(
        "00000000-0000-7000-8000-000000000000",
        db
      );
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("listForAssumptionWithCreatorAndResolver", () => {
    it("returns creator-and-resolver-joined comments scoped to the given assumption", async () => {
      const { user, decision, assumption, unresolvedComment, resolvedComment } =
        await buildDecisionWithAssumptionAndCommentsScenario(db);
      const otherAssumption = await createAssumption(db, decision.id, user.id);
      await createAssumptionComment(db, otherAssumption.id, user.id);

      const result = await AssumptionCommentService.listForAssumptionWithCreatorAndResolver(assumption.id, db);

      expect(result.map((c) => c.id).sort()).toEqual([unresolvedComment.id, resolvedComment.id].sort());
      expect(result.every((c) => c.creator.id === user.id)).toBe(true);
    });

    it("returns comments oldest first", async () => {
      const { assumption, unresolvedComment, resolvedComment } =
        await buildDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.listForAssumptionWithCreatorAndResolver(assumption.id, db);

      expect(result.map((c) => c.id)).toEqual([unresolvedComment.id, resolvedComment.id]);
    });

    it("returns an undefined resolver for unresolved comments and the user for resolved ones", async () => {
      const { assumption, resolver } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.listForAssumptionWithCreatorAndResolver(assumption.id, db);

      expect(result.map((c) => c.resolver?.id)).toEqual([undefined, resolver.id]);
    });

    it("returns an empty array when the assumption has no comments", async () => {
      const { user, decision } = await buildDecisionWithAssumptionAndCommentsScenario(db);
      const emptyAssumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionCommentService.listForAssumptionWithCreatorAndResolver(emptyAssumption.id, db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("create", () => {
    it("returns Ok(comment) with camelCase domain fields", async () => {
      const { user, assumption } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.create(
        {
          body: sampleBody,
          assumptionId: assumption.id,
          creatorId: user.id
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.body).toEqual(sampleBody);
        expect(result.value.assumptionId).toBe(assumption.id);
        expect(result.value.creatorId).toBe(user.id);
        expect(result.value.resolverId).toBeUndefined();
        expect(result.value.resolvedAt).toBeUndefined();
        expect(result.value.id).toBeDefined();
      }
    });

    it("persists resolver fields when creating an already-resolved comment", async () => {
      const { user, resolver, assumption } = await buildDecisionWithAssumptionAndCommentsScenario(db);
      const resolvedAt = new Date("2026-03-01T10:00:00Z");

      const result = await AssumptionCommentService.create(
        {
          assumptionId: assumption.id,
          creatorId: user.id,
          resolverId: resolver.id,
          resolvedAt
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resolverId).toBe(resolver.id);
        expect(result.value.resolvedAt?.getTime()).toBe(resolvedAt.getTime());
      }
    });

    // Missing FKs are "unexpected" — no handler is registered, so they throw rather than
    // returning a typed Err.
    it("throws when assumption does not exist", async () => {
      const { user } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      await expect(
        AssumptionCommentService.create(
          {
            assumptionId: "00000000-0000-7000-8000-000000000000",
            creatorId: user.id
          },
          db
        )
      ).rejects.toThrow();
    });

    it("throws when creator does not exist", async () => {
      const { assumption } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      await expect(
        AssumptionCommentService.create(
          {
            assumptionId: assumption.id,
            creatorId: "00000000-0000-7000-8000-000000000000"
          },
          db
        )
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("update", () => {
    it("throws when the comment does not exist", async () => {
      await expect(AssumptionCommentService.update("00000000-0000-7000-8000-000000000000", {}, db)).rejects.toThrow(
        "update failed"
      );
    });
  });

  // -------------------------------------------------------------------------

  describe("delete", () => {
    it("returns true when the comment exists", async () => {
      const { unresolvedComment } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.delete(unresolvedComment.id, db);

      expect(result).toBe(true);
    });

    it("actually removes the comment from the database", async () => {
      const { unresolvedComment } = await buildDecisionWithAssumptionAndCommentsScenario(db);

      await AssumptionCommentService.delete(unresolvedComment.id, db);

      const found = await AssumptionCommentService.get(unresolvedComment.id, db);
      expect(found).toBeUndefined();
    });

    it("returns false when the comment does not exist", async () => {
      const result = await AssumptionCommentService.delete("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBe(false);
    });
  });
});
