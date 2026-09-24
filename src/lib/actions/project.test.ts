import { vi, describe, it, expect, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import { actorFor, asCurrentUser, resetCurrentUser } from "../testing/actions";
import type { Block } from "@blocknote/core";
import { createProject, updateProject, deleteProject } from "@/lib/actions/project";
import { ProjectService } from "@/lib/services/projectService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAccount, createProject as seedProject } from "@lib/testing/factories";
import { createUserWithAccountScenario } from "../testing/scenarios";

vi.mock("@/lib/authorization", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authorization")>("@/lib/authorization");
  return { ...actual, currentUser: vi.fn() };
});

// revalidatePath needs a Next.js request context, which tests don't have.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { db } = setupTestDb();

const sampleDescription = [{ id: "1", type: "paragraph", content: "Ship it" }] as unknown as Block[];

const NONEXISTENT_ID = "00000000-0000-7000-8000-000000000000";

const NOT_AUTHORIZED = { success: false, error: { field: "root", message: "Not authorized" } };

const INVALID_INPUT = { success: false, error: { field: "root", message: "Invalid input" } };

// Every update/delete test starts from an account with a project.
async function seedAccountWithProject() {
  const { user, account } = await createUserWithAccountScenario(db);
  const project = await seedProject(db, account.id, user.id, { name: "Old" });
  return { user, account, project };
}

beforeEach(() => {
  resetCurrentUser();
  vi.mocked(revalidatePath).mockClear();
});

describe("project actions", () => {
  describe("createProject", () => {
    it("creates the project with the actor as creator and returns it", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await createProject({
        name: "Apollo",
        description: sampleDescription,
        accountId: account.id
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.name).toBe("Apollo");
        expect(result.data.description).toEqual(sampleDescription);
        expect(result.data.accountId).toBe(account.id);
        expect(result.data.creatorId).toBe(user.id);
      }
    });

    // Projects are listed in the sidebar, which every authenticated page renders.
    it("revalidates the whole app layout", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      await createProject({ name: "Apollo", accountId: account.id });

      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("normalizes the name", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await createProject({ name: "  Apollo  ", accountId: account.id });

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.name).toBe("Apollo");
    });

    it("rejects a blank name as invalid input", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await createProject({ name: "   ", accountId: account.id });

      expect(result).toEqual(INVALID_INPUT);
      expect(await ProjectService.listForAccount(account.id, db)).toEqual([]);
    });

    it("denies a member (insufficient role)", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account, { role: "member" }));

      const result = await createProject({ name: "Nope", accountId: account.id });

      expect(result).toEqual(NOT_AUTHORIZED);
    });

    it("denies creating a project in another account", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account));

      const result = await createProject({ name: "Trespass", accountId: otherAccount.id });

      expect(result).toEqual(NOT_AUTHORIZED);
      expect(await ProjectService.listForAccount(otherAccount.id, db)).toEqual([]);
    });
  });

  describe("updateProject", () => {
    it("updates the name and description on success", async () => {
      const { user, account, project } = await seedAccountWithProject();
      asCurrentUser(actorFor(user, account));

      const result = await updateProject(project.id, { name: "New", description: sampleDescription });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.name).toBe("New");
        expect(result.data.description).toEqual(sampleDescription);
      }
    });

    it("revalidates the whole app layout", async () => {
      const { user, account, project } = await seedAccountWithProject();
      asCurrentUser(actorFor(user, account));

      await updateProject(project.id, { name: "New" });

      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("rejects a blank name as invalid input and leaves the row intact", async () => {
      const { user, account, project } = await seedAccountWithProject();
      asCurrentUser(actorFor(user, account));

      const result = await updateProject(project.id, { name: "   " });

      expect(result).toEqual(INVALID_INPUT);
      expect((await ProjectService.get(project.id, db))?.name).toBe("Old");
    });

    it("denies a member (insufficient role)", async () => {
      const { user, account, project } = await seedAccountWithProject();
      asCurrentUser(actorFor(user, account, { role: "member" }));

      const result = await updateProject(project.id, { name: "New" });

      expect(result).toEqual(NOT_AUTHORIZED);
    });

    it("denies an actor from another account", async () => {
      const { user, account, project } = await seedAccountWithProject();
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await updateProject(project.id, { name: "New" });

      expect(result).toEqual(NOT_AUTHORIZED);
      expect((await ProjectService.get(project.id, db))?.name).toBe("Old");
    });

    it("denies (not found) when the project does not exist", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await updateProject(NONEXISTENT_ID, { name: "New" });

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });

  describe("deleteProject", () => {
    it("deletes the project and returns success", async () => {
      const { user, account, project } = await seedAccountWithProject();
      asCurrentUser(actorFor(user, account));

      const result = await deleteProject(project.id);

      expect(result).toEqual({ success: true, data: undefined });
      expect(await ProjectService.get(project.id, db)).toBeUndefined();
    });

    it("revalidates the whole app layout", async () => {
      const { user, account, project } = await seedAccountWithProject();
      asCurrentUser(actorFor(user, account));

      await deleteProject(project.id);

      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("denies a member and leaves the row intact", async () => {
      const { user, account, project } = await seedAccountWithProject();
      asCurrentUser(actorFor(user, account, { role: "member" }));

      const result = await deleteProject(project.id);

      expect(result).toEqual(NOT_AUTHORIZED);
      expect(await ProjectService.get(project.id, db)).toBeDefined();
    });

    it("denies an actor from another account and leaves the row intact", async () => {
      const { user, account, project } = await seedAccountWithProject();
      const otherAccount = await createAccount(db, user.id);
      asCurrentUser(actorFor(user, account, { accountId: otherAccount.id }));

      const result = await deleteProject(project.id);

      expect(result).toEqual(NOT_AUTHORIZED);
      expect(await ProjectService.get(project.id, db)).toBeDefined();
    });

    it("denies (not found) when the project does not exist", async () => {
      const { user, account } = await createUserWithAccountScenario(db);
      asCurrentUser(actorFor(user, account));

      const result = await deleteProject(NONEXISTENT_ID);

      expect(result).toEqual(NOT_AUTHORIZED);
    });
  });
});
