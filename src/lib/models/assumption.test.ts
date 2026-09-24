import { describe, it, expect } from "vitest";
import {
  toAssumption,
  toAssumptionIfAny,
  toAssumptionCreateRecord,
  evaluationStatus,
  assumptionCreateSchema,
  assumptionFormSchema,
  assumptionUpdateSchema,
  AssumptionRecord
} from "./assumption";
import { buildAssumptionRecord } from "@/lib/testing/factories";
import { expectSchemaToBeSubset } from "@/lib/testing/schemas";

const fixture = {
  title: "title",
  rationale: [],
  decisionId: "00000000-0000-7000-8000-000000000001",
  creatorId: "00000000-0000-7000-8000-000000000002"
};

describe("assumptionCreateSchema", () => {
  it("trims whitespace from title", () => {
    const result = assumptionCreateSchema.safeParse({ ...fixture, title: "  Load stays flat  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Load stays flat");
  });

  it("rejects a whitespace-only title", () => {
    const result = assumptionCreateSchema.safeParse({ ...fixture, title: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a null title", () => {
    expect(assumptionCreateSchema.safeParse({ ...fixture, title: null }).success).toBe(false);
  });

  it("rejects rationale documents that do not conform to blockDocumentSchema", () => {
    expect(assumptionCreateSchema.safeParse({ ...fixture, rationale: {} }).success).toBe(false);
  });

  it("rejects null rationale documents", () => {
    expect(assumptionCreateSchema.safeParse({ ...fixture, rationale: null }).success).toBe(false);
  });

  it("allows undefined rationale documents", () => {
    expect(assumptionCreateSchema.safeParse({ ...fixture, rationale: undefined }).success).toBe(true);
  });

  it("rejects decisionId that isn't a uuid", () => {
    expect(assumptionCreateSchema.safeParse({ ...fixture, decisionId: "A" }).success).toBe(false);
  });

  it("rejects null decisionId", () => {
    expect(assumptionCreateSchema.safeParse({ ...fixture, decisionId: null }).success).toBe(false);
  });
});

describe("assumptionFormSchema", () => {
  it("is derived from assumptionCreateSchema", () => {
    expectSchemaToBeSubset(assumptionCreateSchema, assumptionFormSchema, ["title"]);
  });
});

describe("assumptionUpdateSchema", () => {
  it("trims whitespace from title", () => {
    const result = assumptionUpdateSchema.safeParse({ ...fixture, title: "  Load stays flat  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Load stays flat");
  });

  it("rejects a whitespace-only title", () => {
    const result = assumptionUpdateSchema.safeParse({ ...fixture, title: "   " });
    expect(result.success).toBe(false);
  });

  it("allows a missing title", () => {
    expect(assumptionUpdateSchema.safeParse({ ...fixture, title: undefined }).success).toBe(true);
  });

  it("strips decisionId and creatorId — they are never updatable", () => {
    const result = assumptionUpdateSchema.safeParse(fixture);

    expect(result.data).toEqual({
      title: fixture.title,
      rationale: fixture.rationale
    });
  });
});

const assumptionRecordFixture: AssumptionRecord = {
  id: "00000000-0000-7000-8000-000000000001",
  title: "title",
  rationale: [],
  rationale_updated_at: new Date("2026-09-15T00:00:00"),
  rationale_ai_requested_at: new Date("2026-09-15T00:00:01"),
  rationale_ai_evaluated_at: new Date("2026-09-15T00:00:02"),
  rationale_ai_evaluation: "evaluation",
  rationale_ai_rating: "addressed",
  decision_id: "00000000-0000-7000-8000-000000000002",
  creator_id: "00000000-0000-7000-8000-000000000003",
  created_at: new Date("2026-09-15T00:00:03"),
  updated_at: new Date("2026-09-15T00:00:04")
};

describe("toAssumption", () => {
  it("copies correct fields from DB record", () => {
    const record = assumptionRecordFixture;
    expect(toAssumption(record)).toEqual({
      id: record.id,
      title: record.title,
      rationale: record.rationale,
      rationaleUpdatedAt: record.rationale_updated_at,
      rationaleAiRequestedAt: record.rationale_ai_requested_at,
      rationaleAiEvaluatedAt: record.rationale_ai_evaluated_at,
      rationaleAiEvaluation: record.rationale_ai_evaluation,
      rationaleAiRating: record.rationale_ai_rating,
      decisionId: record.decision_id,
      creatorId: record.creator_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  });
});

describe("toAssumptionIfAny", () => {
  it("behaves like toAssumption when given an assumption record", () => {
    expect(toAssumptionIfAny(assumptionRecordFixture)).toEqual(toAssumption(assumptionRecordFixture));
  });

  it("returns undefined if given undefined", () => {
    expect(toAssumptionIfAny(undefined)).toBe(undefined);
  });
});

describe("toAssumtionCreateRecord", () => {
  it("copies correct fields from input", () => {
    const input = {
      title: "title",
      rationale: [],
      decisionId: "00000000-0000-7000-8000-000000000002",
      creatorId: "00000000-0000-7000-8000-000000000003"
    };

    expect(toAssumptionCreateRecord(input)).toEqual({
      title: input.title,
      rationale: input.rationale,
      decision_id: input.decisionId,
      creator_id: input.creatorId
    });
  });
});

describe("evaluationStatus", () => {
  it("returns 'missing' if the rationale has not been AI evaluated", () => {
    const a = toAssumption(
      buildAssumptionRecord({
        rationale_ai_evaluated_at: null
      })
    );

    expect(evaluationStatus(a)).toBe("missing");
  });

  it("returns 'outdated' if rationale was updated after the point at which it was last evaluated", () => {
    const a = toAssumption(
      buildAssumptionRecord({
        rationale_ai_evaluated_at: new Date("2026-09-15T12:00:00"),
        rationale_updated_at: new Date("2026-09-15T12:00:01")
      })
    );

    expect(evaluationStatus(a)).toBe("outdated");
  });

  it("returns 'current' if rationale was updated before the point at which it was last evaluated", () => {
    const a = toAssumption(
      buildAssumptionRecord({
        rationale_ai_evaluated_at: new Date("2026-09-15T12:00:01"),
        rationale_updated_at: new Date("2026-09-15T12:00:00")
      })
    );

    expect(evaluationStatus(a)).toBe("current");
  });

  it("returns 'pending' if rationale evaluation has been requested after last rationale evaluation", () => {
    const a = toAssumption(
      buildAssumptionRecord({
        rationale_updated_at: new Date("2026-09-15T11:59:59"),
        rationale_ai_evaluated_at: new Date("2026-09-15T12:00:00"),
        rationale_ai_requested_at: new Date("2026-09-15T12:00:01")
      })
    );

    expect(evaluationStatus(a)).toBe("pending"); // == "pending").toBe(true);
  });

  // Editing the rationale both outdates the evaluation and requests a new one; the UI
  // should show that a fresh evaluation is on its way, not that the old one is stale.
  it("returns 'pending' rather than 'outdated' when a newer evaluation has been requested", () => {
    const a = toAssumption(
      buildAssumptionRecord({
        rationale_ai_evaluated_at: new Date("2026-09-15T12:00:00"),
        rationale_updated_at: new Date("2026-09-15T12:00:01"),
        rationale_ai_requested_at: new Date("2026-09-15T12:00:01")
      })
    );

    expect(evaluationStatus(a)).toBe("pending");
  });

  it("returns 'current' if rationale evaluation timestamp is equal to rationale update timestamp", () => {
    const a = toAssumption(
      buildAssumptionRecord({
        rationale_updated_at: new Date("2026-09-15T12:00:00"),
        rationale_ai_evaluated_at: new Date("2026-09-15T12:00:00")
      })
    );

    expect(evaluationStatus(a)).toBe("current");
  });

  it("returns 'current' if rationale evaluation timestamp is after rationale update timestamp", () => {
    const a = toAssumption(
      buildAssumptionRecord({
        rationale_updated_at: new Date("2026-09-15T12:00:00"),
        rationale_ai_evaluated_at: new Date("2026-09-15T12:00:01")
      })
    );

    expect(evaluationStatus(a)).toBe("current");
  });
});
