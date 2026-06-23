import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { users, accounts, projects } from "@lib/db/schema";
import { SignupService } from "@lib/services/signupService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createUser, createUserWithAccount } from "@lib/testing/factories";

const { db } = setupTestDb();

describe("SignupService.claimAccount", () => {
  const input = {
    firstName: "Alice",
    lastName: "Smith",
    email: "alice@example.com",
    accountName: "Acme Corp"
  };

  it("creates user and account in a single transaction", async () => {
    const result = await SignupService.claimAccount(input, db);

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;

    const owner = result.value;
    expect(owner.email).toBe("alice@example.com");
    expect(owner.account.name).toBe("Acme Corp");
    expect(owner.accountId).toBe(owner.account.id);
    expect(owner.role).toBe("owner");

    const [userRow] = await db.select().from(users).where(eq(users.id, owner.id));
    expect(userRow.account_id).toBe(owner.account.id);
    expect(userRow.role).toBe("owner");
    expect(userRow.claimed_at).toBeNull();

    const [accountRow] = await db.select().from(accounts).where(eq(accounts.id, owner.account.id));
    expect(accountRow.owner_id).toBe(owner.id);
    expect(accountRow.claimed_at).toBeNull();
  });

  it("does not create any project for the new account", async () => {
    const result = await SignupService.claimAccount(input, db);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;

    const projectRows = await db.select().from(projects);
    expect(projectRows).toHaveLength(0);
  });

  it("rolls back the entire transaction when the email is already taken", async () => {
    await createUser(db, { email: "alice@example.com" });

    const result = await SignupService.claimAccount(input, db);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.field).toBe("email");
      expect(result.error.message).toBe("A user with this email already exists");
    }

    // Only the pre-existing user should remain; no account/project should have been created.
    const userRows = await db.select().from(users);
    expect(userRows).toHaveLength(1);

    const accountRows = await db.select().from(accounts);
    expect(accountRows).toHaveLength(0);

    const projectRows = await db.select().from(projects);
    expect(projectRows).toHaveLength(0);
  });
});

describe("SignupService.markClaimed", () => {
  it("sets claimed_at on user and account when previously null", async () => {
    const { user, account } = await createUserWithAccount(db);
    expect(user.claimed_at).toBeNull();
    expect(account.claimed_at).toBeNull();

    const result = await SignupService.markClaimed(user.id, db);

    expect(result.isOk()).toBe(true);

    const [updatedUser] = await db.select().from(users).where(eq(users.id, user.id));
    const [updatedAccount] = await db.select().from(accounts).where(eq(accounts.id, account.id));

    expect(updatedUser.claimed_at).toBeInstanceOf(Date);
    expect(updatedAccount.claimed_at).toBeInstanceOf(Date);
  });

  it("is idempotent — second call leaves the original claimed_at in place", async () => {
    const { user } = await createUserWithAccount(db);

    const first = await SignupService.markClaimed(user.id, db);
    expect(first.isOk()).toBe(true);

    const [afterFirst] = await db.select().from(users).where(eq(users.id, user.id));
    const firstClaimedAt = afterFirst.claimed_at;
    expect(firstClaimedAt).toBeInstanceOf(Date);

    const second = await SignupService.markClaimed(user.id, db);
    expect(second.isOk()).toBe(true);

    const [afterSecond] = await db.select().from(users).where(eq(users.id, user.id));
    expect(afterSecond.claimed_at?.getTime()).toBe(firstClaimedAt?.getTime());
  });

  it("returns Err('not_found') when the user does not exist", async () => {
    const result = await SignupService.markClaimed("00000000-0000-7000-8000-000000000000", db);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toBe("not_found");
  });
});
