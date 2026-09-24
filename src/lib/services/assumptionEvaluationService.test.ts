import { describe, it, expect } from "vitest";
import type { Block } from "@blocknote/core";
import { MockLanguageModelV4 } from "ai/test";
import { AssumptionEvaluationService, EvaluationResult } from "@lib/services/assumptionEvaluationService";
import { toAssumption } from "@lib/models/assumption";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAssumption, createAssumptionComment } from "@lib/testing/factories";
import { createDecisionWithProjectScenario } from "@lib/testing/scenarios";

const { db } = setupTestDb();

function paragraph(text: string): Block[] {
  return [
    { id: "1", type: "paragraph", props: {}, content: [{ type: "text", text, styles: {} }], children: [] }
  ] as unknown as Block[];
}

// A canned structured-output response, the way a provider would return it.
function reply(result: EvaluationResult) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result) }],
    finishReason: { unified: "stop" as const, raw: undefined },
    usage: {
      inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
      outputTokens: { total: 10, text: 10, reasoning: undefined }
    },
    warnings: []
  };
}

// Responses are handed out in call order. Per-comment calls are started in comment order
// (Promise.all over a map), and the summarization call always comes last.
function mockModel(...results: EvaluationResult[]) {
  return new MockLanguageModelV4({ doGenerate: results.map(reply) });
}

function promptText(model: MockLanguageModelV4, call: number) {
  return JSON.stringify(model.doGenerateCalls[call].prompt);
}

async function seedAssumption() {
  const { user, decision } = await createDecisionWithProjectScenario(db);
  const record = await createAssumption(db, decision.id, user.id, { rationale: paragraph("Traffic stays flat") });
  return { user, assumption: toAssumption(record) };
}

describe("AssumptionEvaluationService.evaluateAssumption", () => {
  it("rates an assumption without comments as addressed, without calling the model", async () => {
    const { assumption } = await seedAssumption();
    const model = mockModel();

    const result = await AssumptionEvaluationService.evaluateAssumption(assumption, db, model);

    expect(result.rating).toBe("addressed");
    expect(model.doGenerateCalls).toHaveLength(0);
  });

  it("ignores resolved comments", async () => {
    const { user, assumption } = await seedAssumption();
    await createAssumptionComment(db, assumption.id, user.id, {
      body: paragraph("Already handled"),
      resolver_id: user.id,
      resolved_at: new Date()
    });
    const model = mockModel();

    const result = await AssumptionEvaluationService.evaluateAssumption(assumption, db, model);

    expect(result.rating).toBe("addressed");
    expect(model.doGenerateCalls).toHaveLength(0);
  });

  it("evaluates each unresolved comment and skips summarization when all are addressed", async () => {
    const { user, assumption } = await seedAssumption();
    await createAssumptionComment(db, assumption.id, user.id, { body: paragraph("What about peak season?") });
    const model = mockModel({ rating: "addressed", evaluation: "Nothing to add" });

    const result = await AssumptionEvaluationService.evaluateAssumption(assumption, db, model);

    expect(result.rating).toBe("addressed");
    expect(model.doGenerateCalls).toHaveLength(1);
    expect(promptText(model, 0)).toContain("Traffic stays flat");
    expect(promptText(model, 0)).toContain("What about peak season?");
  });

  it("summarizes only the evaluations that found problems", async () => {
    const { user, assumption } = await seedAssumption();
    await createAssumptionComment(db, assumption.id, user.id, {
      body: paragraph("What about peak season?"),
      created_at: new Date("2026-01-01")
    });
    await createAssumptionComment(db, assumption.id, user.id, {
      body: paragraph("Is the CDN counted?"),
      created_at: new Date("2026-01-02")
    });
    const summary: EvaluationResult = { rating: "partially_addressed", evaluation: "Peak season is not covered." };
    const model = mockModel(
      { rating: "not_addressed", evaluation: "Ignores seasonal peaks" },
      { rating: "addressed", evaluation: "Nothing to add" },
      summary
    );

    const result = await AssumptionEvaluationService.evaluateAssumption(assumption, db, model);

    expect(result).toEqual(summary);
    expect(model.doGenerateCalls).toHaveLength(3);
    expect(promptText(model, 2)).toContain("Ignores seasonal peaks");
    expect(promptText(model, 2)).not.toContain("Nothing to add");
  });
});
