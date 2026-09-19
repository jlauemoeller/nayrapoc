import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { assumptionComments } from "@/lib/db/schema";
import { type Assumption } from "@/lib/models/assumption";
import { type User } from "@/lib/models/user";
import { z } from "zod";
import { blockDocumentSchema } from "./blockDocument";

// Database types from Drizzle schema
export type AssumptionCommentRecord = InferSelectModel<typeof assumptionComments>;
export type NewAssumptionCommentRecord = InferInsertModel<typeof assumptionComments>;

// Loading context types.
// `creator` is the assumption comments's own author; `decision` is always loaded via the assumption.
type LoadingContext =
  | "basic"
  | "with-assumption"
  | "with-assumption-and-creator"
  | "with-assumption-creator-and-resolver"
  | "with-creator"
  | "with-creator-and-resolver";

type LoadedFields<T extends LoadingContext> =
  T extends "with-assumption" ? { assumption: Assumption }
  : T extends "with-assumption-and-creator" ? { assumption: Assumption; creator: User }
  : T extends "with-assumption-creator-and-resolver" ?
    { assumption: Assumption; creator: User; resolver: User | undefined }
  : T extends "with-creator" ? { creator: User }
  : T extends "with-creator-and-resolver" ? { creator: User; resolver: User | undefined }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {};

// Input validation schemas

export const assumptionCommentCreateSchema = z.object({
  body: blockDocumentSchema.optional(),
  assumptionId: z.uuid(),
  creatorId: z.uuid(),
  resolverId: z.uuid().optional(),
  resolvedAt: z.date().optional()
});

// The fields the create form actually collects. `assumptionId` is contextual (route/props)
// and `creatorId` is server-derived (the actor) — neither is user-editable. Shared by the
// form resolver and the action's `actionResult` field set so client-attributable errors
// line up on both sides.
export const assumptionCommentFormSchema = assumptionCommentCreateSchema.pick({});

// `null` and `undefined` mean different things on update: `null` clears the column,
// `undefined` (or an omitted key) leaves it alone — Drizzle skips undefined values in
// `.set()`. Unresolving a comment therefore has to send `null`, so these are nullable.
export const assumptionCommentUpdateSchema = z.object({
  body: blockDocumentSchema.optional(),
  resolvedAt: z.date().nullable().optional(),
  resolverId: z.uuid().nullable().optional()
});

// Domain schemas

export const assumptionCommentSchema = z.object({
  id: z.uuid(),
  body: blockDocumentSchema.optional(),
  assumptionId: z.uuid(),
  creatorId: z.uuid(),
  resolverId: z.uuid().optional(),
  resolvedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Inferred types from schemas
export type AssumptionCommentCreateInput = z.infer<typeof assumptionCommentCreateSchema>;
export type AssumptionCommentFormInput = z.infer<typeof assumptionCommentFormSchema>;
export type AssumptionCommentUpdateInput = z.infer<typeof assumptionCommentUpdateSchema>;
export type AssumptionComment<T extends LoadingContext = "basic"> = z.infer<typeof assumptionCommentSchema> &
  LoadedFields<T>;

// Translation functions between database and domain models
export function toAssumptionCommentIfAny(
  record: AssumptionCommentRecord | undefined
): AssumptionComment<"basic"> | undefined {
  if (record) return toAssumptionComment(record);
  return undefined;
}

export function toAssumptionComment(record: AssumptionCommentRecord): AssumptionComment<"basic"> {
  return {
    id: record.id,
    body: record.body ?? undefined,
    assumptionId: record.assumption_id,
    creatorId: record.creator_id,
    resolverId: record.resolver_id ?? undefined,
    resolvedAt: record.resolved_at ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function toAssumptionCommentCreateRecord(
  input: AssumptionCommentCreateInput
): Omit<NewAssumptionCommentRecord, "id" | "created_at" | "updated_at"> {
  return {
    body: input.body,
    assumption_id: input.assumptionId,
    creator_id: input.creatorId,
    resolver_id: input.resolverId,
    resolved_at: input.resolvedAt
  };
}

export function toAssumptionCommentUpdateRecord(
  input: AssumptionCommentUpdateInput
): Partial<Pick<NewAssumptionCommentRecord, "body" | "resolver_id" | "resolved_at">> {
  return {
    body: input.body,
    resolver_id: input.resolverId,
    resolved_at: input.resolvedAt
  };
}
