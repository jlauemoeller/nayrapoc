import { describe, it, expect, beforeEach, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { actorFor, asCurrentUser, resetCurrentUser } from "../testing/actions";
import type { Block } from "@blocknote/core";
import { createDecision, updateDecision, updateDecisionRationale, deleteDecision } from "@/lib/actions/decision";
import { DecisionService } from "@/lib/services/decisionService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAccount, createDecision as seedDecision, createProject } from "@lib/testing/factories";
import { createUserWithAccountScenario } from "../testing/scenarios";

vi.mock("@/lib/authorization", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authorization")>("@/lib/authorization");
  return { ...actual, currentUser: vi.fn() };
});

// revalidatePath needs a Next.js request context, which tests don't have.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { db } = setupTestDb();

const sampleRationale = [{ id: "1", type: "paragraph", content: "Boring technology wins" }] as unknown as Block[];

const NONEXISTENT_ID = "00000000-0000-7000-8000-000000000000";

beforeEach(() => {
  resetCurrentUser();
  vi.mocked(revalidatePath).mockClear();
});

describe("decision actions", () => {
  describe("createDecision", () => {
    it("creates the decision and returns it on success", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      const project = await createProject(db, account.id, user.id);
      asCurrentUser(actorFor(user, account));

      const result = await createDecision({ title: "Use Postgres", projectId: project.id });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Use Postgres");
        expect(result.data.projectId).toBe(project.id);
        expect(result.data.creatorId).toBe(user.id);
      }
    });

    it("revalidates the project page so the new decision shows up", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      const project = await createProject(db, account.id, user.id);
      asCurrentUser(actorFor(user, account));

      await createDecision({ title: "Use Postgres", projectId: project.id });

      expect(revalidatePath).toHaveBeenCalledWith(`/projects/${project.id}`);
    });

    it("denies a member (insufficient role)", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      const project = await createProject(db, account.id, user.id);
      asCurrentUser(actorFor(user, account, { role: "member" }));

      const result = await createDecision({ title: "Nope", projectId: project.id });

      expect(result).toEqual({
        success: false,
        error: { field: "root", message: "Not authorized" }
      });
    });

    it("denies (not found) when the project does not exist", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await createDecision({ title: "Orphan", projectId: NONEXISTENT_ID });

      expect(result).toEqual({
        success: false,
        error: { field: "root", message: "Not authorized" }
      });
    });
  });

  describe("updateDecision", () => {
    it("updates the title on success", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await seedDecision(db, project.id, user.id, { title: "Old" });
      asCurrentUser(actorFor(user, account));

      const result = await updateDecision(decision.id, { title: "New" });

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.title).toBe("New");
    });

    it("denies an actor from another account", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await seedDecision(db, project.id, user.id);
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await updateDecision(decision.id, { title: "Hijack" });

      expect(result).toEqual({
        success: false,
        error: { field: "root", message: "Not authorized" }
      });
    });

    it("denies (not found) when the decision does not exist", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await updateDecision(NONEXISTENT_ID, { title: "Ghost" });

      expect(result).toEqual({
        success: false,
        error: { field: "root", message: "Not authorized" }
      });
    });
  });

  describe("updateDecisionRationale", () => {
    it("persists the rationale document on success", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await seedDecision(db, project.id, user.id);
      asCurrentUser(actorFor(user, account));

      const result = await updateDecisionRationale(decision.id, sampleRationale);

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.rationale).toEqual(sampleRationale);
    });

    it("denies an actor from another account", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await seedDecision(db, project.id, user.id);
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await updateDecisionRationale(decision.id, sampleRationale);

      expect(result).toEqual({
        success: false,
        error: { field: "root", message: "Not authorized" }
      });
    });
  });

  describe("deleteDecision", () => {
    it("deletes the decision and returns success", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await seedDecision(db, project.id, user.id);
      asCurrentUser(actorFor(user, account));

      const result = await deleteDecision(decision.id);

      expect(result).toEqual({ success: true, data: undefined });
      expect(await DecisionService.get(decision.id, db)).toBeUndefined();
    });

    it("denies an actor from another account and leaves the row intact", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await seedDecision(db, project.id, user.id);
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await deleteDecision(decision.id);

      expect(result).toEqual({
        success: false,
        error: { field: "root", message: "Not authorized" }
      });
      expect(await DecisionService.get(decision.id, db)).toBeDefined();
    });

    it("denies (not found) when the decision does not exist", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await deleteDecision(NONEXISTENT_ID);

      expect(result).toEqual({
        success: false,
        error: { field: "root", message: "Not authorized" }
      });
    });
  });
});
