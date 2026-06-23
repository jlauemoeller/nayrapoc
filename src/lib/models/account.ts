import type { User } from "@lib/models/user";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { accounts } from "@/lib/db/schema";
import { z } from "zod";

// Database types from Drizzle schema
export type AccountRecord = InferSelectModel<typeof accounts>;
export type NewAccountRecord = InferInsertModel<typeof accounts>;

// Loading context types
type LoadingContext = "basic" | "with-owner";

type LoadedFields<T extends LoadingContext> =
  T extends "with-owner" ? { owner: User }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {};

// Input validation schemas

export const accountCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ownerId: z.uuid()
});

export const accountUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ownerId: z.uuid()
});

// Domain schemas

export const accountSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  ownerId: z.uuid(),
  claimedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Inferred types from schemas

export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
export type Account<T extends LoadingContext = "basic"> = z.infer<typeof accountSchema> & LoadedFields<T>;

// Translation functions

export function toAccount(record: AccountRecord): Account<"basic"> {
  return {
    id: record.id,
    name: record.name,
    ownerId: record.owner_id,
    claimedAt: record.claimed_at || undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function toAccountIfAny(record: AccountRecord | undefined): Account<"basic"> | undefined {
  if (record) return toAccount(record);
  return undefined;
}

export function toNewAccountRecord(
  input: AccountCreateInput
): Omit<NewAccountRecord, "id" | "created_at" | "updated_at"> {
  return {
    name: input.name,
    owner_id: input.ownerId
  };
}
