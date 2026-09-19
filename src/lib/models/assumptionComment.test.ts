import { describe, it, expect } from "vitest";
import {
  toAssumptionComment,
  toAssumptionCommentIfAny,
  toAssumptionCommentCreateRecord,
  toAssumptionCommentUpdateRecord,
  assumptionCommentCreateSchema,
  assumptionCommentFormSchema,
  assumptionCommentUpdateSchema,
  AssumptionCommentRecord
} from "./assumptionComment";
import { expectSchemaToBeSubset } from "@/lib/testing/schemas";

const fixture = {
  body: [],
  assumptionId: "00000000-0000-7000-8000-000000000001",
  creatorId: "00000000-0000-7000-8000-000000000002",
  resolverId: "00000000-0000-7000-8000-000000000003",
  resolvedAt: new Date("2026-09-15T00:00:00")
};

describe("assumptionCommentCreateSchema", () => {
  it("accepts a valid input", () => {
    expect(assumptionCommentCreateSchema.safeParse(fixture).success).toBe(true);
  });

  it("rejects body documents that do not conform to blockDocumentSchema", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, body: {} }).success).toBe(false);
  });

  it("rejects null body documents", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, body: null }).success).toBe(false);
  });

  it("allows undefined body documents", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, body: undefined }).success).toBe(true);
  });

  it("rejects assumptionId that isn't a uuid", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, assumptionId: "A" }).success).toBe(false);
  });

  it("rejects null assumptionId", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, assumptionId: null }).success).toBe(false);
  });

  it("rejects creatorId that isn't a uuid", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, creatorId: "A" }).success).toBe(false);
  });

  it("rejects null creatorId", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, creatorId: null }).success).toBe(false);
  });

  it("rejects resolverId that isn't a uuid", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, resolverId: "A" }).success).toBe(false);
  });

  it("rejects null resolverId", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, resolverId: null }).success).toBe(false);
  });

  it("allows undefined resolverId", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, resolverId: undefined }).success).toBe(true);
  });

  it("rejects resolvedAt that isn't a date", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, resolvedAt: "2026-09-15" }).success).toBe(false);
  });

  it("rejects null resolvedAt", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, resolvedAt: null }).success).toBe(false);
  });

  it("allows undefined resolvedAt", () => {
    expect(assumptionCommentCreateSchema.safeParse({ ...fixture, resolvedAt: undefined }).success).toBe(true);
  });
});

describe("assumptionCommentFormSchema", () => {
  it("is derived from assumptionCommentCreateSchema", () => {
    expectSchemaToBeSubset(assumptionCommentCreateSchema, assumptionCommentFormSchema, []);
  });
});

describe("assumptionCommentUpdateSchema", () => {
  it("rejects body documents that do not conform to blockDocumentSchema", () => {
    expect(assumptionCommentUpdateSchema.safeParse({ ...fixture, body: {} }).success).toBe(false);
  });

  it("rejects null body documents", () => {
    expect(assumptionCommentUpdateSchema.safeParse({ ...fixture, body: null }).success).toBe(false);
  });

  it("allows undefined body documents", () => {
    expect(assumptionCommentUpdateSchema.safeParse({ ...fixture, body: undefined }).success).toBe(true);
  });

  it("rejects resolverId that isn't a uuid", () => {
    expect(assumptionCommentUpdateSchema.safeParse({ ...fixture, resolverId: "A" }).success).toBe(false);
  });

  it("allows null resolverId", () => {
    expect(assumptionCommentUpdateSchema.safeParse({ ...fixture, resolverId: null }).success).toBe(true);
  });

  it("allows undefined resolverId", () => {
    expect(assumptionCommentUpdateSchema.safeParse({ ...fixture, resolverId: undefined }).success).toBe(true);
  });

  it("rejects resolvedAt that isn't a date", () => {
    expect(assumptionCommentUpdateSchema.safeParse({ ...fixture, resolvedAt: "2026-09-15" }).success).toBe(false);
  });

  it("allows null resolvedAt", () => {
    expect(assumptionCommentUpdateSchema.safeParse({ ...fixture, resolvedAt: null }).success).toBe(true);
  });

  it("allows undefined resolvedAt", () => {
    expect(assumptionCommentUpdateSchema.safeParse({ ...fixture, resolvedAt: undefined }).success).toBe(true);
  });

  it("only allows body, resolverId and resolvedAt to be set", () => {
    const result = assumptionCommentUpdateSchema.safeParse(fixture);

    expect(result.data).toEqual({
      body: fixture.body,
      resolverId: fixture.resolverId,
      resolvedAt: fixture.resolvedAt
    });
  });
});

