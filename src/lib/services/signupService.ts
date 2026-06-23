import { AccountRepository } from "@/lib/repositories/accountRepository";
import { AccountService, AccountServiceError } from "@/lib/services/accountService";
import { DbConnection, transactionResult } from "@/lib/db/connection";
import { Result, ok, err } from "neverthrow";
import { ServiceError, toServiceErrorResult } from "@/lib/services/service";
import { UserRepository } from "@/lib/repositories/userRepository";
import { UserService, UserServiceError } from "@/lib/services/userService";
import { db } from "@/lib/db";
import { TenantUserSignupInput, User } from "@/lib/models/user";
import { Account } from "@/lib/models/account";

export type MarkClaimedError = "not_found";

export type SignupServiceError = ServiceError<User | Account>;

export function toSignupServiceErrorResult(
  error: UserServiceError | AccountServiceError
): Result<never, SignupServiceError> {
  return toServiceErrorResult(error);
}

export class SignupService {
  static async claimAccount(
    tenantInput: TenantUserSignupInput,
    connection: DbConnection = db
  ): Promise<Result<User<"with-account">, SignupServiceError>> {
    const result = await transactionResult(
      async (tx): Promise<Result<User<"with-account">, UserServiceError | AccountServiceError>> => {
        const normalized = {
          firstName: tenantInput.firstName,
          lastName: tenantInput.lastName,
          email: tenantInput.email,
          role: "member" as const
        };

        const userResult = await UserService.createTenantUser(normalized, tx);
        if (userResult.isErr()) return err(userResult.error);
        const user = userResult.value;

        const accountResult = await AccountService.create({ name: tenantInput.accountName, ownerId: user.id }, tx);
        if (accountResult.isErr()) return err(accountResult.error);
        const account = accountResult.value;

        const assigned = await UserService.assignAccount(user.id, account.id, "owner", tx);
        if (assigned.isErr()) return err(assigned.error);

        const owner = await UserService.getWithAccount(account.ownerId, tx);
        if (!owner) {
          console.error(`Cannot find owner with id ${account.ownerId} for new account`, account, user);
          throw new Error(`Cannot find owner with id ${account.ownerId} for newly created account`);
        }

        return ok(owner);
      },
      connection
    );

    return result.orElse(toSignupServiceErrorResult);
  }

  static async markClaimed(userId: string, connection: DbConnection = db): Promise<Result<void, MarkClaimedError>> {
    return await transactionResult(async (tx) => {
      const record = await UserRepository.get(userId, tx);
      if (!record) return err("not_found");
      if (record.claimed_at) return ok(undefined);

      const now = new Date();
      const userUpdate = await UserRepository.update(userId, { claimed_at: now }, tx);
      if (userUpdate.isErr()) {
        throw new Error(`Failed to mark user ${userId} as claimed: ${userUpdate.error.message}`);
      }

      if (record.account_id) {
        const accountUpdate = await AccountRepository.update(record.account_id, { claimed_at: now }, tx);
        if (accountUpdate.isErr()) {
          throw new Error(`Failed to mark account ${record.account_id} as claimed: ${accountUpdate.error.message}`);
        }
      }

      return ok(undefined);
    }, connection);
  }
}
