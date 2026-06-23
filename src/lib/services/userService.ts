import { DbConnection } from "@/lib/db/connection";
import { Result } from "neverthrow";
import { ServiceError, toServiceErrorResult } from "@/lib/services/service";
import { UserRepository, UserRecordError } from "@/lib/repositories/userRepository";
import { db } from "@/lib/db";
import { toUserWithAccount, toUserWithAccountIfAny } from "@/lib/models/relations";
import {
  TenantUserCreateInput,
  TenantUserUpdateInput,
  User,
  UserRole,
  toNewTenantUserRecord,
  toUser,
  toUserIfAny
} from "@/lib/models/user";

export type UserServiceError = ServiceError<User>;

export function toUserServiceErrorResult(error: UserRecordError): Result<never, UserServiceError> {
  return toServiceErrorResult(error);
}

export class UserService {
  static async get(userId: string, connection: DbConnection = db): Promise<User | undefined> {
    const userRecord = await UserRepository.get(userId, connection);
    return toUserIfAny(userRecord);
  }

  static async getByEmail(email: string, connection: DbConnection = db): Promise<User | undefined> {
    const userRecord = await UserRepository.getByEmail(email, connection);
    return toUserIfAny(userRecord);
  }

  static async getWithAccount(
    userId: string,
    connection: DbConnection = db
  ): Promise<User<"with-account"> | undefined> {
    const record = await UserRepository.getWithAccount(userId, connection);
    return toUserWithAccountIfAny(record);
  }

  static async list(connection: DbConnection = db): Promise<User[]> {
    const records = await UserRepository.list(connection);
    return records.map(toUser);
  }

  static async listWithAccount(connection: DbConnection = db): Promise<User<"with-account">[]> {
    const records = await UserRepository.listWithAccount(connection);
    return records.map(toUserWithAccount);
  }

  static async listForAccount(accountId: string, connection: DbConnection = db): Promise<User[]> {
    const records = await UserRepository.listForAccount(accountId, connection);
    return records.map(toUser);
  }

  static async createTenantUser(
    input: TenantUserCreateInput,
    connection: DbConnection = db
  ): Promise<Result<User, UserServiceError>> {
    const normalized = {
      ...input,
      email: input.email.toLowerCase().trim(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      domain: "tenant"
    };

    const userData = toNewTenantUserRecord(normalized);
    const record = await UserRepository.create(userData, connection);
    return record.map(toUser).orElse(toUserServiceErrorResult);
  }

  static async update(
    userId: string,
    input: TenantUserUpdateInput,
    connection: DbConnection = db
  ): Promise<Result<User, UserServiceError>> {
    const normalized = {
      ...input,
      email: input.email?.toLowerCase().trim(),
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim()
    };

    const updatedUserRecord = await UserRepository.update(
      userId,
      {
        first_name: normalized.firstName,
        last_name: normalized.lastName,
        email: normalized.email
      },
      connection
    );
    return updatedUserRecord.map(toUser).orElse(toUserServiceErrorResult);
  }

  static async assignAccount(
    userId: string,
    accountId: string,
    role: UserRole,
    connection: DbConnection = db
  ): Promise<Result<User, UserServiceError>> {
    const record = await UserRepository.update(userId, { account_id: accountId, role: role }, connection);
    return record.map(toUser).orElse(toUserServiceErrorResult);
  }

  static async delete(userId: string, connection: DbConnection = db): Promise<boolean> {
    return await UserRepository.delete(userId, connection);
  }
}