const assumptionCommentRecordFixture: AssumptionCommentRecord = {
  id: "00000000-0000-7000-8000-000000000001",
  body: [],
  assumption_id: "00000000-0000-7000-8000-000000000002",
  creator_id: "00000000-0000-7000-8000-000000000003",
  resolver_id: "00000000-0000-7000-8000-000000000004",
  resolved_at: new Date("2026-09-15T00:00:00"),
  created_at: new Date("2026-09-15T00:00:01"),
  updated_at: new Date("2026-09-15T00:00:02")
};

describe("toAssumptionComment", () => {
  it("copies correct fields from DB record", () => {
    const record = assumptionCommentRecordFixture;
    expect(toAssumptionComment(record)).toEqual({
      id: record.id,
      body: record.body,
      assumptionId: record.assumption_id,
      creatorId: record.creator_id,
      resolverId: record.resolver_id,
      resolvedAt: record.resolved_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  });

  it("translates null body, resolver_id and resolved_at to undefined", () => {
    const record = { ...assumptionCommentRecordFixture, body: null, resolver_id: null, resolved_at: null };
    const comment = toAssumptionComment(record);

    expect(comment.body).toBe(undefined);
    expect(comment.resolverId).toBe(undefined);
    expect(comment.resolvedAt).toBe(undefined);
  });
});

describe("toAssumptionCommentIfAny", () => {
  it("behaves like toAssumptionComment when given an assumption comment record", () => {
    expect(toAssumptionCommentIfAny(assumptionCommentRecordFixture)).toEqual(
      toAssumptionComment(assumptionCommentRecordFixture)
    );
  });

  it("returns undefined if given undefined", () => {
    expect(toAssumptionCommentIfAny(undefined)).toBe(undefined);
  });
});

describe("toAssumptionCommentCreateRecord", () => {
  it("copies correct fields from input", () => {
    const input = {
      body: [],
      assumptionId: "00000000-0000-7000-8000-000000000002",
      creatorId: "00000000-0000-7000-8000-000000000003",
      resolverId: "00000000-0000-7000-8000-000000000004",
      resolvedAt: new Date("2026-09-15T00:00:00")
    };

    expect(toAssumptionCommentCreateRecord(input)).toEqual({
      body: input.body,
      assumption_id: input.assumptionId,
      creator_id: input.creatorId,
      resolver_id: input.resolverId,
      resolved_at: input.resolvedAt
    });
  });
});

describe("toAssumptionCommentUpdateRecord", () => {
  it("copies correct fields from input", () => {
    const input = {
      body: [],
      resolverId: "00000000-0000-7000-8000-000000000004",
      resolvedAt: new Date("2026-09-15T00:00:00")
    };

    expect(toAssumptionCommentUpdateRecord(input)).toEqual({
      body: input.body,
      resolver_id: input.resolverId,
      resolved_at: input.resolvedAt
    });
  });

  it("passes null resolverId and resolvedAt through", () => {
    const input = { resolverId: null, resolvedAt: null };

    expect(toAssumptionCommentUpdateRecord(input)).toEqual({
      body: undefined,
      resolver_id: null,
      resolved_at: null
    });
  });
});
