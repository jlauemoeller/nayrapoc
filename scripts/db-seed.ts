import { eq } from "drizzle-orm";
import { db } from "@lib/db";
import { users, accounts } from "@lib/db/schema";
import { generateId } from "@lib/db/uuid";
import { transaction } from "@lib/db/connection";

const STAFF_EMAIL = "staff@example.com";
const TENANT_EMAIL = "tenant@example.com";
const ACCOUNT_NAME = "Seed Account";

async function main() {
  const existingStaff = await db.select({ id: users.id }).from(users).where(eq(users.email, STAFF_EMAIL)).limit(1);

  if (existingStaff.length > 0) {
    console.log("Seed data already present, skipping.");
    return;
  }

  await transaction(async (tx) => {
    // 1. Insert staff user without account_id (circular FK)
    const staffId = generateId();
    await tx.insert(users).values({
      id: staffId,
      first_name: "Staff",
      last_name: "User",
      email: STAFF_EMAIL,
      domain: "staff",
      role: "owner",
      account_id: null
    });

    // 2. Insert account owned by staff user
    const accountId = generateId();
    await tx.insert(accounts).values({
      id: accountId,
      name: ACCOUNT_NAME,
      owner_id: staffId
    });

    // 3. Link staff user back to account
    await tx.update(users).set({ account_id: accountId }).where(eq(users.id, staffId));

    // 4. Insert tenant user linked to the account
    await tx.insert(users).values({
      id: generateId(),
      first_name: "Tenant",
      last_name: "User",
      email: TENANT_EMAIL,
      domain: "tenant",
      role: "member",
      account_id: accountId
    });
  });

  console.log(`Seeded: staff user (${STAFF_EMAIL}), account (${ACCOUNT_NAME}), tenant user (${TENANT_EMAIL}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
