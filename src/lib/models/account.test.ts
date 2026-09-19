import { describe, it, expect } from "vitest";
import {
  accountCreateSchema,
  AccountRecord,
  accountUpdateSchema,
  toAccount,
  toAccountIfAny,
  toAccountCreateRecord
} from "@/lib/models/account";

const fixture = {
  name: "account",
  ownerId: "00000000-0000-7000-8000-000000000001"
};

describe("accountCreateSchema", () => {
  it("trims whitespace from name", () => {
    const result = accountCreateSchema.safeParse({
      ...fixture,
      name: "  MyAccount "
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("MyAccount");
  });

  it("rejects empty names", () => {
    expect(accountCreateSchema.safeParse({ ...fixture, name: "" }).success).toBe(false);
  });

  it("rejects ownerId that isn't a uuid", () => {
    expect(accountCreateSchema.safeParse({ ...fixture, ownerId: "A" }).success).toBe(false);
  });
});

describe("accountUpdateSchema", () => {
  it("trims whitespace from name", () => {
    const result = accountUpdateSchema.safeParse({
      ...fixture,
      name: "  MyAccount "
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("MyAccount");
  });

  it("rejects empty names", () => {
    expect(accountUpdateSchema.safeParse({ ...fixture, name: "" }).success).toBe(false);
  });

  it("only allows name to be set", () => {
    const result = accountUpdateSchema.safeParse(fixture);
    expect(result.data).toEqual({ name: "account" });
  });
});

const accountRecordFixture: AccountRecord = {
  id: "00000000-0000-7000-8000-000000000001",
  name: "account",
  owner_id: "00000000-0000-7000-8000-000000000002",
  claimed_at: new Date("2026-09-15T00:00:00"),
  created_at: new Date("2026-09-15T00:00:01"),
  updated_at: new Date("2026-09-15T00:00:02")
};

describe("toAccount", () => {
  it("copies correct fields from DB record", () => {
    const record = accountRecordFixture;
    expect(toAccount(record)).toEqual({
      id: record.id,
      name: record.name,
      ownerId: record.owner_id,
      claimedAt: record.claimed_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  });
});

describe("toAccountIfAny", () => {
  it("behaves like toAccount if given an account record", () => {
    expect(toAccountIfAny(accountRecordFixture)).toEqual(toAccount(accountRecordFixture));
  });

  it("returns undefined if given undefined", () => {
    expect(toAccountIfAny(undefined)).toBe(undefined);
  });
});

describe("toAccountCreateRecord", () => {
  it("copies the correct fields from input", () => {
    const input = {
      name: "name",
      ownerId: "00000000-0000-7000-8000-000000000002"
    };

    expect(toAccountCreateRecord(input)).toEqual({
      name: input.name,
      owner_id: input.ownerId
    });
  });

  it("only allows name and owner id to be set", () => {
    const input = {
      id: "00000000-0000-7000-8000-000000000001",
      name: "name",
      ownerId: "00000000-0000-7000-8000-000000000002",
      claimedAt: new Date("2026-09-15T00:00:00"),
      createdAt: new Date("2026-09-15T00:00:01"),
      updatedAt: new Date("2026-09-15T00:00:02")
    };

    expect(toAccountCreateRecord(input)).toEqual({
      name: input.name,
      owner_id: input.ownerId
    });
  });
});
