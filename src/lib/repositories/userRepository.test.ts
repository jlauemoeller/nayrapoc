import { describe, it, expect } from "vitest";
import { UserRepository } from "@lib/repositories/userRepository";
import { setupTestDb } from "@lib/testing/dbTest";
import { createUser, createUserWithAccount } from "@lib/testing/factories";

const { db } = setupTestDb();
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UserRepository", () => {
  describe("list", () => {
    it("returns all users", async () => {
      await createUser(db);
      await createUser(db);

      const result = await UserRepository.list(db);

      expect(result).toHaveLength(2);
    });

    it("returns an empty array when no users exist", async () => {
      const result = await UserRepository.list(db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithAccount", () => {
    it("returns only users that have an account, joined with their account", async () => {
      const { user, account } = await createUserWithAccount(db);
      await createUser(db); // no account — should not appear

      const result = await UserRepository.listWithAccount(db);

      expect(result).toHaveLength(1);
      expect(result[0].user.id).toBe(user.id);
      expect(result[0].account.id).toBe(account.id);
    });

    it("returns an empty array when no users have accounts", async () => {
      await createUser(db);

      const result = await UserRepository.listWithAccount(db);

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("get", () => {
    it("returns the user when found", async () => {
      const user = await createUser(db);

      const result = await UserRepository.get(user.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(user.id);
    });

    it("returns undefined when the user does not exist", async () => {
      const result = await UserRepository.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getByEmail", () => {
    it("returns the user when found", async () => {
      const user = await createUser(db, { email: "find-me@example.com" });

      const result = await UserRepository.getByEmail("find-me@example.com", db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(user.id);
    });

    it("returns undefined when the email does not exist", async () => {
      const result = await UserRepository.getByEmail("nobody@example.com", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("create", () => {
    it("returns Ok(user) on success", async () => {
      const result = await UserRepository.create(
        { first_name: "Alice", last_name: "Smith", email: "alice@example.com", domain: "tenant" },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.email).toBe("alice@example.com");
        expect(result.value.id).toBeDefined();
      }
    });

    it("returns a RecordError on the email field on duplicate email", async () => {
      await createUser(db, { email: "duplicate@example.com" });

      const result = await UserRepository.create(
        { first_name: "Bob", last_name: "Jones", email: "duplicate@example.com", domain: "tenant" },
        db
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.field).toBe("email");
        expect(result.error.message).toBe("A user with this email already exists");
      }
    });

    // A missing account_id FK is "unexpected" — no handler is registered for it, so it
    // surfaces as an exception rather than a typed Err.
    it("throws when account_id does not exist", async () => {
      await expect(
        UserRepository.create(
          {
            first_name: "Alice",
            last_name: "Smith",
            email: "alice2@example.com",
            domain: "tenant",
            account_id: "00000000-0000-7000-8000-000000000000"
          },
          db
        )
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("update", () => {
    it("returns Ok(user) with the updated fields", async () => {
      const user = await createUser(db, { first_name: "Alice" });

      const result = await UserRepository.update(user.id, { first_name: "Bob" }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.first_name).toBe("Bob");
    });

    it("can assign a role (used to promote a new account owner)", async () => {
      const user = await createUser(db);
      expect(user.role).toBe("member");

      const result = await UserRepository.update(user.id, { role: "owner" }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.role).toBe("owner");
    });

    it("throws when the user is not found", async () => {
      await expect(
        UserRepository.update("00000000-0000-7000-8000-000000000000", { first_name: "Bob" }, db)
      ).rejects.toThrow("update failed");
    });
  });

  // -------------------------------------------------------------------------

  describe("delete", () => {
    it("returns true when the user exists", async () => {
      const user = await createUser(db);

      const result = await UserRepository.delete(user.id, db);

      expect(result).toBe(true);
    });

    it("returns false when the user does not exist", async () => {
      const result = await UserRepository.delete("00000000-0000-7000-8000-000000000000", db);

      expect(result).toBe(false);
    });

    it("actually removes the user from the database", async () => {
      const user = await createUser(db);

      await UserRepository.delete(user.id, db);

      const found = await UserRepository.get(user.id, db);
      expect(found).toBeUndefined();
    });
  });
});
