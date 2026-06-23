import type { Block } from "@blocknote/core";
import { AccountRecord, type Account } from "@/lib/models/account";
import { DecisionState } from "@/lib/models/decision";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { UserRecord, type User } from "@/lib/models/user";
import { projects } from "@/lib/db/schema";
import { z } from "zod";

// Database types from Drizzle schema
export type ProjectRecord = InferSelectModel<typeof projects>;
export type NewProjectRecord = InferInsertModel<typeof projects>;

const descriptionDocument = z.custom<Block[]>(Array.isArray, "Invalid description document");

// Joined query result types
export type ProjectWithAccountResult = {
  project: ProjectRecord;
  account: AccountRecord;
};

export type ProjectWithCreatorResult = {
  project: ProjectRecord;
  creator: UserRecord;
};

// Loading context types
type LoadingContext = "basic" | "with-account" | "with-creator";

type LoadedFields<T extends LoadingContext> =
  T extends "with-account" ? { account: Account }
  : T extends "with-creator" ? { creator: User }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {};

// Input validation schemas

export const projectCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: descriptionDocument.optional(),
  accountId: z.uuid(),
  creatorId: z.uuid()
});

// The fields the create form actually collects. `accountId` is contextual (route/props)
// and `creatorId` is server-derived (the actor) — neither is user-editable. Shared by the
// form resolver and the action's `actionResult` field set so client-attributable errors
// line up on both sides.
export const projectFormSchema = projectCreateSchema.pick({ name: true, description: true });

export const projectUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: descriptionDocument.optional()
});

// Domain schemas

export const projectSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: descriptionDocument.optional(),
  accountId: z.uuid(),
  creatorId: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Inferrred types from schemas
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectFormInput = z.infer<typeof projectFormSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type Project<T extends LoadingContext = "basic"> = z.infer<typeof projectSchema> & LoadedFields<T>;

// Translation functions between database and domain models
export function toProjectIfAny(record: ProjectRecord | undefined): Project<"basic"> | undefined {
  if (record) return toProject(record);
  return undefined;
}

export function toProject(record: ProjectRecord): Project<"basic"> {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    accountId: record.account_id,
    creatorId: record.creator_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function toNewProjectRecord(
  input: ProjectCreateInput
): Omit<NewProjectRecord, "id" | "created_at" | "updated_at"> {
  return {
    name: input.name,
    description: input.description,
    account_id: input.accountId,
    creator_id: input.creatorId
  };
}

export type ProjectDecisionCountsRecord = { account_id: string; project_id: string; total: number } & Record<
  DecisionState,
  number
>;
export type ProjectDecisionCounts = { accountId: string; projectId: string; total: number } & Record<
  DecisionState,
  number
>;

export function toProjectDecisionCounts(input: ProjectDecisionCountsRecord): ProjectDecisionCounts {
  return {
    accountId: input.account_id,
    projectId: input.project_id,
    proposed: input.proposed,
    active: input.active,
    rejected: input.rejected,
    retired: input.retired,
    total: input.total
  };
}
