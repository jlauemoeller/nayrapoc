import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import type { Block } from "@blocknote/core";
import { projects, decisions, assumptions } from "@lib/db/schema";
import { setupTestDb } from "@lib/testing/dbTest";
import {
  createUserWithAccount,
  createProject,
  createDecision,
  createAssumption
} from "@lib/testing/factories";
import { TemplateService, TEMPLATE_ACCOUNT_ID } from "@lib/templates/templateService";

const { db } = setupTestDb();

describe("TemplateService.cloneInto", () => {
  it("deep-copies the template tree into a new account, re-keyed and re-attributed", async () => {
    // Template account (fixed id) with one project -> decision -> assumption.
    const { user: templateUser } = await createUserWithAccount(db, {}, { id: TEMPLATE_ACCOUNT_ID });
    const description = [{ type: "paragraph", content: "hello" }] as unknown as Block[];
    const tProject = await createProject(db, TEMPLATE_ACCOUNT_ID, templateUser.id, {
      name: "Template Project",
      description
    });
    const tDecision = await createDecision(db, tProject.id, templateUser.id, {
      title: "Template Decision",
      state: "active",
      review_by: new Date("2030-01-01T00:00:00Z"),
      reviewed_at: new Date("2025-01-01T00:00:00Z")
    });
    const tAssumption = await createAssumption(db, tDecision.id, templateUser.id, {
      title: "Template Assumption",
      confidence: 3
    });

    // Fresh target account with a single user.
    const { user: newUser, account: newAccount } = await createUserWithAccount(db);

    await TemplateService.cloneInto({ accountId: newAccount.id, userId: newUser.id }, db);

    const clonedProjects = await db.select().from(projects).where(eq(projects.account_id, newAccount.id));
    expect(clonedProjects).toHaveLength(1);
    const cp = clonedProjects[0];
    expect(cp.id).not.toBe(tProject.id);
    expect(cp.name).toBe("Template Project");
    expect(cp.creator_id).toBe(newUser.id);
    expect(cp.description).toEqual(tProject.description);

    const clonedDecisions = await db.select().from(decisions).where(eq(decisions.project_id, cp.id));
    expect(clonedDecisions).toHaveLength(1);
    const cd = clonedDecisions[0];
    expect(cd.id).not.toBe(tDecision.id);
    expect(cd.title).toBe("Template Decision");
    expect(cd.state).toBe("active"); // preserved, not reset to "proposed"
    expect(cd.review_by).toEqual(tDecision.review_by);
    expect(cd.reviewed_at).toEqual(tDecision.reviewed_at);
    expect(cd.creator_id).toBe(newUser.id);

    const clonedAssumptions = await db.select().from(assumptions).where(eq(assumptions.decision_id, cd.id));
    expect(clonedAssumptions).toHaveLength(1);
    const ca = clonedAssumptions[0];
    expect(ca.id).not.toBe(tAssumption.id);
    expect(ca.title).toBe("Template Assumption");
    expect(ca.confidence).toBe(3);
    expect(ca.creator_id).toBe(newUser.id);

    // Template account itself is untouched.
    const templateProjects = await db.select().from(projects).where(eq(projects.account_id, TEMPLATE_ACCOUNT_ID));
    expect(templateProjects).toHaveLength(1);
    expect(templateProjects[0].id).toBe(tProject.id);
  });

  it("clones every project/decision/assumption in the tree", async () => {
    const { user: templateUser } = await createUserWithAccount(db, {}, { id: TEMPLATE_ACCOUNT_ID });
    const p1 = await createProject(db, TEMPLATE_ACCOUNT_ID, templateUser.id);
    const p2 = await createProject(db, TEMPLATE_ACCOUNT_ID, templateUser.id);
    const d1 = await createDecision(db, p1.id, templateUser.id);
    await createDecision(db, p1.id, templateUser.id);
    await createAssumption(db, d1.id, templateUser.id);
    await createAssumption(db, d1.id, templateUser.id);
    void p2;

    const { user: newUser, account: newAccount } = await createUserWithAccount(db);
    await TemplateService.cloneInto({ accountId: newAccount.id, userId: newUser.id }, db);

    const clonedProjects = await db.select().from(projects).where(eq(projects.account_id, newAccount.id));
    expect(clonedProjects).toHaveLength(2);

    const projectIds = clonedProjects.map((p) => p.id);
    const clonedDecisions = await db.select().from(decisions);
    const newDecisions = clonedDecisions.filter((d) => projectIds.includes(d.project_id));
    expect(newDecisions).toHaveLength(2);

    const decisionIds = newDecisions.map((d) => d.id);
    const clonedAssumptions = await db.select().from(assumptions);
    const newAssumptions = clonedAssumptions.filter((a) => decisionIds.includes(a.decision_id));
    expect(newAssumptions).toHaveLength(2);
  });

  it("is a no-op when no template account is seeded", async () => {
    const { user: newUser, account: newAccount } = await createUserWithAccount(db);

    await TemplateService.cloneInto({ accountId: newAccount.id, userId: newUser.id }, db);

    const rows = await db.select().from(projects).where(eq(projects.account_id, newAccount.id));
    expect(rows).toHaveLength(0);
  });
});
