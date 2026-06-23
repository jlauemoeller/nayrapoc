"use server";

import { ActionResult, actionResult, FieldError } from "@/lib/actions/types";
import { SignupService } from "@/lib/services/signupService";
import { TenantUserSignupInput, User, tenantUserSignupSchema } from "@/lib/models/user";

type SignupField = keyof TenantUserSignupInput | "root";

export async function signupTenantUser(
  input: TenantUserSignupInput
): Promise<ActionResult<User<"with-account">, FieldError<SignupField>>> {
  const validatedInput = tenantUserSignupSchema.parse(input);
  const result = await SignupService.claimAccount(validatedInput);
  return actionResult(result, tenantUserSignupSchema.keyof().options);
}
