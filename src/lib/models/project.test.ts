import { describe, it, expect } from "vitest";
import {
  toProject,
  toProjectIfAny,
  toProjectCreateRecord,
  toProjectDecisionCounts,
  projectCreateSchema,
  projectFormSchema,
  projectUpdateSchema,
  ProjectRecord
} from "./project";
import { expectSchemaToBeSubset } from "@/lib/testing/schemas";

const fixture = {
  name: "name",
  description: [],
  accountId: "00000000-0000-7000-8000-000000000001",
  creatorId: "00000000-0000-7000-8000-000000000002"
};

describe("projectCreateSchema", () => {
  it("trims whitespace from name", () => {
    const result = projectCreateSchema.safeParse({ ...fixture, name: "  MyProject  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("MyProject");
  });

  it("rejects a whitespace-only name", () => {
    const result = projectCreateSchema.safeParse({ ...fixture, name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a null name", () => {
    expect(projectCreateSchema.safeParse({ ...fixture, name: null }).success).toBe(false);
  });

  it("rejects description documents that do not conform to blockDocumentSchema", () => {
    expect(projectCreateSchema.safeParse({ ...fixture, description: {} }).success).toBe(false);
  });

  it("rejects null description documents", () => {
    expect(projectCreateSchema.safeParse({ ...fixture, description: null }).success).toBe(false);
  });

  it("allows undefined description documents", () => {
    expect(projectCreateSchema.safeParse({ ...fixture, description: undefined }).success).toBe(true);
  });

  it("rejects accountId that isn't a uuid", () => {
    expect(projectCreateSchema.safeParse({ ...fixture, accountId: "A" }).success).toBe(false);
  });

  it("rejects null accountId", () => {
    expect(projectCreateSchema.safeParse({ ...fixture, accountId: null }).success).toBe(false);
  });

  it("rejects creatorId that isn't a uuid", () => {
    expect(projectCreateSchema.safeParse({ ...fixture, creatorId: "A" }).success).toBe(false);
  });

  it("rejects null creatorId", () => {
    expect(projectCreateSchema.safeParse({ ...fixture, creatorId: null }).success).toBe(false);
  });
});

describe("projectFormSchema", () => {
  it("is derived from projectCreateSchema", () => {
    expectSchemaToBeSubset(projectCreateSchema, projectFormSchema, ["name", "description"]);
  });
});

describe("projectUpdateSchema", () => {
  it("trims whitespace from name", () => {
    const result = projectUpdateSchema.safeParse({ ...fixture, name: "  MyProject  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("MyProject");
  });

  it("rejects a whitespace-only name", () => {
    const result = projectUpdateSchema.safeParse({ ...fixture, name: "   " });
    expect(result.success).toBe(false);
  });

  it("allows a missing name", () => {
    expect(projectUpdateSchema.safeParse({ ...fixture, name: undefined }).success).toBe(true);
  });

  it("rejects description documents that do not conform to blockDocumentSchema", () => {
    expect(projectUpdateSchema.safeParse({ ...fixture, description: {} }).success).toBe(false);
  });

  it("rejects null description documents", () => {
    expect(projectUpdateSchema.safeParse({ ...fixture, description: null }).success).toBe(false);
  });

  it("allows undefined description documents", () => {
    expect(projectUpdateSchema.safeParse({ ...fixture, description: undefined }).success).toBe(true);
  });

  it("only allows name and description to be set", () => {
    const result = projectUpdateSchema.safeParse(fixture);

    expect(result.data).toEqual({
      name: fixture.name,
      description: fixture.description
    });
  });
});

const projectRecordFixture: ProjectRecord = {
  id: "00000000-0000-7000-8000-000000000001",
  name: "name",
  description: [],
  account_id: "00000000-0000-7000-8000-000000000002",
  creator_id: "00000000-0000-7000-8000-000000000003",
  created_at: new Date("2026-09-15T00:00:00"),
  updated_at: new Date("2026-09-15T00:00:01")
};

describe("toProject", () => {
  it("copies correct fields from DB record", () => {
    const record = projectRecordFixture;
    expect(toProject(record)).toEqual({
      id: record.id,
      name: record.name,
      description: record.description,
      accountId: record.account_id,
      creatorId: record.creator_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  });

  it("translates null description to undefined", () => {
    const record = { ...projectRecordFixture, description: null };
    expect(toProject(record).description).toBe(undefined);
  });
});

describe("toProjectIfAny", () => {
  it("behaves like toProject when given a project record", () => {
    expect(toProjectIfAny(projectRecordFixture)).toEqual(toProject(projectRecordFixture));
  });

  it("returns undefined if given undefined", () => {
    expect(toProjectIfAny(undefined)).toBe(undefined);
  });
});

describe("toProjectCreateRecord", () => {
  it("copies correct fields from input", () => {
    const input = {
      name: "name",
      description: [],
      accountId: "00000000-0000-7000-8000-000000000002",
      creatorId: "00000000-0000-7000-8000-000000000003"
    };

    expect(toProjectCreateRecord(input)).toEqual({
      name: input.name,
      description: input.description,
      account_id: input.accountId,
      creator_id: input.creatorId
    });
  });
});

describe("toProjectDecisionCounts", () => {
  it("copies correct fields from input", () => {
    const input = {
      account_id: "00000000-0000-7000-8000-000000000001",
      project_id: "00000000-0000-7000-8000-000000000002",
      proposed: 1,
      active: 2,
      rejected: 3,
      retired: 4,
      total: 10
    };

    expect(toProjectDecisionCounts(input)).toEqual({
      accountId: input.account_id,
      projectId: input.project_id,
      proposed: input.proposed,
      active: input.active,
      rejected: input.rejected,
      retired: input.retired,
      total: input.total
    });
  });
});
