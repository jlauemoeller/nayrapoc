import { describe, it, expect } from "vitest";
import { UserService } from "@lib/services/userService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createUser, createAccount } from "@lib/testing/factories";

const { db } = setupTestDb();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UserService", () => {
  describe("get", () => {
    it("returns the domain user when found", async () => {
      const record = await createUser(db);

      const result = await UserService.get(record.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(record.id);
      expect(result!.email).toBe(record.email);
    });

    it("returns undefined when the user does not exist", async () => {
      const result = await UserService.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getByEmail", () => {
    it("returns the domain user when found", async () => {
      const record = await createUser(db, { email: "find-me@example.com" });

      const result = await UserService.getByEmail("find-me@example.com", db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(record.id);
    });

    it("returns undefined when the email does not exist", async () => {
      const result = await UserService.getByEmail("nobody@example.com", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("createTenantUser", () => {
    it("returns Ok(user) with camelCase domain fields", async () => {
      const result = await UserService.createTenantUser(
        { firstName: "Alice", lastName: "Smith", email: "alice@example.com", role: "member" },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.firstName).toBe("Alice");
        expect(result.value.lastName).toBe("Smith");
        expect(result.value.email).toBe("alice@example.com");
        expect(result.value.id).toBeDefined();
      }
    });

    it("normalizes email to lowercase and trims whitespace", async () => {
      const result = await UserService.createTenantUser(
        { firstName: "Alice", lastName: "Smith", email: "  ALICE@EXAMPLE.COM  ", role: "member" },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.email).toBe("alice@example.com");
      }
    });

    it("trims whitespace from first and last name", async () => {
      const result = await UserService.createTenantUser(
        { firstName: "  Alice  ", lastName: "  Smith  ", email: "alice@example.com", role: "member" },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.firstName).toBe("Alice");
        expect(result.value.lastName).toBe("Smith");
      }
    });

    it("returns Err('already_exists') on duplicate email", async () => {
      await createUser(db, { email: "duplicate@example.com" });

      const result = await UserService.createTenantUser(
        { firstName: "Bob", lastName: "Jones", email: "duplicate@example.com", role: "member" },
        db
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.field).toBe("email");
        expect(result.error.message).toBe("A user with this email already exists");
      }
    });
  });

  // -------------------------------------------------------------------------

  describe("update", () => {
    it("returns Ok(user) with updated fields", async () => {
      const record = await createUser(db, { first_name: "Alice", email: "alice@example.com" });

      const result = await UserService.update(
        record.id,
        { firstName: "Bob", lastName: "Jones", email: "alice@example.com" },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.firstName).toBe("Bob");
        expect(result.value.lastName).toBe("Jones");
      }
    });

    it("normalizes email and trims name fields on update", async () => {
      const record = await createUser(db, { email: "alice@example.com" });

      const result = await UserService.update(
        record.id,
        { firstName: "  Alice  ", lastName: "  Smith  ", email: "  ALICE@EXAMPLE.COM  " },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.firstName).toBe("Alice");
        expect(result.value.lastName).toBe("Smith");
        expect(result.value.email).toBe("alice@example.com");
      }
    });

    it("throws when the user does not exist", async () => {
      await expect(
        UserService.update(
          "00000000-0000-7000-8000-000000000000",
          { firstName: "Bob", lastName: "Jones", email: "bob@example.com" },
          db
        )
      ).rejects.toThrow("update failed");
    });
  });

  // -------------------------------------------------------------------------

  describe("assignAccount", () => {
    it("sets the account and role on the user", async () => {
      const user = await createUser(db);
      const account = await createAccount(db, user.id);
      expect(user.account_id).toBeNull();
      expect(user.role).toBe("member");

      const result = await UserService.assignAccount(user.id, account.id, "owner", db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.accountId).toBe(account.id);
        expect(result.value.role).toBe("owner");
      }
    });

    it("throws when the user does not exist", async () => {
      const user = await createUser(db);
      const account = await createAccount(db, user.id);

      await expect(
        UserService.assignAccount("00000000-0000-7000-8000-000000000000", account.id, "owner", db)
      ).rejects.toThrow("update failed");
    });

    // A non-existent account is an "unexpected" error: no handler is registered for the FK
    // violation, so it surfaces as an exception rather than a typed Err.
    it("throws when the account does not exist", async () => {
      const user = await createUser(db);

      await expect(
        UserService.assignAccount(user.id, "00000000-0000-7000-8000-000000000000", "owner", db)
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("delete", () => {
    it("returns true when the user exists", async () => {
      const record = await createUser(db);

      const result = await UserService.delete(record.id, db);

      expect(result).toBe(true);
    });

    it("actually removes the user from the database", async () => {
      const record = await createUser(db);

      await UserService.delete(record.id, db);

      const found = await UserService.get(record.id, db);
      expect(found).toBeUndefined();
    });

    it("returns false when the user does not exist", async () => {
      const result = await UserService.delete("00000000-0000-7000-8000-000000000000", db);

      expect(result).toBe(false);
    });
  });
});
