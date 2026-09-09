import { describe, it, expect } from "vitest";
import {
  canListAssumptionComments,
  canViewAssumptionComment,
  canCreateAssumptionComment,
  canUpdateAssumptionComment,
  canDeleteAssumptionComment
} from "@/lib/policies/assumptionComment";
import type { SessionUser, UserRole } from "@/lib/models/user";
import type { Project } from "@/lib/models/project";
import type { Decision } from "@/lib/models/decision";
import type { Assumption } from "@/lib/models/assumption";
import type { AssumptionComment } from "@/lib/models/assumptionComment";

const ACCOUNT_ID = "00000000-0000-0000-0000-0000000000aa";
const OTHER_ACCOUNT_ID = "00000000-0000-0000-0000-0000000000bb";
const USER_ID = "00000000-0000-0000-0000-000000000001";
const OTHER_USER_ID = "00000000-0000-0000-0000-000000000002";
const ASSUMPTION_ID = "00000000-0000-0000-0000-000000000050";
const OTHER_ASSUMPTION_ID = "00000000-0000-0000-0000-000000000051";

function sessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: USER_ID,
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
    creatorId: USER_ID,
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
    projectId: "00000000-0000-0000-0000-000000000030",
    creatorId: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    project: project(),
    ...overrides
  };
}

function assumption(
  overrides: Partial<Assumption<"with-decision-and-project">> = {}
): Assumption<"with-decision-and-project"> {
  return {
    id: ASSUMPTION_ID,
    title: "Postgres scales far enough",
    decisionId: "00000000-0000-0000-0000-000000000040",
    creatorId: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    decision: decision(),
    ...overrides
  };
}

function comment(overrides: Partial<AssumptionComment> = {}): AssumptionComment {
  return {
    id: "00000000-0000-0000-0000-000000000060",
    assumptionId: ASSUMPTION_ID,
    creatorId: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

// Shorthand for "the assumption lives in someone else's account".
const otherAccountAssumption = () => assumption({ decision: decision({ project: project({ accountId: OTHER_ACCOUNT_ID }) }) });

describe("canListAssumptionComments", () => {
  it.each<UserRole>(["owner", "admin", "member"])("allows tenant %s of the assumption's account", (role) => {
    expect(canListAssumptionComments(sessionUser({ role }), assumption())).toBe(true);
  });

  it("denies users from a different account", () => {
    expect(canListAssumptionComments(sessionUser({ role: "owner" }), otherAccountAssumption())).toBe(false);
  });

  it("denies staff users", () => {
    expect(canListAssumptionComments(sessionUser({ domain: "staff", role: "owner" }), assumption())).toBe(false);
  });
});

describe("canViewAssumptionComment", () => {
  it.each<UserRole>(["owner", "admin", "member"])("allows tenant %s of the assumption's account", (role) => {
    expect(canViewAssumptionComment(sessionUser({ role }), assumption())).toBe(true);
  });

  it("denies users from a different account", () => {
    expect(canViewAssumptionComment(sessionUser({ role: "owner" }), otherAccountAssumption())).toBe(false);
  });

  it("denies staff users", () => {
    expect(canViewAssumptionComment(sessionUser({ domain: "staff", role: "owner" }), assumption())).toBe(false);
  });
});

describe("canCreateAssumptionComment", () => {
  it.each<UserRole>(["owner", "admin"])("allows tenant %s of the assumption's account", (role) => {
    expect(canCreateAssumptionComment(sessionUser({ role }), assumption())).toBe(true);
  });

  it("denies tenant members", () => {
    expect(canCreateAssumptionComment(sessionUser({ role: "member" }), assumption())).toBe(false);
  });

  it("denies users from a different account", () => {
    expect(canCreateAssumptionComment(sessionUser({ role: "owner" }), otherAccountAssumption())).toBe(false);
  });

  it("denies staff users", () => {
    expect(canCreateAssumptionComment(sessionUser({ domain: "staff", role: "owner" }), assumption())).toBe(false);
  });
});

// Update and delete share the same rule: any tenant role, but only the comment's
// own creator, and only when the comment actually belongs to the given assumption.
describe.each([
  ["canUpdateAssumptionComment", canUpdateAssumptionComment],
  ["canDeleteAssumptionComment", canDeleteAssumptionComment]
])("%s", (_name, policy) => {
  it.each<UserRole>(["owner", "admin", "member"])("allows tenant %s who created the comment", (role) => {
    expect(policy(sessionUser({ role }), assumption(), comment())).toBe(true);
  });

  it("denies a user who did not create the comment, even an owner", () => {
    expect(policy(sessionUser({ role: "owner" }), assumption(), comment({ creatorId: OTHER_USER_ID }))).toBe(false);
  });

  it("denies when the comment belongs to a different assumption", () => {
    expect(policy(sessionUser({ role: "owner" }), assumption(), comment({ assumptionId: OTHER_ASSUMPTION_ID }))).toBe(
      false
    );
  });

  it("denies users from a different account", () => {
    expect(policy(sessionUser({ role: "owner" }), otherAccountAssumption(), comment())).toBe(false);
  });

  it("denies staff users", () => {
    expect(policy(sessionUser({ domain: "staff", role: "owner" }), assumption(), comment())).toBe(false);
  });
});
