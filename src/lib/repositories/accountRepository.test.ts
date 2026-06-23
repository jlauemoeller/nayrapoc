import { describe, it, expect } from "vitest";
import { AccountRepository } from "@lib/repositories/accountRepository";
import { setupTestDb } from "@lib/testing/dbTest";
import { createUser, createAccount, createUserWithAccount } from "@lib/testing/factories";

const { db } = setupTestDb();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AccountRepository", () => {
  describe("list", () => {
    it("returns all accounts", async () => {
      const { user } = await createUserWithAccount(db);
      await createAccount(db, user.id, { name: "Second Account" });

      const result = await AccountRepository.list(db);

      expect(result).toHaveLength(2);
    });

    it("returns an empty array when no accounts exist", async () => {
      const result = await AccountRepository.list(db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithOwner", () => {
    it("returns accounts joined with their owner", async () => {
      const { user, account } = await createUserWithAccount(db);

      const result = await AccountRepository.listWithOwner(db);

      expect(result).toHaveLength(1);
      expect(result[0].account.id).toBe(account.id);
      expect(result[0].owner.id).toBe(user.id);
    });

    it("returns an empty array when no accounts exist", async () => {
      const result = await AccountRepository.listWithOwner(db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithOwner", () => {
    it("returns the account joined with its owner", async () => {
      const { user, account } = await createUserWithAccount(db);

      const result = await AccountRepository.getWithOwner(account.id, db);

      expect(result).toBeDefined();
      expect(result!.account.id).toBe(account.id);
      expect(result!.owner.id).toBe(user.id);
    });

    it("returns undefined when the account does not exist", async () => {
      const result = await AccountRepository.getWithOwner("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("get", () => {
    it("returns the account when found", async () => {
      const { account } = await createUserWithAccount(db);

      const result = await AccountRepository.get(account.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(account.id);
    });

    it("returns undefined when the account does not exist", async () => {
      const result = await AccountRepository.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("create", () => {
    it("returns Ok(account) on success", async () => {
      const user = await createUser(db);

      const result = await AccountRepository.create({ name: "Acme Corp", owner_id: user.id }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Acme Corp");
        expect(result.value.id).toBeDefined();
      }
    });

    // A missing owner_id FK is "unexpected" — no handler is registered, so it throws rather
    // than returning a typed Err.
    it("throws when owner_id does not exist", async () => {
      await expect(
        AccountRepository.create(
          { name: "Ghost Account", owner_id: "00000000-0000-7000-8000-000000000000" },
          db
        )
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("update", () => {
    it("returns Ok(account) with the updated fields", async () => {
      const { account } = await createUserWithAccount(db, {}, { name: "Old Name" });

      const result = await AccountRepository.update(account.id, { name: "New Name" }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.name).toBe("New Name");
    });

    it("throws when the account is not found", async () => {
      await expect(
        AccountRepository.update("00000000-0000-7000-8000-000000000000", { name: "Ghost" }, db)
      ).rejects.toThrow("update failed");
    });
  });

  // -------------------------------------------------------------------------

  describe("delete", () => {
    it("returns true when the account exists", async () => {
      const { account } = await createUserWithAccount(db);

      const result = await AccountRepository.delete(account.id, db);

      expect(result).toBe(true);
    });

    it("returns false when the account does not exist", async () => {
      const result = await AccountRepository.delete("00000000-0000-7000-8000-000000000000", db);

      expect(result).toBe(false);
    });

    it("actually removes the account from the database", async () => {
      const { account } = await createUserWithAccount(db);

      await AccountRepository.delete(account.id, db);

      const found = await AccountRepository.get(account.id, db);
      expect(found).toBeUndefined();
    });
  });
});
