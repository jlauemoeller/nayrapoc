import { describe, it, expect } from "vitest";
import { hasRole, isTenant, isStaff } from "@/lib/policies/policy";
import type { SessionUser, UserRole } from "@/lib/models/user";

const ACCOUNT_ID = "00000000-0000-0000-0000-0000000000aa";

function sessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "user@example.com",
    domain: "tenant",
    role: "member",
    accountId: ACCOUNT_ID,
    ...overrides
  };
}

describe("hasRole", () => {
  const accountId = "00000000-0000-0000-0000-0000000000aa";

  it("returns true when actor is in the account and has one of the roles", () => {
    const actor = sessionUser({ accountId, role: "admin" });
    expect(hasRole(actor, ["admin", "owner"])).toBe(true);
  });

  it("returns false when actor's role is not in the allowed list", () => {
    const actor = sessionUser({ accountId, role: "member" });
    expect(hasRole(actor, ["admin", "owner"])).toBe(false);
  });

  it("returns false when the roles list is empty", () => {
    const actor = sessionUser({ accountId, role: "owner" });
    expect(hasRole(actor, [] as UserRole[])).toBe(false);
  });
});

describe("isTenant", () => {
  it("returns true for tenant-domain users in the account", () => {
    expect(isTenant(sessionUser({ domain: "tenant" }), ACCOUNT_ID)).toBe(true);
  });

  it("returns false for staff-domain users", () => {
    expect(isTenant(sessionUser({ domain: "staff" }), ACCOUNT_ID)).toBe(false);
  });

  it("returns false for tenant users in a different account", () => {
    expect(isTenant(sessionUser({ domain: "tenant" }), "00000000-0000-0000-0000-0000000000bb")).toBe(false);
  });
});

describe("isStaff", () => {
  it("returns true for staff-domain users", () => {
    expect(isStaff(sessionUser({ domain: "staff" }))).toBe(true);
  });

  it("returns false for tenant-domain users", () => {
    expect(isStaff(sessionUser({ domain: "tenant" }))).toBe(false);
  });
});
