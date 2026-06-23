"use server";

import {
  actionErrorResult,
  ActionResult,
  actionResult,
  FieldError,
  invalidInput,
  notAuthorized
} from "@/lib/actions/types";
import {
  TenantUserCreateInput,
  TenantUserFormInput,
  TenantUserUpdateInput,
  User,
  tenantUserCreateSchema,
  tenantUserFormSchema,
  tenantUserUpdateSchema
} from "@/lib/models/user";
import { UserService } from "@/lib/services/userService";
import { canCreateUser, canUpdateUser, canDeleteUser } from "@/lib/policies/user";
import { currentUser, isAuthorized } from "@/lib/authorization";

type TenantUserCreateInputWithoutRole = Omit<TenantUserCreateInput, "role">;

export async function createTenantUser(
  input: TenantUserCreateInputWithoutRole
): Promise<ActionResult<User, FieldError<keyof TenantUserFormInput | "root">>> {
  const actor = await currentUser();
  if (!isAuthorized(canCreateUser, actor, input.accountId || actor.accountId)) {
    return notAuthorized();
  }

  const validated = tenantUserCreateSchema.safeParse({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    accountId: input.accountId || actor.accountId,
    role: "member"
  });

  if (!validated.success) {
    return invalidInput();
  }

  const result = await UserService.createTenantUser(validated.data);
  return actionResult(result, tenantUserFormSchema.keyof().options);
}

export async function updateUser(
  userId: string,
  input: TenantUserUpdateInput
): Promise<ActionResult<User, FieldError<keyof TenantUserUpdateInput | "root">>> {
  const actor = await currentUser();
  const existing = await UserService.get(userId);

  if (!existing || !isAuthorized(canUpdateUser, actor, existing)) {
    return notAuthorized();
  }

  const validated = tenantUserUpdateSchema.safeParse({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email
  });

  if (!validated.success) {
    return invalidInput();
  }

  const result = await UserService.update(userId, validated.data);
  return actionResult(result, tenantUserUpdateSchema.keyof().options);
}

export async function deleteUser(userId: string): Promise<ActionResult<void, FieldError<"root">>> {
  const actor = await currentUser();
  const existing = await UserService.get(userId);

  if (!existing || !isAuthorized(canDeleteUser, actor, existing)) {
    return notAuthorized();
  }

  const success = await UserService.delete(userId);

  if (!success) {
    return actionErrorResult("Could not delete user");
  }

  return { success: true, data: undefined };
}
