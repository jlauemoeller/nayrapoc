import { DbConnection } from "@/lib/db/connection";
import { Result } from "neverthrow";
import { UserRecord, NewUserRecord } from "@/lib/models/user";
import { UserWithAccountResult } from "../models/relations";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { guarded, notNull, unique, RecordError } from "@/lib/repositories/repository";
import { users, accounts } from "@/lib/db/schema";

export type UserRecordError = RecordError<UserRecord>;

export class UserRepository {
  static async list(connection: DbConnection = db): Promise<UserRecord[]> {
    return await connection.query.users.findMany();
  }

  static async listWithAccount(connection: DbConnection = db): Promise<UserWithAccountResult[]> {
    return await connection
      .select({
        user: users,
        account: accounts
      })
      .from(users)
      .innerJoin(accounts, eq(users.account_id, accounts.id));
  }

  static async listForAccount(accountId: string, connection: DbConnection = db): Promise<UserRecord[]> {
    return await connection.select().from(users).where(eq(users.account_id, accountId));
  }

  static async get(id: string, connection: DbConnection = db): Promise<UserRecord | undefined> {
    return await connection.query.users.findFirst({
      where: eq(users.id, id)
    });
  }

  static async getByEmail(email: string, connection: DbConnection = db): Promise<UserRecord | undefined> {
    return await connection.query.users.findFirst({
      where: eq(users.email, email)
    });
  }

  static async getWithAccount(id: string, connection: DbConnection = db): Promise<UserWithAccountResult | undefined> {
    const records = await connection
      .select({
        user: users,
        account: accounts
      })
      .from(users)
      .innerJoin(accounts, eq(users.account_id, accounts.id))
      .where(eq(users.id, id))
      .limit(1);

    return records[0];
  }

  static async create(
    userData: NewUserRecord,
    connection: DbConnection = db
  ): Promise<Result<UserRecord, UserRecordError>> {
    return guarded(async () => {
      const [user] = await connection.insert(users).values(userData).returning();
      return user;
    }, [
      unique("email", "A user with this email already exists"),
      notNull("email", "Email cannot be empty"),
      notNull("first_name", "User first name cannot be empty"),
      notNull("last_name", "User last name cannot be empty")
    ]);
  }

  static async update(
    id: string,
    userData: Partial<NewUserRecord>,
    connection: DbConnection = db
  ): Promise<Result<UserRecord, UserRecordError>> {
    return guarded(async () => {
      const [user] = await connection
        .update(users)
        .set({
          ...userData,
          updated_at: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (!user) {
        throw new Error("update failed: Stale or invalid User record reference $(id)");
      }

      return user;
    }, [
      unique("email", "A user with this email already exists"),
      notNull("email", "Email cannot be empty"),
      notNull("first_name", "User first name cannot be empty"),
      notNull("last_name", "User last name cannot be empty")
    ]);
  }

  static async delete(id: string, connection: DbConnection = db): Promise<boolean> {
    const result = await connection.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
}
