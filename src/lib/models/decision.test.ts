import { describe, it, expect } from "vitest";
import {
  toDecision,
  toDecisionIfAny,
  toDecisionCreateRecord,
  decisionCreateSchema,
  decisionFormSchema,
  decisionUpdateSchema,
  DecisionRecord
} from "./decision";
import { expectSchemaToBeSubset } from "@/lib/testing/schemas";

const fixture = {
  title: "title",
  rationale: [],
  projectId: "00000000-0000-7000-8000-000000000001",
  creatorId: "00000000-0000-7000-8000-000000000002"
};

describe("decisionCreateSchema", () => {
  it("trims whitespace from title", () => {
    const result = decisionCreateSchema.safeParse({ ...fixture, title: "  Use Postgres  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Use Postgres");
  });

  it("rejects a whitespace-only title", () => {
    const result = decisionCreateSchema.safeParse({ ...fixture, title: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a null title", () => {
    expect(decisionCreateSchema.safeParse({ ...fixture, title: null }).success).toBe(false);
  });

  it("rejects rationale documents that do not conform to blockDocumentSchema", () => {
    expect(decisionCreateSchema.safeParse({ ...fixture, rationale: {} }).success).toBe(false);
  });

  it("rejects null rationale documents", () => {
    expect(decisionCreateSchema.safeParse({ ...fixture, rationale: null }).success).toBe(false);
  });

  it("allows undefined rationale documents", () => {
    expect(decisionCreateSchema.safeParse({ ...fixture, rationale: undefined }).success).toBe(true);
  });

  it("rejects projectId that isn't a uuid", () => {
    expect(decisionCreateSchema.safeParse({ ...fixture, projectId: "A" }).success).toBe(false);
  });

  it("rejects null projectId", () => {
    expect(decisionCreateSchema.safeParse({ ...fixture, projectId: null }).success).toBe(false);
  });

  it("rejects creatorId that isn't a uuid", () => {
    expect(decisionCreateSchema.safeParse({ ...fixture, creatorId: "A" }).success).toBe(false);
  });

  it("rejects null creatorId", () => {
    expect(decisionCreateSchema.safeParse({ ...fixture, creatorId: null }).success).toBe(false);
  });

  it("does not allow state to be set", () => {
    const result = decisionCreateSchema.safeParse({ ...fixture, state: "active" });
    expect(result.data).toEqual(fixture);
  });
});

describe("decisionFormSchema", () => {
  it("is derived from decisionCreateSchema", () => {
    expectSchemaToBeSubset(decisionCreateSchema, decisionFormSchema, ["title"]);
  });
});

const updateFixture = {
  title: "title",
  state: "active",
  reviewBy: new Date("2026-09-15T00:00:00"),
  reviewedAt: new Date("2026-09-15T00:00:01")
};

describe("decisionUpdateSchema", () => {
  it("trims whitespace from title", () => {
    const result = decisionUpdateSchema.safeParse({ ...updateFixture, title: "  Use Postgres  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Use Postgres");
  });

  it("rejects a whitespace-only title", () => {
    const result = decisionUpdateSchema.safeParse({ ...updateFixture, title: "   " });
    expect(result.success).toBe(false);
  });

  it("allows a missing title", () => {
    expect(decisionUpdateSchema.safeParse({ ...updateFixture, title: undefined }).success).toBe(true);
  });

  it("rejects an unknown state", () => {
    expect(decisionUpdateSchema.safeParse({ ...updateFixture, state: "unknown" }).success).toBe(false);
  });

  it("rejects null state", () => {
    expect(decisionUpdateSchema.safeParse({ ...updateFixture, state: null }).success).toBe(false);
  });

  it("allows undefined state", () => {
    expect(decisionUpdateSchema.safeParse({ ...updateFixture, state: undefined }).success).toBe(true);
  });

  it("rejects reviewBy that isn't a date", () => {
    expect(decisionUpdateSchema.safeParse({ ...updateFixture, reviewBy: "2026-09-15" }).success).toBe(false);
  });

  it("allows null reviewBy", () => {
    expect(decisionUpdateSchema.safeParse({ ...updateFixture, reviewBy: null }).success).toBe(true);
  });

  it("allows undefined reviewBy", () => {
    expect(decisionUpdateSchema.safeParse({ ...updateFixture, reviewBy: undefined }).success).toBe(true);
  });

  it("rejects reviewedAt that isn't a date", () => {
    expect(decisionUpdateSchema.safeParse({ ...updateFixture, reviewedAt: "2026-09-15" }).success).toBe(false);
  });

  it("allows null reviewedAt", () => {
    expect(decisionUpdateSchema.safeParse({ ...updateFixture, reviewedAt: null }).success).toBe(true);
  });

  it("allows undefined reviewedAt", () => {
    expect(decisionUpdateSchema.safeParse({ ...updateFixture, reviewedAt: undefined }).success).toBe(true);
  });

  it("only allows title, state, reviewBy and reviewedAt to be set", () => {
    const result = decisionUpdateSchema.safeParse({ ...fixture, ...updateFixture });
    expect(result.data).toEqual(updateFixture);
  });
});

const decisionRecordFixture: DecisionRecord = {
  id: "00000000-0000-7000-8000-000000000001",
  title: "title",
  rationale: [],
  state: "active",
  project_id: "00000000-0000-7000-8000-000000000002",
  creator_id: "00000000-0000-7000-8000-000000000003",
  review_by: new Date("2026-09-15T00:00:00"),
  reviewed_at: new Date("2026-09-15T00:00:01"),
  created_at: new Date("2026-09-15T00:00:02"),
  updated_at: new Date("2026-09-15T00:00:03")
};

describe("toDecision", () => {
  it("copies correct fields from DB record", () => {
    const record = decisionRecordFixture;
    expect(toDecision(record)).toEqual({
      id: record.id,
      title: record.title,
      rationale: record.rationale,
      state: record.state,
      projectId: record.project_id,
      creatorId: record.creator_id,
      reviewBy: record.review_by,
      reviewedAt: record.reviewed_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  });

  it("translates null rationale, review_by and reviewed_at to undefined", () => {
    const record = { ...decisionRecordFixture, rationale: null, review_by: null, reviewed_at: null };
    const decision = toDecision(record);

    expect(decision.rationale).toBe(undefined);
    expect(decision.reviewBy).toBe(undefined);
    expect(decision.reviewedAt).toBe(undefined);
  });
});

describe("toDecisionIfAny", () => {
  it("behaves like toDecision when given a decision record", () => {
    expect(toDecisionIfAny(decisionRecordFixture)).toEqual(toDecision(decisionRecordFixture));
  });

  it("returns undefined if given undefined", () => {
    expect(toDecisionIfAny(undefined)).toBe(undefined);
  });
});

describe("toDecisionCreateRecord", () => {
  it("copies correct fields from input", () => {
    const input = {
      title: "title",
      rationale: [],
      projectId: "00000000-0000-7000-8000-000000000002",
      creatorId: "00000000-0000-7000-8000-000000000003"
    };

    expect(toDecisionCreateRecord(input)).toEqual({
      title: input.title,
      rationale: input.rationale,
      project_id: input.projectId,
      creator_id: input.creatorId
    });
  });
});
