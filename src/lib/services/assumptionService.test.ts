import { describe, it, expect } from "vitest";
import type { Block } from "@blocknote/core";
import { AssumptionService } from "@lib/services/assumptionService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAssumption, createDecision } from "@lib/testing/factories";
import { createDecisionWithProjectScenario } from "../testing/scenarios";
import { evaluationJobsFor } from "@lib/testing/jobs";

const { db } = setupTestDb();

const sampleRationale = [{ type: "paragraph", content: "Traffic will stay under 1k rps" }] as unknown as Block[];
describe("AssumptionService", () => {
  describe("get", () => {
    it("returns the domain assumption when found", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionService.get(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(assumption.id);
      expect(result!.decisionId).toBe(decision.id);
      expect(result!.creatorId).toBe(user.id);
    });

    // The domain model uses undefined, not null, for absent optional fields.
    it("maps null columns to undefined", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionService.get(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.rationale).toBeUndefined();
      expect(result!.rationaleUpdatedAt).toBeInstanceOf(Date);
      expect(result!.rationaleAiRequestedAt).toBeUndefined();
      expect(result!.rationaleAiEvaluatedAt).toBeUndefined();
      expect(result!.rationaleAiEvaluation).toBeUndefined();
      expect(result!.rationaleAiRating).toBeUndefined();
    });

    it("maps the AI evaluation columns to camelCase domain fields", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const requestedAt = new Date("2026-03-01T10:00:00Z");
      const evaluatedAt = new Date("2026-03-01T10:00:05Z");
      const assumption = await createAssumption(db, decision.id, user.id, {
        rationale_ai_requested_at: requestedAt,
        rationale_ai_evaluated_at: evaluatedAt,
        rationale_ai_evaluation: "Does not address seasonal peaks",
        rationale_ai_rating: "partially_addressed"
      });

      const result = await AssumptionService.get(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.rationaleAiRequestedAt?.getTime()).toBe(requestedAt.getTime());
      expect(result!.rationaleAiEvaluatedAt?.getTime()).toBe(evaluatedAt.getTime());
      expect(result!.rationaleAiEvaluation).toBe("Does not address seasonal peaks");
      expect(result!.rationaleAiRating).toBe("partially_addressed");
    });

    it("returns undefined when the assumption does not exist", async () => {
      const result = await AssumptionService.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getWithDecision", () => {
    it("returns the assumption joined with its decision", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionService.getWithDecision(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(assumption.id);
      expect(result!.decision.id).toBe(decision.id);
    });

    it("returns undefined when the assumption does not exist", async () => {
      const result = await AssumptionService.getWithDecision("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getWithDecisionAndProject", () => {
    it("returns the assumption joined with its decision and project", async () => {
      const { user, project, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionService.getWithDecisionAndProject(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(assumption.id);
      expect(result!.decision.id).toBe(decision.id);
      expect(result!.decision.project.id).toBe(project.id);
    });

    it("returns undefined when the assumption does not exist", async () => {
      const result = await AssumptionService.getWithDecisionAndProject("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getWithDecisionAndCreator", () => {
    it("returns the assumption joined with its decision and creator", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionService.getWithDecisionAndCreator(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(assumption.id);
      expect(result!.decision.id).toBe(decision.id);
      expect(result!.creator.id).toBe(user.id);
    });

    it("returns undefined when the assumption does not exist", async () => {
      const result = await AssumptionService.getWithDecisionAndCreator("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getWithDecisionCreatorAndProject", () => {
    it("returns the assumption joined with its decision, creator and project", async () => {
      const { user, project, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionService.getWithDecisionCreatorAndProject(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(assumption.id);
      expect(result!.decision.id).toBe(decision.id);
      expect(result!.decision.project.id).toBe(project.id);
      expect(result!.creator.id).toBe(user.id);
    });

    it("returns undefined when the assumption does not exist", async () => {
      const result = await AssumptionService.getWithDecisionCreatorAndProject(
        "00000000-0000-7000-8000-000000000000",
        db
      );
      expect(result).toBeUndefined();
    });
  });

  describe("list", () => {
    it("returns all assumptions as domain models", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      await createAssumption(db, decision.id, user.id);
      await createAssumption(db, decision.id, user.id);

      const result = await AssumptionService.list(db);

      expect(result).toHaveLength(2);
      expect(result[0].decisionId).toBe(decision.id);
      expect(result[0].creatorId).toBe(user.id);
    });

    it("returns an empty array when no assumptions exist", async () => {
      const result = await AssumptionService.list(db);
      expect(result).toEqual([]);
    });
  });

  describe("listForDecision", () => {
    it("returns only assumptions belonging to the given decision", async () => {
      const { user, project, decision } = await createDecisionWithProjectScenario(db);
      const otherDecision = await createDecision(db, project.id, user.id);
      const mine = await createAssumption(db, decision.id, user.id);
      await createAssumption(db, otherDecision.id, user.id);

      const result = await AssumptionService.listForDecision(decision.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mine.id);
      expect(result[0].decisionId).toBe(decision.id);
    });

    it("returns an empty array when the decision has no assumptions", async () => {
      const { decision } = await createDecisionWithProjectScenario(db);

      const result = await AssumptionService.listForDecision(decision.id, db);
      expect(result).toEqual([]);
    });
  });

  describe("listWithCreatorForDecision", () => {
    it("returns creator-joined assumptions scoped to the given decision", async () => {
      const { user, project, decision } = await createDecisionWithProjectScenario(db);
      const otherDecision = await createDecision(db, project.id, user.id);
      const mine = await createAssumption(db, decision.id, user.id);
      await createAssumption(db, otherDecision.id, user.id);

      const result = await AssumptionService.listWithCreatorForDecision(decision.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mine.id);
      expect(result[0].decision.id).toBe(decision.id);
      expect(result[0].creator.id).toBe(user.id);
    });
  });

  describe("create", () => {
    it("returns Ok(assumption) with camelCase domain fields", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);

      const result = await AssumptionService.create(
        {
          title: "Load stays flat",
          rationale: sampleRationale,
          decisionId: decision.id,
          creatorId: user.id
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Load stays flat");
        expect(result.value.rationale).toEqual(sampleRationale);
        expect(result.value.decisionId).toBe(decision.id);
        expect(result.value.creatorId).toBe(user.id);
        expect(result.value.id).toBeDefined();
      }
    });

    it("requests an AI evaluation when created with a rationale", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);

      const result = await AssumptionService.create(
        { title: "Load stays flat", rationale: sampleRationale, decisionId: decision.id, creatorId: user.id },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const reloaded = await AssumptionService.get(result.value.id, db);
        expect(reloaded?.rationaleAiRequestedAt).toBeInstanceOf(Date);
        expect(await evaluationJobsFor(result.value.id)).toHaveLength(1);
      }
    });

    it("does not request an AI evaluation without a rationale", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);

      const result = await AssumptionService.create(
        { title: "Load stays flat", decisionId: decision.id, creatorId: user.id },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.rationaleAiRequestedAt).toBeUndefined();
        expect(await evaluationJobsFor(result.value.id)).toEqual([]);
      }
    });

    // Missing FKs are "unexpected" — no handler is registered, so they throw rather than
    // returning a typed Err.
    it("throws when decision does not exist", async () => {
      const { user } = await createDecisionWithProjectScenario(db);

      await expect(
        AssumptionService.create(
          {
            title: "Orphan",
            decisionId: "00000000-0000-7000-8000-000000000000",
            creatorId: user.id
          },
          db
        )
      ).rejects.toThrow();
    });

    it("throws when creator does not exist", async () => {
      const { decision } = await createDecisionWithProjectScenario(db);

      await expect(
        AssumptionService.create(
          {
            title: "Orphan",
            decisionId: decision.id,
            creatorId: "00000000-0000-7000-8000-000000000000"
          },
          db
        )
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("returns Ok(assumption) with updated fields", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id, { title: "Old" });

      const result = await AssumptionService.update(assumption.id, { title: "New" }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("New");
      }
    });

    // Editing title must not mark an existing AI evaluation as outdated.
    it("does not touch rationaleUpdatedAt when rationale is not updated", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const longAgo = new Date("2026-01-01T00:00:00Z");
      const assumption = await createAssumption(db, decision.id, user.id, { rationale_updated_at: longAgo });

      const result = await AssumptionService.update(assumption.id, { title: "New" }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.rationaleUpdatedAt.getTime()).toBe(longAgo.getTime());
      }
    });

    it("throws when the assumption does not exist", async () => {
      await expect(
        AssumptionService.update("00000000-0000-7000-8000-000000000000", { title: "Ghost" }, db)
      ).rejects.toThrow("update failed");
    });

    it("persists the rationale when specified and updates rationaleUpdatedAt", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const longAgo = new Date("2026-01-01T00:00:00Z");
      const assumption = await createAssumption(db, decision.id, user.id, { rationale_updated_at: longAgo });

      const result = await AssumptionService.update(assumption.id, { rationale: sampleRationale }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.rationale).toEqual(sampleRationale);
      }

      const reloaded = await AssumptionService.get(assumption.id, db);
      expect(reloaded?.rationale).toEqual(sampleRationale);
      expect(reloaded?.rationaleUpdatedAt.getTime()).toBeGreaterThan(longAgo.getTime());
    });

    it("requests an AI evaluation when the rationale changes", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      await AssumptionService.update(assumption.id, { rationale: sampleRationale }, db);

      const reloaded = await AssumptionService.get(assumption.id, db);
      expect(reloaded?.rationaleAiRequestedAt).toBeInstanceOf(Date);
      expect(await evaluationJobsFor(assumption.id)).toHaveLength(1);
    });

    // The evaluation job itself writes back through `update` (without a rationale); if that
    // requested another evaluation, the job would re-enqueue itself forever.
    it("does not request an AI evaluation when the rationale is untouched", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      await AssumptionService.update(assumption.id, { title: "New", rationaleAiRating: "addressed" }, db);

      const reloaded = await AssumptionService.get(assumption.id, db);
      expect(reloaded?.rationaleAiRequestedAt).toBeUndefined();
      expect(await evaluationJobsFor(assumption.id)).toEqual([]);
    });
  });

  describe("delete", () => {
    it("returns true when the assumption exists", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionService.delete(assumption.id, db);

      expect(result).toBe(true);
    });

    it("actually removes the assumption from the database", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      await AssumptionService.delete(assumption.id, db);

      const found = await AssumptionService.get(assumption.id, db);
      expect(found).toBeUndefined();
    });

    it("returns false when the assumption does not exist", async () => {
      const result = await AssumptionService.delete("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBe(false);
    });
  });
});
