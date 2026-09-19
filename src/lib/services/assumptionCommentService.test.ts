import { describe, it, expect } from "vitest";
import type { Block } from "@blocknote/core";
import { AssumptionCommentService } from "@lib/services/assumptionCommentService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAssumption, createAssumptionComment } from "@lib/testing/factories";
import { createDecisionWithAssumptionAndCommentsScenario } from "@lib/testing/scenarios";

const { db } = setupTestDb();

const sampleBody = [{ type: "paragraph", content: "Looks reasonable" }] as unknown as Block[];

describe("AssumptionCommentService", () => {
  describe("get", () => {
    it("returns the domain comment when found", async () => {
      const { user, assumption, unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.get(unresolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(unresolvedComment.id);
      expect(result!.assumptionId).toBe(assumption.id);
      expect(result!.creatorId).toBe(user.id);
    });

    // The DB stores absent values as null; the domain model normalizes them to undefined.
    it("maps null resolver columns to undefined", async () => {
      const { unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

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

  describe("getWithAssumption", () => {
    it("returns the comment joined with its assumption", async () => {
      const { assumption, unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

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

  describe("getWithAssumptionCreatorAndResolver", () => {
    it("returns an undefined resolver when the comment is unresolved", async () => {
      const { user, assumption, unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.getWithAssumptionCreatorAndResolver(unresolvedComment.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(unresolvedComment.id);
      expect(result!.assumption.id).toBe(assumption.id);
      expect(result!.creator.id).toBe(user.id);
      expect(result!.resolver).toBeUndefined();
    });

    it("returns the resolver as a domain user when the comment is resolved", async () => {
      const { user, resolver, resolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

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

  describe("listForAssumptionWithCreatorAndResolver", () => {
    it("returns creator-and-resolver-joined comments scoped to the given assumption", async () => {
      const { user, decision, assumption, unresolvedComment, resolvedComment } =
        await createDecisionWithAssumptionAndCommentsScenario(db);
      const otherAssumption = await createAssumption(db, decision.id, user.id);
      await createAssumptionComment(db, otherAssumption.id, user.id);

      const result = await AssumptionCommentService.listForAssumptionWithCreatorAndResolver(assumption.id, db);

      expect(result.map((c) => c.id).sort()).toEqual([unresolvedComment.id, resolvedComment.id].sort());
      expect(result.every((c) => c.creator.id === user.id)).toBe(true);
    });

    it("returns comments oldest first", async () => {
      const { assumption, unresolvedComment, resolvedComment } =
        await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.listForAssumptionWithCreatorAndResolver(assumption.id, db);

      expect(result.map((c) => c.id)).toEqual([unresolvedComment.id, resolvedComment.id]);
    });

    it("returns an undefined resolver for unresolved comments and the user for resolved ones", async () => {
      const { assumption, resolver } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.listForAssumptionWithCreatorAndResolver(assumption.id, db);

      expect(result.map((c) => c.resolver?.id)).toEqual([undefined, resolver.id]);
    });

    it("returns an empty array when the assumption has no comments", async () => {
      const { user, decision } = await createDecisionWithAssumptionAndCommentsScenario(db);
      const emptyAssumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionCommentService.listForAssumptionWithCreatorAndResolver(emptyAssumption.id, db);
      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("returns Ok(comment) with camelCase domain fields", async () => {
      const { user, assumption } = await createDecisionWithAssumptionAndCommentsScenario(db);

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
      const { user, resolver, assumption } = await createDecisionWithAssumptionAndCommentsScenario(db);
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
      const { user } = await createDecisionWithAssumptionAndCommentsScenario(db);

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
      const { assumption } = await createDecisionWithAssumptionAndCommentsScenario(db);

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

  describe("update", () => {
    it("persists the body and round-trips it unchanged", async () => {
      const { unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.update(unresolvedComment.id, { body: sampleBody }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.body).toEqual(sampleBody);
      }

      const reloaded = await AssumptionCommentService.get(unresolvedComment.id, db);
      expect(reloaded!.body).toEqual(sampleBody);
    });

    // Resolving is the main reason `update` exists: camelCase input must land in the
    // snake_case `resolved_at` / `resolver_id` columns. A silently dropped rename would
    // still return Ok, so we read the row back rather than trust the return value alone.
    it("persists resolvedAt and resolverId when resolving a comment", async () => {
      const { resolver, unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);
      const resolvedAt = new Date("2026-03-01T10:00:00Z");

      const result = await AssumptionCommentService.update(
        unresolvedComment.id,
        { resolvedAt, resolverId: resolver.id },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resolverId).toBe(resolver.id);
        expect(result.value.resolvedAt?.getTime()).toBe(resolvedAt.getTime());
      }

      const reloaded = await AssumptionCommentService.get(unresolvedComment.id, db);
      expect(reloaded!.resolverId).toBe(resolver.id);
      expect(reloaded!.resolvedAt?.getTime()).toBe(resolvedAt.getTime());
    });

    // `null` clears a column; `undefined` is skipped by Drizzle's `.set()` and would be a no-op.
    it("clears resolvedAt and resolverId when unresolving a comment with null", async () => {
      const { resolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.update(
        resolvedComment.id,
        { resolvedAt: null, resolverId: null },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resolverId).toBeUndefined();
        expect(result.value.resolvedAt).toBeUndefined();
      }

      const reloaded = await AssumptionCommentService.get(resolvedComment.id, db);
      expect(reloaded!.resolverId).toBeUndefined();
      expect(reloaded!.resolvedAt).toBeUndefined();
    });

    it("leaves omitted fields untouched", async () => {
      const { resolver, resolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.update(resolvedComment.id, { body: sampleBody }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resolverId).toBe(resolver.id);
        expect(result.value.resolvedAt?.getTime()).toBe(resolvedComment.resolved_at!.getTime());
      }
    });

    it("bumps updatedAt", async () => {
      const { unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.update(unresolvedComment.id, { body: sampleBody }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.updatedAt.getTime()).toBeGreaterThan(unresolvedComment.updated_at.getTime());
      }
    });

    it("throws when the resolver does not exist", async () => {
      const { unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      await expect(
        AssumptionCommentService.update(
          unresolvedComment.id,
          { resolvedAt: new Date(), resolverId: "00000000-0000-7000-8000-000000000000" },
          db
        )
      ).rejects.toThrow();
    });

    it("throws when the comment does not exist", async () => {
      await expect(AssumptionCommentService.update("00000000-0000-7000-8000-000000000000", {}, db)).rejects.toThrow(
        "update failed"
      );
    });
  });

  describe("delete", () => {
    it("returns true when the comment exists", async () => {
      const { unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

      const result = await AssumptionCommentService.delete(unresolvedComment.id, db);

      expect(result).toBe(true);
    });

    it("actually removes the comment from the database", async () => {
      const { unresolvedComment } = await createDecisionWithAssumptionAndCommentsScenario(db);

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
