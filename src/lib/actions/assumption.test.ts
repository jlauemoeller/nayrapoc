import { vi, describe, it, expect, beforeEach } from "vitest";
import { actorFor, asCurrentUser, resetCurrentUser } from "../testing/actions";
import type { Block } from "@blocknote/core";
import {
  createAssumption,
  updateAssumption,
  updateAssumptionRationale,
  deleteAssumption
} from "@/lib/actions/assumption";
import { AssumptionService } from "@/lib/services/assumptionService";
import { setupTestDb } from "@lib/testing/dbTest";
import {
  createAccount,
  createAssumption as seedAssumption,
  createDecision,
  createProject
} from "@lib/testing/factories";
import { createUserWithAccountScenario } from "../testing/scenarios";

vi.mock("@/lib/authorization", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authorization")>("@/lib/authorization");
  return { ...actual, currentUser: vi.fn() };
});

const { db } = setupTestDb();

const sampleRationale = [{ id: "1", type: "paragraph", content: "Traffic stays flat" }] as unknown as Block[];

const NONEXISTENT_ID = "00000000-0000-7000-8000-000000000000";

const NOT_AUTHORIZED = { success: false, error: { field: "root", message: "Not authorized" } };

const INVALID_INPUT = { success: false, error: { field: "root", message: "Invalid input" } };

// Every create test starts from an account with a project → decision.
async function seedAccountWithDecision() {
  const { user, account } = await createUserWithAccountScenario(db);
  const project = await createProject(db, account.id, user.id);
  const decision = await createDecision(db, project.id, user.id);
  return { user, account, decision };
}

// Every update/delete test starts from an account with a project → decision → assumption.
async function seedAccountWithAssumption() {
  const { user, account, decision } = await seedAccountWithDecision();
  const assumption = await seedAssumption(db, decision.id, user.id, { title: "Old" });
  return { user, account, assumption };
}

beforeEach(() => {
  resetCurrentUser();
});

describe("assumption actions", () => {
  describe("createAssumption", () => {
    it("creates the assumption with the actor as creator and returns it", async () => {
      const { user, account, decision } = await seedAccountWithDecision();
      asCurrentUser(actorFor(user, account));

      const result = await createAssumption({ title: "Load stays flat", decisionId: decision.id });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.title).toBe("Load stays flat");
        expect(result.data.decisionId).toBe(decision.id);
        expect(result.data.creatorId).toBe(user.id);
      }
    });

    it("normalizes the title", async () => {
      const { user, account, decision } = await seedAccountWithDecision();
      asCurrentUser(actorFor(user, account));

      const result = await createAssumption({ title: "  Load stays flat  ", decisionId: decision.id });

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.title).toBe("Load stays flat");
    });

    it("rejects a blank title as invalid input", async () => {
      const { user, account, decision } = await seedAccountWithDecision();
      asCurrentUser(actorFor(user, account));

      const result = await createAssumption({ title: "   ", decisionId: decision.id });

      expect(result).toEqual(INVALID_INPUT);
      expect(await AssumptionService.listForDecision(decision.id, db)).toEqual([]);
    });

    it("denies a member (insufficient role)", async () => {
      const { user, account, decision } = await seedAccountWithDecision();
      asCurrentUser(actorFor(user, account, { role: "member" }));

      const result = await createAssumption({ title: "Nope", decisionId: decision.id });

      expect(result).toEqual(NOT_AUTHORIZED);
    });

    it("denies an actor from another account", async () => {
      const { user, account, decision } = await seedAccountWithDecision();
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await createAssumption({ title: "Trespass", decisionId: decision.id });

      expect(result).toEqual(NOT_AUTHORIZED);
      expect(await AssumptionService.listForDecision(decision.id, db)).toEqual([]);
    });

    it("denies (not found) when the decision does not exist", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await createAssumption({ title: "Orphan", decisionId: NONEXISTENT_ID });

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });

  describe("updateAssumption", () => {
    it("updates the title on success", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumption(assumption.id, { title: "New" });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.title).toBe("New");
      }
    });

    it("rejects a blank title as invalid input and leaves the row intact", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumption(assumption.id, { title: "   " });

      expect(result).toEqual(INVALID_INPUT);
      expect((await AssumptionService.get(assumption.id, db))?.title).toBe("Old");
    });

    it("denies a member (insufficient role)", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      asCurrentUser(actorFor(user, account, { role: "member" }));

      const result = await updateAssumption(assumption.id, { title: "New" });

      expect(result).toEqual(NOT_AUTHORIZED);
    });

    it("denies an actor from another account and leaves the row intact", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await updateAssumption(assumption.id, { title: "New" });

      expect(result).toEqual(NOT_AUTHORIZED);
      expect((await AssumptionService.get(assumption.id, db))?.title).toBe("Old");
    });

    it("denies (not found) when the assumption does not exist", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumption(NONEXISTENT_ID, { title: "New" });

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });

  describe("updateAssumptionRationale", () => {
    it("persists the rationale document on success", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumptionRationale(assumption.id, sampleRationale);

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.rationale).toEqual(sampleRationale);
    });

    it("rejects a malformed document as invalid input", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumptionRationale(assumption.id, [{ bogus: true }] as unknown as Block[]);

      expect(result).toEqual(INVALID_INPUT);
      expect((await AssumptionService.get(assumption.id, db))?.rationale).toBeUndefined();
    });

    it("denies a member (insufficient role)", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      asCurrentUser(actorFor(user, account, { role: "member" }));

      const result = await updateAssumptionRationale(assumption.id, sampleRationale);

      expect(result).toEqual(NOT_AUTHORIZED);
    });

    it("denies an actor from another account", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await updateAssumptionRationale(assumption.id, sampleRationale);

      expect(result).toEqual(NOT_AUTHORIZED);
    });

    it("denies (not found) when the assumption does not exist", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await updateAssumptionRationale(NONEXISTENT_ID, sampleRationale);

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });

  describe("deleteAssumption", () => {
    it("deletes the assumption and returns success", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      asCurrentUser(actorFor(user, account));

      const result = await deleteAssumption(assumption.id);

      expect(result).toEqual({ success: true, data: undefined });
      expect(await AssumptionService.get(assumption.id, db)).toBeUndefined();
    });

    it("denies a member and leaves the row intact", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      asCurrentUser(actorFor(user, account, { role: "member" }));

      const result = await deleteAssumption(assumption.id);

      expect(result).toEqual(NOT_AUTHORIZED);
      expect(await AssumptionService.get(assumption.id, db)).toBeDefined();
    });

    it("denies an actor from another account and leaves the row intact", async () => {
      const { user, account, assumption } = await seedAccountWithAssumption();
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await deleteAssumption(assumption.id);

      expect(result).toEqual(NOT_AUTHORIZED);
      expect(await AssumptionService.get(assumption.id, db)).toBeDefined();
    });

    it("denies (not found) when the assumption does not exist", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await deleteAssumption(NONEXISTENT_ID);

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });
});
