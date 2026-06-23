import { AccountRecord, NewAccountRecord } from "@/lib/models/account";
import { AccountWithOwnerResult } from "@/lib/models/relations";
import { DbConnection } from "@/lib/db/connection";
import { Result } from "neverthrow";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { guarded, notNull, RecordError } from "@/lib/repositories/repository";
import { users, accounts } from "@/lib/db/schema";

export type AccountRecordError = RecordError<AccountRecord>;

export class AccountRepository {
  static async get(id: string, connection: DbConnection = db): Promise<AccountRecord | undefined> {
    return await connection.query.accounts.findFirst({
      where: eq(accounts.id, id)
    });
  }

  static async getWithOwner(id: string, connection: DbConnection = db): Promise<AccountWithOwnerResult | undefined> {
    const [found] = await connection
      .select({
        account: accounts,
        owner: users
      })
      .from(accounts)
      .innerJoin(users, eq(users.id, accounts.owner_id))
      .where(eq(accounts.id, id));

    return found;
  }

  static async list(connection: DbConnection = db): Promise<AccountRecord[]> {
    return await connection.query.accounts.findMany();
  }

  static async listWithOwner(connection: DbConnection = db): Promise<AccountWithOwnerResult[]> {
    return await connection
      .select({
        account: accounts,
        owner: users
      })
      .from(accounts)
      .innerJoin(users, eq(users.id, accounts.owner_id));
  }

  static async create(
    accountData: NewAccountRecord,
    connection: DbConnection = db
  ): Promise<Result<AccountRecord, AccountRecordError>> {
    return guarded(async () => {
      const [account] = await connection.insert(accounts).values(accountData).returning();
      return account;
    }, [notNull("name", "Name cannot be empty")]);
  }

  static async update(
    id: string,
    accountData: Partial<NewAccountRecord>,
    connection: DbConnection = db
  ): Promise<Result<AccountRecord, RecordError<AccountRecord>>> {
    return guarded(async () => {
      const [account] = await connection
        .update(accounts)
        .set({
          ...accountData,
          updated_at: new Date()
        })
        .where(eq(accounts.id, id))
        .returning();

      if (!account) {
        throw new Error(`update failed: Stale or invalid Account record: ${id}`);
      }

      return account;
    }, [notNull("name", "Name cannot be empty")]);
  }

  static async delete(id: string, connection: DbConnection = db): Promise<boolean> {
    const result = await connection.delete(accounts).where(eq(accounts.id, id)).returning();
    return result.length > 0;
  }
}
