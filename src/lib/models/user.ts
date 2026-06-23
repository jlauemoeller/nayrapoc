import type { Account } from "@lib/models/account";
import { AccountRecord } from "@/lib/models/account";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { users, userRoles, userDomains } from "@/lib/db/schema";
import { z } from "zod";

export type UserDomain = (typeof userDomains)[number];
export type UserRole = (typeof userRoles)[number];

// Database types from Drizzle schema
export type UserRecord = InferSelectModel<typeof users>;
export type NewUserRecord = InferInsertModel<typeof users>;

// Joined query result types
export type UserWithAccountResult = {
  user: UserRecord;
  account: AccountRecord;
};

// Loading context types
type LoadingContext = "basic" | "with-account";

type LoadedFields<T extends LoadingContext> =
  T extends "with-account" ? { account: Account }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {};

// Input validation schemas

export const userCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email format")
});

export const tenantUserSignupSchema = z.object({
  ...userCreateSchema.shape,
  accountName: z.string().min(1, "Account name is required")
});

export const tenantUserCreateSchema = z.object({
  ...userCreateSchema.shape,
  role: z.enum(userRoles),
  accountId: z.uuid().optional()
});

// The fields the create form actually collects. `accountId` is contextual (route/props)
// and `role` is server-derived (defaults to "member") — neither is user-editable. Shared by
// the form resolver and the action's `actionResult` field set so client-attributable errors
// line up on both sides. (Equivalent to `userCreateSchema`, but spelled as a pick to keep the
// per-slice form-schema pattern consistent.)
export const tenantUserFormSchema = tenantUserCreateSchema.pick({ firstName: true, lastName: true, email: true });

// Profile edit only — name and email. Role and account membership are changed via the
// dedicated `UserService.assignAccount`, not here.
export const tenantUserUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email format")
});

// Domain user schemas

export const userSchema = z.object({
  id: z.uuid(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string(),
  domain: z.enum(userDomains),
  role: z.enum(userRoles),
  accountId: z.uuid().optional(),
  claimedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Inferrred types from schemas
export type TenantUserSignupInput = z.infer<typeof tenantUserSignupSchema>;
export type TenantUserCreateInput = z.infer<typeof tenantUserCreateSchema>;
export type TenantUserFormInput = z.infer<typeof tenantUserFormSchema>;
export type TenantUserUpdateInput = z.infer<typeof tenantUserUpdateSchema>;
export type User<T extends LoadingContext = "basic"> = z.infer<typeof userSchema> & LoadedFields<T>;

// Session types (shadow user for JWT)
export type SessionUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  domain: string;
  role: UserRole;
  accountId: string;
};

// Translation functions between database and domain models
export function toUser(record: UserRecord): User<"basic"> {
  return {
    id: record.id,
    firstName: record.first_name ?? undefined,
    lastName: record.last_name ?? undefined,
    email: record.email,
    domain: record.domain,
    role: record.role,
    accountId: record.account_id ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function toUserIfAny(record: UserRecord | undefined): User<"basic"> | undefined {
  if (record) return toUser(record);
  return undefined;
}

export function toNewTenantUserRecord(
  input: TenantUserCreateInput
): Omit<NewUserRecord, "id" | "created_at" | "updated_at" | "claimed_at"> {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    domain: "tenant",
    account_id: input.accountId
  };
}
