import { AccountRepository, AccountRecordError } from "@/lib/repositories/accountRepository";
import { DbConnection } from "@/lib/db/connection";
import { Result } from "neverthrow";
import { ServiceError, toServiceErrorResult } from "@/lib/services/service";
import { db } from "../db";
import { toAccountWithOwner, toAccountWithOwnerIfAny } from "../models/relations";
import {
  Account,
  AccountCreateInput,
  AccountUpdateInput,
  toAccount,
  toAccountIfAny,
  toNewAccountRecord
} from "@/lib/models/account";

export type AccountServiceError = ServiceError<Account>;

export function toAccountServiceErrorResult(error: AccountRecordError): Result<never, AccountServiceError> {
  return toServiceErrorResult(error);
}

export class AccountService {
  static async get(accountId: string, connection: DbConnection = db): Promise<Account | undefined> {
    const record = await AccountRepository.get(accountId, connection);
    return toAccountIfAny(record);
  }

  static async getWithOwner(
    accountId: string,
    connection: DbConnection = db
  ): Promise<Account<"with-owner"> | undefined> {
    const record = await AccountRepository.getWithOwner(accountId, connection);
    return toAccountWithOwnerIfAny(record);
  }

  static async list(connection: DbConnection = db): Promise<Account[]> {
    const records = await AccountRepository.list(connection);
    return records.map(toAccount);
  }

  static async listWithOwner(connection: DbConnection = db): Promise<Account<"with-owner">[]> {
    const records = await AccountRepository.listWithOwner(connection);
    return records.map(toAccountWithOwner);
  }

  static async create(
    input: AccountCreateInput,
    connection: DbConnection = db
  ): Promise<Result<Account, AccountServiceError>> {
    const normalized = {
      ...input,
      name: input.name.trim(),
      owner_id: input.ownerId
    };

    const accountData = toNewAccountRecord(normalized);
    const record = await AccountRepository.create(accountData, connection);
    return record.map(toAccount).orElse(toAccountServiceErrorResult);
  }

  static async update(
    accountId: string,
    input: AccountUpdateInput,
    connection: DbConnection = db
  ): Promise<Result<Account, AccountServiceError>> {
    const normalized = {
      ...input,
      name: input?.name.trim(),
      owner_id: input?.ownerId
    };

    const updated = await AccountRepository.update(
      accountId,
      { name: normalized.name, owner_id: normalized.ownerId },
      connection
    );

    return updated.map(toAccount).orElse(toAccountServiceErrorResult);
  }

  static async delete(accountId: string, connection: DbConnection = db): Promise<boolean> {
    return await AccountRepository.delete(accountId, connection);
  }
}
