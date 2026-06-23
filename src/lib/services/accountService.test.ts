import { describe, it, expect } from "vitest";
import { AccountService } from "@lib/services/accountService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAccount, createUser, createUserWithAccount } from "@lib/testing/factories";
const { db } = setupTestDb();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AccountService", () => {
  describe("get", () => {
    it("returns the domain account when found", async () => {
      const { account } = await createUserWithAccount(db);

      const result = await AccountService.get(account.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(account.id);
      expect(result!.name).toBe(account.name);
    });

    it("returns undefined when the account does not exist", async () => {
      const result = await AccountService.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithOwner", () => {
    it("returns the account joined with its owner", async () => {
      const { user, account } = await createUserWithAccount(db);

      const result = await AccountService.getWithOwner(account.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(account.id);
      expect(result!.owner.id).toBe(user.id);
    });

    it("returns undefined when the account does not exist", async () => {
      const result = await AccountService.getWithOwner("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("list", () => {
    it("returns all accounts as domain models", async () => {
      const { user } = await createUserWithAccount(db);
      await createAccount(db, user.id, { name: "Second Account" });

      const result = await AccountService.list(db);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBeDefined();
      expect(result[0].name).toBeDefined();
    });

    it("returns an empty array when no accounts exist", async () => {
      const result = await AccountService.list(db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithOwner", () => {
    it("returns accounts joined with their owner as domain models", async () => {
      const { user, account } = await createUserWithAccount(db);

      const result = await AccountService.listWithOwner(db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(account.id);
      expect(result[0].owner.id).toBe(user.id);
    });

    it("returns an empty array when no accounts exist", async () => {
      const result = await AccountService.listWithOwner(db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("create", () => {
    it("returns Ok(account) with camelCase domain fields", async () => {
      const owner = await createUser(db);

      const result = await AccountService.create({ name: "Acme Corp", ownerId: owner.id }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Acme Corp");
        expect(result.value.ownerId).toBe(owner.id);
        expect(result.value.id).toBeDefined();
      }
    });

    it("trims whitespace from name", async () => {
      const owner = await createUser(db);

      const result = await AccountService.create({ name: "  Acme Corp  ", ownerId: owner.id }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Acme Corp");
      }
    });

    // A non-existent owner is an "unexpected" FK violation: no handler is registered, so it
    // surfaces as an exception rather than a typed Err.
    it("throws when owner does not exist", async () => {
      await expect(
        AccountService.create({ name: "Acme Corp", ownerId: "00000000-0000-7000-8000-000000000000" }, db)
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("update", () => {
    it("returns Ok(account) with updated name", async () => {
      const { user, account } = await createUserWithAccount(db);

      const result = await AccountService.update(account.id, { name: "Updated Name", ownerId: user.id }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Updated Name");
      }
    });

    it("trims whitespace from name on update", async () => {
      const { user, account } = await createUserWithAccount(db);

      const result = await AccountService.update(account.id, { name: "  Updated Name  ", ownerId: user.id }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Updated Name");
      }
    });

    it("updates the owner", async () => {
      const { account } = await createUserWithAccount(db);
      const newOwner = await createUser(db);

      const result = await AccountService.update(account.id, { name: "Acme Corp", ownerId: newOwner.id }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.ownerId).toBe(newOwner.id);
      }
    });

    it("throws when the account does not exist", async () => {
      const owner = await createUser(db);

      await expect(
        AccountService.update("00000000-0000-7000-8000-000000000000", { name: "Acme Corp", ownerId: owner.id }, db)
      ).rejects.toThrow("update failed");
    });
  });

  // -------------------------------------------------------------------------

  describe("delete", () => {
    it("returns true when the account exists", async () => {
      const { account } = await createUserWithAccount(db);

      const result = await AccountService.delete(account.id, db);

      expect(result).toBe(true);
    });

    it("actually removes the account from the database", async () => {
      const { account } = await createUserWithAccount(db);

      await AccountService.delete(account.id, db);

      const found = await AccountService.get(account.id, db);
      expect(found).toBeUndefined();
    });

    it("returns false when the account does not exist", async () => {
      const result = await AccountService.delete("00000000-0000-7000-8000-000000000000", db);

      expect(result).toBe(false);
    });
  });
});
