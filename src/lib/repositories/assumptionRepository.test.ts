import { describe, it, expect } from "vitest";
import type { Block } from "@blocknote/core";
import { AssumptionRepository } from "@lib/repositories/assumptionRepository";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAssumption, createDecision } from "@lib/testing/factories";
import { createDecisionWithProjectScenario } from "../testing/scenarios";

const { db } = setupTestDb();

const sampleRationale = [{ type: "paragraph", content: "Traffic will stay under 1k rps" }] as unknown as Block[];
const otherRationale = [{ type: "paragraph", content: "Traffic will double yearly" }] as unknown as Block[];

describe("AssumptionRepository", () => {
  describe("list", () => {
    it("returns all assumptions", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      await createAssumption(db, decision.id, user.id);
      await createAssumption(db, decision.id, user.id);

      const result = await AssumptionRepository.list(db);

      expect(result).toHaveLength(2);
    });

    it("returns an empty array when no assumptions exist", async () => {
      const result = await AssumptionRepository.list(db);
      expect(result).toEqual([]);
    });
  });

  describe("listForDecision", () => {
    it("returns only assumptions belonging to the given decision", async () => {
      const { user, project, decision } = await createDecisionWithProjectScenario(db);
      const otherDecision = await createDecision(db, project.id, user.id);
      const mine = await createAssumption(db, decision.id, user.id);
      await createAssumption(db, otherDecision.id, user.id);

      const result = await AssumptionRepository.listForDecision(decision.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mine.id);
    });

    it("returns assumptions newest first", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const older = await createAssumption(db, decision.id, user.id, { created_at: new Date("2026-01-01") });
      const newer = await createAssumption(db, decision.id, user.id, { created_at: new Date("2026-02-01") });

      const result = await AssumptionRepository.listForDecision(decision.id, db);

      expect(result.map((a) => a.id)).toEqual([newer.id, older.id]);
    });

    it("returns an empty array when the decision has no assumptions", async () => {
      const { decision } = await createDecisionWithProjectScenario(db);

      const result = await AssumptionRepository.listForDecision(decision.id, db);
      expect(result).toEqual([]);
    });
  });

  describe("listWithCreatorForDecision", () => {
    it("returns assumptions with their decision and creator, scoped to the given decision", async () => {
      const { user, project, decision } = await createDecisionWithProjectScenario(db);
      const otherDecision = await createDecision(db, project.id, user.id);
      const mine = await createAssumption(db, decision.id, user.id);
      await createAssumption(db, otherDecision.id, user.id);

      const result = await AssumptionRepository.listWithCreatorForDecision(decision.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].assumption.id).toBe(mine.id);
      expect(result[0].decision.id).toBe(decision.id);
      expect(result[0].creator.id).toBe(user.id);
    });

    it("returns assumptions newest first", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const older = await createAssumption(db, decision.id, user.id, { created_at: new Date("2026-01-01") });
      const newer = await createAssumption(db, decision.id, user.id, { created_at: new Date("2026-02-01") });

      const result = await AssumptionRepository.listWithCreatorForDecision(decision.id, db);

      expect(result.map((r) => r.assumption.id)).toEqual([newer.id, older.id]);
    });

    it("returns an empty array when the decision has no assumptions", async () => {
      const { decision } = await createDecisionWithProjectScenario(db);

      const result = await AssumptionRepository.listWithCreatorForDecision(decision.id, db);
      expect(result).toEqual([]);
    });
  });

  describe("get", () => {
    it("returns the assumption when found", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionRepository.get(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(assumption.id);
    });

    it("returns undefined when the assumption does not exist", async () => {
      const result = await AssumptionRepository.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getWithDecision", () => {
    it("returns the assumption joined with its decision", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionRepository.getWithDecision(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.assumption.id).toBe(assumption.id);
      expect(result!.decision.id).toBe(decision.id);
    });

    it("returns undefined when the assumption does not exist", async () => {
      const result = await AssumptionRepository.getWithDecision("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getWithDecisionAndProject", () => {
    it("returns the assumption joined with its decision and project", async () => {
      const { user, project, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionRepository.getWithDecisionAndProject(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.assumption.id).toBe(assumption.id);
      expect(result!.decision.id).toBe(decision.id);
      expect(result!.project.id).toBe(project.id);
    });

    it("returns undefined when the assumption does not exist", async () => {
      const result = await AssumptionRepository.getWithDecisionAndProject("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getWithDecisionAndCreator", () => {
    it("returns the assumption joined with its decision and creator", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionRepository.getWithDecisionAndCreator(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.assumption.id).toBe(assumption.id);
      expect(result!.decision.id).toBe(decision.id);
      expect(result!.creator.id).toBe(user.id);
    });

    it("returns undefined when the assumption does not exist", async () => {
      const result = await AssumptionRepository.getWithDecisionAndCreator("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getWithDecisionCreatorAndProject", () => {
    it("returns the assumption joined with its decision, creator and project", async () => {
      const { user, project, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionRepository.getWithDecisionCreatorAndProject(assumption.id, db);

      expect(result).toBeDefined();
      expect(result!.assumption.id).toBe(assumption.id);
      expect(result!.decision.id).toBe(decision.id);
      expect(result!.creator.id).toBe(user.id);
      expect(result!.project.id).toBe(project.id);
    });

    it("returns undefined when the assumption does not exist", async () => {
      const result = await AssumptionRepository.getWithDecisionCreatorAndProject(
        "00000000-0000-7000-8000-000000000000",
        db
      );
      expect(result).toBeUndefined();
    });
  });

  describe("create", () => {
    it("returns Ok(assumption) on success", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);

      const result = await AssumptionRepository.create(
        {
          title: "Load stays flat",
          rationale: sampleRationale,
          decision_id: decision.id,
          creator_id: user.id
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Load stays flat");
        expect(result.value.rationale).toEqual(sampleRationale);
        expect(result.value.decision_id).toBe(decision.id);
        expect(result.value.creator_id).toBe(user.id);
        expect(result.value.id).toBeDefined();
      }
    });

    it("leaves the AI evaluation fields empty", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);

      const result = await AssumptionRepository.create(
        { title: "Load stays flat", decision_id: decision.id, creator_id: user.id },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.rationale_updated_at).toBeInstanceOf(Date);
        expect(result.value.rationale_ai_requested_at).toBeNull();
        expect(result.value.rationale_ai_evaluated_at).toBeNull();
        expect(result.value.rationale_ai_evaluation).toBeNull();
        expect(result.value.rationale_ai_rating).toBeNull();
      }
    });

    // Missing FKs are "unexpected" — no handler is registered, so they throw rather than
    // returning a typed Err.
    it("throws when decision_id does not exist", async () => {
      const { user } = await createDecisionWithProjectScenario(db);

      await expect(
        AssumptionRepository.create(
          {
            title: "Orphan",
            decision_id: "00000000-0000-7000-8000-000000000000",
            creator_id: user.id
          },
          db
        )
      ).rejects.toThrow();
    });

    it("throws when creator_id does not exist", async () => {
      const { decision } = await createDecisionWithProjectScenario(db);

      await expect(
        AssumptionRepository.create(
          {
            title: "Orphan",
            decision_id: decision.id,
            creator_id: "00000000-0000-7000-8000-000000000000"
          },
          db
        )
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("returns Ok(assumption) with the updated fields", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id, { title: "Old Title" });

      const result = await AssumptionRepository.update(assumption.id, { title: "New Title" }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.title).toBe("New Title");
    });

    it("throws when the assumption is not found", async () => {
      await expect(
        AssumptionRepository.update("00000000-0000-7000-8000-000000000000", { title: "Ghost" }, db)
      ).rejects.toThrow("update failed");
    });

    // rationale_updated_at is what marks an AI evaluation as outdated, so it must move
    // exactly when a rationale is part of the change set — never on unrelated edits.
    describe("rationale_updated_at", () => {
      const longAgo = new Date("2026-01-01T00:00:00Z");

      it("is left untouched when the change set has no rationale", async () => {
        const { user, decision } = await createDecisionWithProjectScenario(db);
        const assumption = await createAssumption(db, decision.id, user.id, {
          rationale: sampleRationale,
          rationale_updated_at: longAgo
        });

        const result = await AssumptionRepository.update(assumption.id, { title: "New Title", confidence: 0.5 }, db);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.rationale_updated_at.getTime()).toBe(longAgo.getTime());
          expect(result.value.updated_at.getTime()).toBeGreaterThan(longAgo.getTime());
        }
      });

      it("is set when the change set has a new rationale", async () => {
        const { user, decision } = await createDecisionWithProjectScenario(db);
        const assumption = await createAssumption(db, decision.id, user.id, {
          rationale: sampleRationale,
          rationale_updated_at: longAgo
        });

        const result = await AssumptionRepository.update(assumption.id, { rationale: otherRationale }, db);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.rationale).toEqual(otherRationale);
          expect(result.value.rationale_updated_at.getTime()).toBeGreaterThan(longAgo.getTime());
          expect(result.value.rationale_updated_at.getTime()).toBe(result.value.updated_at.getTime());
        }
      });

      it("is set even when the new rationale is identical to the old one", async () => {
        const { user, decision } = await createDecisionWithProjectScenario(db);
        const assumption = await createAssumption(db, decision.id, user.id, {
          rationale: sampleRationale,
          rationale_updated_at: longAgo
        });

        const result = await AssumptionRepository.update(assumption.id, { rationale: sampleRationale }, db);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.rationale).toEqual(sampleRationale);
          expect(result.value.rationale_updated_at.getTime()).toBeGreaterThan(longAgo.getTime());
        }
      });

      // null is a real value in the change set (it clears the column), unlike undefined
      // which Drizzle skips.
      it("is set when the rationale is cleared with null", async () => {
        const { user, decision } = await createDecisionWithProjectScenario(db);
        const assumption = await createAssumption(db, decision.id, user.id, {
          rationale: sampleRationale,
          rationale_updated_at: longAgo
        });

        const result = await AssumptionRepository.update(assumption.id, { rationale: null }, db);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.rationale).toBeNull();
          expect(result.value.rationale_updated_at.getTime()).toBeGreaterThan(longAgo.getTime());
        }
      });
    });
  });

  describe("delete", () => {
    it("returns true when the assumption exists", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      const result = await AssumptionRepository.delete(assumption.id, db);

      expect(result).toBe(true);
    });

    it("returns false when the assumption does not exist", async () => {
      const result = await AssumptionRepository.delete("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBe(false);
    });

    it("actually removes the assumption from the database", async () => {
      const { user, decision } = await createDecisionWithProjectScenario(db);
      const assumption = await createAssumption(db, decision.id, user.id);

      await AssumptionRepository.delete(assumption.id, db);

      const found = await AssumptionRepository.get(assumption.id, db);
      expect(found).toBeUndefined();
    });
  });
});
