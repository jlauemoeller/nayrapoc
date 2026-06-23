import { describe, it, expect } from "vitest";
import type { Block } from "@blocknote/core";
import { ProjectService } from "@lib/services/projectService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAccount, createProject, createUserWithAccount } from "@lib/testing/factories";

const { db } = setupTestDb();

const blockDoc = (text: string): Block[] => [{ type: "paragraph", content: text }] as unknown as Block[];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProjectService", () => {
  describe("get", () => {
    it("returns the domain project when found", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectService.get(project.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(project.id);
      expect(result!.accountId).toBe(account.id);
      expect(result!.creatorId).toBe(user.id);
    });

    it("returns undefined when the project does not exist", async () => {
      const result = await ProjectService.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithAccount", () => {
    it("returns the project joined with its account", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectService.getWithAccount(project.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(project.id);
      expect(result!.account.id).toBe(account.id);
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithCreator", () => {
    it("returns the project joined with its creator", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectService.getWithCreator(project.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(project.id);
      expect(result!.creator.id).toBe(user.id);
    });
  });

  // -------------------------------------------------------------------------

  describe("list", () => {
    it("returns all projects as domain models", async () => {
      const { user, account } = await createUserWithAccount(db);
      await createProject(db, account.id, user.id);
      await createProject(db, account.id, user.id);

      const result = await ProjectService.list(db);

      expect(result).toHaveLength(2);
      expect(result[0].accountId).toBe(account.id);
      expect(result[0].creatorId).toBe(user.id);
    });

    it("returns an empty array when no projects exist", async () => {
      const result = await ProjectService.list(db);
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

      const result = await ProjectService.listForAccount(account.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mine.id);
      expect(result[0].accountId).toBe(account.id);
    });

    it("returns an empty array when the account has no projects", async () => {
      const { account } = await createUserWithAccount(db);

      const result = await ProjectService.listForAccount(account.id, db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithCreator", () => {
    it("returns projects joined with their creator as domain models", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectService.listWithCreator(db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(project.id);
      expect(result[0].creator.id).toBe(user.id);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithCreatorForAccount", () => {
    it("returns creator-joined projects scoped to the given account", async () => {
      const { user, account } = await createUserWithAccount(db);
      const otherAccount = await createAccount(db, user.id, { name: "Other Account" });
      const mine = await createProject(db, account.id, user.id);
      await createProject(db, otherAccount.id, user.id);

      const result = await ProjectService.listWithCreatorForAccount(account.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mine.id);
      expect(result[0].creator.id).toBe(user.id);
    });

    it("returns an empty array when the account has no projects", async () => {
      const { account } = await createUserWithAccount(db);

      const result = await ProjectService.listWithCreatorForAccount(account.id, db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("create", () => {
    it("returns Ok(project) with camelCase domain fields", async () => {
      const { user, account } = await createUserWithAccount(db);

      const result = await ProjectService.create(
        {
          name: "Marketing",
          description: blockDoc("A marketing project"),
          accountId: account.id,
          creatorId: user.id
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Marketing");
        expect(result.value.description).toEqual(blockDoc("A marketing project"));
        expect(result.value.accountId).toBe(account.id);
        expect(result.value.creatorId).toBe(user.id);
        expect(result.value.id).toBeDefined();
      }
    });

    it("trims whitespace from name", async () => {
      const { user, account } = await createUserWithAccount(db);

      const result = await ProjectService.create(
        {
          name: "  Marketing  ",
          description: blockDoc("desc"),
          accountId: account.id,
          creatorId: user.id
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Marketing");
      }
    });

    // Missing FKs are "unexpected" — no handler is registered, so they throw rather than
    // returning a typed Err.
    it("throws when account does not exist", async () => {
      const { user } = await createUserWithAccount(db);

      await expect(
        ProjectService.create(
          {
            name: "Orphan",
            accountId: "00000000-0000-7000-8000-000000000000",
            creatorId: user.id
          },
          db
        )
      ).rejects.toThrow();
    });

    it("throws when creator does not exist", async () => {
      const { account } = await createUserWithAccount(db);

      await expect(
        ProjectService.create(
          {
            name: "Orphan",
            accountId: account.id,
            creatorId: "00000000-0000-7000-8000-000000000000"
          },
          db
        )
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("update", () => {
    it("returns Ok(project) with updated fields", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id, { name: "Old" });

      const result = await ProjectService.update(
        project.id,
        { name: "New", description: blockDoc("New desc") },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("New");
        expect(result.value.description).toEqual(blockDoc("New desc"));
      }
    });

    it("trims whitespace from name on update", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectService.update(
        project.id,
        { name: "  Trimmed  ", description: blockDoc("desc") },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Trimmed");
      }
    });

    it("throws when the project does not exist", async () => {
      await expect(
        ProjectService.update("00000000-0000-7000-8000-000000000000", { name: "Ghost" }, db)
      ).rejects.toThrow("update failed");
    });
  });

  // -------------------------------------------------------------------------

  describe("delete", () => {
    it("returns true when the project exists", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await ProjectService.delete(project.id, db);

      expect(result).toBe(true);
    });

    it("actually removes the project from the database", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      await ProjectService.delete(project.id, db);

      const found = await ProjectService.get(project.id, db);
      expect(found).toBeUndefined();
    });

    it("returns false when the project does not exist", async () => {
      const result = await ProjectService.delete("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBe(false);
    });
  });
});
