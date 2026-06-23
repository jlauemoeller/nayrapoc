import { describe, it, expect } from "vitest";
import {
  canListProjects,
  canViewProject,
  canCreateProject,
  canUpdateProject,
  canDeleteProject
} from "@/lib/policies/project";
import type { SessionUser, UserRole } from "@/lib/models/user";
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

describe("canListProjects", () => {
  it.each<UserRole>(["owner", "admin", "member"])("allows tenant %s of the account", (role) => {
    expect(canListProjects(sessionUser({ role }), ACCOUNT_ID)).toBe(true);
  });

  it("denies users from a different account", () => {
    expect(canListProjects(sessionUser({ role: "owner" }), OTHER_ACCOUNT_ID)).toBe(false);
  });

  it("denies staff users", () => {
    expect(canListProjects(sessionUser({ domain: "staff", role: "owner" }), ACCOUNT_ID)).toBe(false);
  });
});

describe("canViewProject", () => {
  it.each<UserRole>(["owner", "admin", "member"])("allows tenant %s of the project's account", (role) => {
    expect(canViewProject(sessionUser({ role }), project())).toBe(true);
  });

  it("denies users from a different account", () => {
    expect(canViewProject(sessionUser({ role: "owner", accountId: OTHER_ACCOUNT_ID }), project())).toBe(false);
  });

  it("denies staff users", () => {
    expect(canViewProject(sessionUser({ domain: "staff", role: "owner" }), project())).toBe(false);
  });
});

describe("canCreateProject", () => {
  it.each<UserRole>(["owner", "admin"])("allows tenant %s", (role) => {
    expect(canCreateProject(sessionUser({ role }), ACCOUNT_ID)).toBe(true);
  });

  it("denies tenant members", () => {
    expect(canCreateProject(sessionUser({ role: "member" }), ACCOUNT_ID)).toBe(false);
  });

  it("denies users from a different account", () => {
    expect(canCreateProject(sessionUser({ role: "owner" }), OTHER_ACCOUNT_ID)).toBe(false);
  });

  it("denies staff users", () => {
    expect(canCreateProject(sessionUser({ domain: "staff", role: "owner" }), ACCOUNT_ID)).toBe(false);
  });
});

describe("canUpdateProject", () => {
  it.each<UserRole>(["owner", "admin"])("allows tenant %s of the project's account", (role) => {
    expect(canUpdateProject(sessionUser({ role }), project())).toBe(true);
  });

  it("denies tenant members", () => {
    expect(canUpdateProject(sessionUser({ role: "member" }), project())).toBe(false);
  });

  it("denies users from a different account", () => {
    expect(canUpdateProject(sessionUser({ role: "owner", accountId: OTHER_ACCOUNT_ID }), project())).toBe(false);
  });

  it("denies staff users", () => {
    expect(canUpdateProject(sessionUser({ domain: "staff", role: "owner" }), project())).toBe(false);
  });
});

describe("canDeleteProject", () => {
  it.each<UserRole>(["owner", "admin"])("allows tenant %s of the project's account", (role) => {
    expect(canDeleteProject(sessionUser({ role }), project())).toBe(true);
  });

  it("denies tenant members", () => {
    expect(canDeleteProject(sessionUser({ role: "member" }), project())).toBe(false);
  });

  it("denies users from a different account", () => {
    expect(canDeleteProject(sessionUser({ role: "owner", accountId: OTHER_ACCOUNT_ID }), project())).toBe(false);
  });

  it("denies staff users", () => {
    expect(canDeleteProject(sessionUser({ domain: "staff", role: "owner" }), project())).toBe(false);
  });
});
