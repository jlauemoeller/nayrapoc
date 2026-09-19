import { describe, it, expect } from "vitest";
import {
  toUser,
  toUserIfAny,
  toTenantUserCreateRecord,
  userCreateSchema,
  tenantUserSignupSchema,
  tenantUserCreateSchema,
  tenantUserFormSchema,
  tenantUserUpdateSchema,
  UserRecord
} from "./user";
import { expectSchemaToBeSubset } from "@/lib/testing/schemas";

const fixture = {
  firstName: "first",
  lastName: "last",
  email: "user@example.com"
};

describe("userCreateSchema", () => {
  it("trims whitespace from firstName", () => {
    const result = userCreateSchema.safeParse({ ...fixture, firstName: "  Ada  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.firstName).toBe("Ada");
  });

  it("rejects a whitespace-only firstName", () => {
    expect(userCreateSchema.safeParse({ ...fixture, firstName: "   " }).success).toBe(false);
  });

  it("rejects a null firstName", () => {
    expect(userCreateSchema.safeParse({ ...fixture, firstName: null }).success).toBe(false);
  });

  it("trims whitespace from lastName", () => {
    const result = userCreateSchema.safeParse({ ...fixture, lastName: "  Lovelace  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.lastName).toBe("Lovelace");
  });

  it("rejects a whitespace-only lastName", () => {
    expect(userCreateSchema.safeParse({ ...fixture, lastName: "   " }).success).toBe(false);
  });

  it("rejects a null lastName", () => {
    expect(userCreateSchema.safeParse({ ...fixture, lastName: null }).success).toBe(false);
  });

  it("trims whitespace from and lowercases email", () => {
    const result = userCreateSchema.safeParse({ ...fixture, email: "  Ada@Example.COM  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("ada@example.com");
  });

  it("rejects an invalid email", () => {
    expect(userCreateSchema.safeParse({ ...fixture, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a null email", () => {
    expect(userCreateSchema.safeParse({ ...fixture, email: null }).success).toBe(false);
  });
});

const signupFixture = {
  ...fixture,
  accountName: "account"
};

describe("tenantUserSignupSchema", () => {
  it("is derived from userCreateSchema", () => {
    expectSchemaToBeSubset(tenantUserSignupSchema, userCreateSchema, ["firstName", "lastName", "email"]);
  });

  it("trims whitespace from accountName", () => {
    const result = tenantUserSignupSchema.safeParse({ ...signupFixture, accountName: "  MyAccount  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.accountName).toBe("MyAccount");
  });

  it("rejects a whitespace-only accountName", () => {
    expect(tenantUserSignupSchema.safeParse({ ...signupFixture, accountName: "   " }).success).toBe(false);
  });

  it("rejects a null accountName", () => {
    expect(tenantUserSignupSchema.safeParse({ ...signupFixture, accountName: null }).success).toBe(false);
  });
});

const tenantFixture = {
  ...fixture,
  role: "member",
  accountId: "00000000-0000-7000-8000-000000000001"
};

describe("tenantUserCreateSchema", () => {
  it("is derived from userCreateSchema", () => {
    expectSchemaToBeSubset(tenantUserCreateSchema, userCreateSchema, ["firstName", "lastName", "email"]);
  });

  it("rejects an unknown role", () => {
    expect(tenantUserCreateSchema.safeParse({ ...tenantFixture, role: "unknown" }).success).toBe(false);
  });

  it("rejects null role", () => {
    expect(tenantUserCreateSchema.safeParse({ ...tenantFixture, role: null }).success).toBe(false);
  });

  it("rejects undefined role", () => {
    expect(tenantUserCreateSchema.safeParse({ ...tenantFixture, role: undefined }).success).toBe(false);
  });

  it("rejects accountId that isn't a uuid", () => {
    expect(tenantUserCreateSchema.safeParse({ ...tenantFixture, accountId: "A" }).success).toBe(false);
  });

  it("rejects null accountId", () => {
    expect(tenantUserCreateSchema.safeParse({ ...tenantFixture, accountId: null }).success).toBe(false);
  });

  it("allows undefined accountId", () => {
    expect(tenantUserCreateSchema.safeParse({ ...tenantFixture, accountId: undefined }).success).toBe(true);
  });
});

describe("tenantUserFormSchema", () => {
  it("is derived from tenantUserCreateSchema", () => {
    expectSchemaToBeSubset(tenantUserCreateSchema, tenantUserFormSchema, ["firstName", "lastName", "email"]);
  });
});

describe("tenantUserUpdateSchema", () => {
  it("trims whitespace from firstName", () => {
    const result = tenantUserUpdateSchema.safeParse({ ...fixture, firstName: "  Ada  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.firstName).toBe("Ada");
  });

  it("rejects a whitespace-only firstName", () => {
    expect(tenantUserUpdateSchema.safeParse({ ...fixture, firstName: "   " }).success).toBe(false);
  });

  it("rejects a missing firstName", () => {
    expect(tenantUserUpdateSchema.safeParse({ ...fixture, firstName: undefined }).success).toBe(false);
  });

  it("trims whitespace from lastName", () => {
    const result = tenantUserUpdateSchema.safeParse({ ...fixture, lastName: "  Lovelace  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.lastName).toBe("Lovelace");
  });

  it("rejects a whitespace-only lastName", () => {
    expect(tenantUserUpdateSchema.safeParse({ ...fixture, lastName: "   " }).success).toBe(false);
  });

  it("rejects a missing lastName", () => {
    expect(tenantUserUpdateSchema.safeParse({ ...fixture, lastName: undefined }).success).toBe(false);
  });

  it("trims whitespace from and lowercases email", () => {
    const result = tenantUserUpdateSchema.safeParse({ ...fixture, email: "  Ada@Example.COM  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("ada@example.com");
  });

  it("rejects an invalid email", () => {
    expect(tenantUserUpdateSchema.safeParse({ ...fixture, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a missing email", () => {
    expect(tenantUserUpdateSchema.safeParse({ ...fixture, email: undefined }).success).toBe(false);
  });

  it("only allows firstName, lastName and email to be set", () => {
    const result = tenantUserUpdateSchema.safeParse(tenantFixture);
    expect(result.data).toEqual(fixture);
  });
});

const userRecordFixture: UserRecord = {
  id: "00000000-0000-7000-8000-000000000001",
  first_name: "first",
  last_name: "last",
  email: "user@example.com",
  domain: "tenant",
  account_id: "00000000-0000-7000-8000-000000000002",
  role: "member",
  claimed_at: new Date("2026-09-15T00:00:00"),
  created_at: new Date("2026-09-15T00:00:01"),
  updated_at: new Date("2026-09-15T00:00:02")
};

describe("toUser", () => {
  it("copies correct fields from DB record", () => {
    const record = userRecordFixture;
    expect(toUser(record)).toEqual({
      id: record.id,
      firstName: record.first_name,
      lastName: record.last_name,
      email: record.email,
      domain: record.domain,
      role: record.role,
      accountId: record.account_id,
      claimedAt: record.claimed_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  });

  it("translates null account_id and claimed_at to undefined", () => {
    const record = { ...userRecordFixture, account_id: null, claimed_at: null };
    const user = toUser(record);

    expect(user.accountId).toBe(undefined);
    expect(user.claimedAt).toBe(undefined);
  });
});

describe("toUserIfAny", () => {
  it("behaves like toUser when given a user record", () => {
    expect(toUserIfAny(userRecordFixture)).toEqual(toUser(userRecordFixture));
  });

  it("returns undefined if given undefined", () => {
    expect(toUserIfAny(undefined)).toBe(undefined);
  });
});

describe("toTenantUserCreateRecord", () => {
  it("copies correct fields from input", () => {
    const input = {
      firstName: "first",
      lastName: "last",
      email: "user@example.com",
      role: "admin" as const,
      accountId: "00000000-0000-7000-8000-000000000002"
    };

    expect(toTenantUserCreateRecord(input)).toEqual({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      domain: "tenant",
      account_id: input.accountId
    });
  });
});
