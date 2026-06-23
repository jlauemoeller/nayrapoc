import { describe, it, expect } from "vitest";
import { ProjectRepository } from "@lib/repositories/projectRepository";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAccount, createProject, createUserWithAccount } from "@lib/testing/factories";
import { Block } from "@blocknote/core";

const { db } = setupTestDb();
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProjectRepository", () => {
  describe("list", () => {
    it("returns all projects", async () => {
      const { user, account } = await createUserWithAccount(db);
      await createProject(db, account.id, user.id);
      await createProject(db, account.id, user.id);

      const result = await ProjectRepository.list(db);

      expect(result).toHaveLength(2);
    });

    it("returns an empty array when no projects exist", async () => {
      const result = await ProjectRepository.list(db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listForAccount", () => {
    it("returns only projects belonging to the given account", async () => {
      const { user, account } = await createUserWithAccount(db);
      const otherAccount = await createAccount(db, user.id, { name: "Other Account" });
      const mine = await createProject(db, account.id, user.id);
      await createProject(db, otherAccount.id, user.id);

      const result = await ProjectRepository.listForAccount(account.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mine.id);
    });

    it("returns an empty array when the account has no projects", async () => {
      const { account } = await createUserWithAccount(db);

      const result = await ProjectRepository.listForAccount(account.id, db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithAccount", () => {
    it("returns projects joined with their account", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectRepository.listWithAccount(db);

      expect(result).toHaveLength(1);
      expect(result[0].project.id).toBe(project.id);
      expect(result[0].account.id).toBe(account.id);
    });

    it("returns an empty array when no projects exist", async () => {
      const result = await ProjectRepository.listWithAccount(db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithCreator", () => {
    it("returns projects joined with their creator", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectRepository.listWithCreator(db);

      expect(result).toHaveLength(1);
      expect(result[0].project.id).toBe(project.id);
      expect(result[0].creator.id).toBe(user.id);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithCreatorForAccount", () => {
    it("returns projects with their creator, scoped to the given account", async () => {
      const { user, account } = await createUserWithAccount(db);
      const otherAccount = await createAccount(db, user.id, { name: "Other Account" });
      const mine = await createProject(db, account.id, user.id);
      await createProject(db, otherAccount.id, user.id);

      const result = await ProjectRepository.listWithCreatorForAccount(account.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].project.id).toBe(mine.id);
      expect(result[0].creator.id).toBe(user.id);
    });

    it("returns an empty array when the account has no projects", async () => {
      const { account } = await createUserWithAccount(db);

      const result = await ProjectRepository.listWithCreatorForAccount(account.id, db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("get", () => {
    it("returns the project when found", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectRepository.get(project.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(project.id);
    });

    it("returns undefined when the project does not exist", async () => {
      const result = await ProjectRepository.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithAccount", () => {
    it("returns the project joined with its account", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectRepository.getWithAccount(project.id, db);

      expect(result).toBeDefined();
      expect(result!.project.id).toBe(project.id);
      expect(result!.account.id).toBe(account.id);
    });

    it("returns undefined when the project does not exist", async () => {
      const result = await ProjectRepository.getWithAccount("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithCreator", () => {
    it("returns the project joined with its creator", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectRepository.getWithCreator(project.id, db);

      expect(result).toBeDefined();
      expect(result!.project.id).toBe(project.id);
      expect(result!.creator.id).toBe(user.id);
    });
  });

  // -------------------------------------------------------------------------

  describe("create", () => {
    it("returns Ok(project) on success", async () => {
      const { user, account } = await createUserWithAccount(db);

      const sampleDescription = [{ type: "paragraph", content: "Marketing project" }] as unknown as Block[];
      const result = await ProjectRepository.create(
        {
          name: "Marketing",
          description: sampleDescription,
          account_id: account.id,
          creator_id: user.id
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Marketing");
        expect(result.value.account_id).toBe(account.id);
        expect(result.value.creator_id).toBe(user.id);
        expect(result.value.id).toBeDefined();
      }
    });

    // Missing FKs are "unexpected" — no handler is registered, so they throw rather than
    // returning a typed Err.
    it("throws when account_id does not exist", async () => {
      const { user } = await createUserWithAccount(db);

      await expect(
        ProjectRepository.create(
          {
            name: "Orphan",
            account_id: "00000000-0000-7000-8000-000000000000",
            creator_id: user.id
          },
          db
        )
      ).rejects.toThrow();
    });

    it("throws when creator_id does not exist", async () => {
      const { account } = await createUserWithAccount(db);

      await expect(
        ProjectRepository.create(
          {
            name: "Orphan",
            account_id: account.id,
            creator_id: "00000000-0000-7000-8000-000000000000"
          },
          db
        )
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("update", () => {
    it("returns Ok(project) with the updated fields", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id, { name: "Old Name" });

      const result = await ProjectRepository.update(project.id, { name: "New Name" }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.name).toBe("New Name");
    });

    it("throws when the project is not found", async () => {
      await expect(
        ProjectRepository.update("00000000-0000-7000-8000-000000000000", { name: "Ghost" }, db)
      ).rejects.toThrow("update failed");
    });
  });

  // -------------------------------------------------------------------------

  describe("delete", () => {
    it("returns true when the project exists", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectRepository.delete(project.id, db);

      expect(result).toBe(true);
    });

    it("returns false when the project does not exist", async () => {
      const result = await ProjectRepository.delete("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBe(false);
    });

    it("actually removes the project from the database", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      await ProjectRepository.delete(project.id, db);

      const found = await ProjectRepository.get(project.id, db);
      expect(found).toBeUndefined();
    });
  });
});
