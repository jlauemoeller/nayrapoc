import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { evaluateAssumption } from "@lib/jobs/evaluateAssumption";
import { AssumptionEvaluationService } from "@lib/services/assumptionEvaluationService";
import { AssumptionService } from "@lib/services/assumptionService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAssumption } from "@lib/testing/factories";
import { evaluationJobsFor } from "@lib/testing/jobs";
import { createDecisionWithProjectScenario } from "@lib/testing/scenarios";

const { db } = setupTestDb();

const NONEXISTENT_ID = "00000000-0000-7000-8000-000000000000";

// The LLM side is covered in assumptionEvaluationService.test.ts; here we only care
// about what the job does with the result.
beforeEach(() => {
  vi.spyOn(AssumptionEvaluationService, "evaluateAssumption").mockResolvedValue({
    rating: "partially_addressed",
    evaluation: "Peak season is not covered."
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("evaluateAssumption job", () => {
  it("saves the rating and evaluation on the assumption", async () => {
    const { user, decision } = await createDecisionWithProjectScenario(db);
    const assumption = await createAssumption(db, decision.id, user.id);

    await evaluateAssumption({ assumptionId: assumption.id }, db);

    const reloaded = await AssumptionService.get(assumption.id, db);
    expect(reloaded?.rationaleAiRating).toBe("partially_addressed");
    expect(reloaded?.rationaleAiEvaluation).toBe("Peak season is not covered.");
  });

  // The timestamp marks what the evaluation saw, not when it finished. A rationale edited
  // while the LLM was busy must still read as newer than the evaluation.
  it("stamps rationaleAiEvaluatedAt with the time the evaluation started", async () => {
    const { user, decision } = await createDecisionWithProjectScenario(db);
    const assumption = await createAssumption(db, decision.id, user.id);
    const before = new Date();
    let calledAt: Date | undefined;
    vi.mocked(AssumptionEvaluationService.evaluateAssumption).mockImplementation(async () => {
      calledAt = new Date();
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { rating: "addressed", evaluation: "Nothing to add" };
    });

    await evaluateAssumption({ assumptionId: assumption.id }, db);

    const evaluatedAt = (await AssumptionService.get(assumption.id, db))?.rationaleAiEvaluatedAt;
    expect(evaluatedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(evaluatedAt!.getTime()).toBeLessThanOrEqual(calledAt!.getTime());
  });

  // Saving the result goes through AssumptionService.update; if that requested another
  // evaluation, every job would enqueue its successor.
  it("does not request another evaluation", async () => {
    const { user, decision } = await createDecisionWithProjectScenario(db);
    const assumption = await createAssumption(db, decision.id, user.id);

    await evaluateAssumption({ assumptionId: assumption.id }, db);

    expect(await evaluationJobsFor(assumption.id)).toEqual([]);
  });

  // The assumption may have been deleted between enqueue and run.
  it("does nothing when the assumption no longer exists", async () => {
    await expect(evaluateAssumption({ assumptionId: NONEXISTENT_ID }, db)).resolves.toBeUndefined();

    expect(AssumptionEvaluationService.evaluateAssumption).not.toHaveBeenCalled();
  });
});
