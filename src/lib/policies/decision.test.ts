import { describe, it, expect } from "vitest";
import {
  canListDecisions,
  canViewDecision,
  canCreateDecision,
  canUpdateDecision,
  canDeleteDecision
} from "@/lib/policies/decision";
import type { SessionUser, UserRole } from "@/lib/models/user";
import type { Decision } from "@/lib/models/decision";
import type { Project } from "@/lib/models/project";

const ACCOUNT_ID = "00000000-0000-0000-0000-0000000000aa";
const OTHER_ACCOUNT_ID = "00000000-0000-0000-0000-0000000000bb";

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

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "00000000-0000-0000-0000-000000000030",
    name: "Default",
    accountId: ACCOUNT_ID,
    creatorId: "00000000-0000-0000-0000-000000000001",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function decision(overrides: Partial<Decision<"with-project">> = {}): Decision<"with-project"> {
  return {
    id: "00000000-0000-0000-0000-000000000040",
    title: "Adopt Drizzle",
    state: "proposed",
    rationale: [{ type: "paragraph", content: "Type-safe queries" }] as unknown as Decision["rationale"],
    projectId: "00000000-0000-0000-0000-000000000030",
    creatorId: "00000000-0000-0000-0000-000000000001",
    createdAt: new Date(),
    updatedAt: new Date(),
    project: project(),
    ...overrides
  };
}

describe("canListDecisions", () => {
  it.each<UserRole>(["owner", "admin", "member"])("allows tenant %s of the project's account", (role) => {
    expect(canListDecisions(sessionUser({ role }), project())).toBe(true);
  });

  it("denies users from a different account", () => {
    expect(canListDecisions(sessionUser({ role: "owner" }), project({ accountId: OTHER_ACCOUNT_ID }))).toBe(false);
  });

  it("denies staff users", () => {
    expect(canListDecisions(sessionUser({ domain: "staff", role: "owner" }), project())).toBe(false);
  });
});

describe("canViewDecision", () => {
  it.each<UserRole>(["owner", "admin", "member"])("allows tenant %s of the decision's account", (role) => {
    expect(canViewDecision(sessionUser({ role }), decision())).toBe(true);
  });

  it("denies users from a different account", () => {
    const otherDecision = decision({ project: project({ accountId: OTHER_ACCOUNT_ID }) });
    expect(canViewDecision(sessionUser({ role: "owner" }), otherDecision)).toBe(false);
  });

  it("denies staff users", () => {
    expect(canViewDecision(sessionUser({ domain: "staff", role: "owner" }), decision())).toBe(false);
  });
});

describe("canCreateDecision", () => {
  it.each<UserRole>(["owner", "admin"])("allows tenant %s of the project's account", (role) => {
    expect(canCreateDecision(sessionUser({ role }), project())).toBe(true);
  });

  it("denies tenant members", () => {
    expect(canCreateDecision(sessionUser({ role: "member" }), project())).toBe(false);
  });

  it("denies users from a different account", () => {
    expect(canCreateDecision(sessionUser({ role: "owner" }), project({ accountId: OTHER_ACCOUNT_ID }))).toBe(false);
  });

  it("denies staff users", () => {
    expect(canCreateDecision(sessionUser({ domain: "staff", role: "owner" }), project())).toBe(false);
  });
});

describe("canUpdateDecision", () => {
  it.each<UserRole>(["owner", "admin"])("allows tenant %s of the decision's account", (role) => {
    expect(canUpdateDecision(sessionUser({ role }), decision())).toBe(true);
  });

  it("denies tenant members", () => {
    expect(canUpdateDecision(sessionUser({ role: "member" }), decision())).toBe(false);
  });

  it("denies users from a different account", () => {
    const otherDecision = decision({ project: project({ accountId: OTHER_ACCOUNT_ID }) });
    expect(canUpdateDecision(sessionUser({ role: "owner" }), otherDecision)).toBe(false);
  });

  it("denies staff users", () => {
    expect(canUpdateDecision(sessionUser({ domain: "staff", role: "owner" }), decision())).toBe(false);
  });
});

describe("canDeleteDecision", () => {
  it.each<UserRole>(["owner", "admin"])("allows tenant %s of the decision's account", (role) => {
    expect(canDeleteDecision(sessionUser({ role }), decision())).toBe(true);
  });

  it("denies tenant members", () => {
    expect(canDeleteDecision(sessionUser({ role: "member" }), decision())).toBe(false);
  });

  it("denies users from a different account", () => {
    const otherDecision = decision({ project: project({ accountId: OTHER_ACCOUNT_ID }) });
    expect(canDeleteDecision(sessionUser({ role: "owner" }), otherDecision)).toBe(false);
  });

  it("denies staff users", () => {
    expect(canDeleteDecision(sessionUser({ domain: "staff", role: "owner" }), decision())).toBe(false);
  });
});
