import type { Block } from "@blocknote/core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { decisions, decisionStates } from "@/lib/db/schema";
import { type Project } from "@/lib/models/project";
import { type User } from "@/lib/models/user";
import { z } from "zod";

export type DecisionState = (typeof decisionStates)[number];

// The rationale is an opaque BlockNote document — we borrow the library's Block[]
// type (for blocksToMarkdownLossy etc.) but don't model its internal structure.
const rationaleDocument = z.custom<Block[]>(Array.isArray, "Invalid rationale document");

// Database types from Drizzle schema
export type DecisionRecord = InferSelectModel<typeof decisions>;
export type NewDecisionRecord = InferInsertModel<typeof decisions>;

// Loading context types
type LoadingContext = "basic" | "with-project" | "with-creator" | "with-project-and-creator";

type LoadedFields<T extends LoadingContext> =
  T extends "with-project" ? { project: Project }
  : T extends "with-creator" ? { creator: User }
  : T extends "with-project-and-creator" ? { project: Project; creator: User }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {};

// Input validation schemas

// `state` is intentionally absent: a decision always starts life as "proposed"
// (the DB column default) and is only ever moved between states via an update.
export const decisionCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  rationale: rationaleDocument.optional(),
  projectId: z.uuid(),
  creatorId: z.uuid()
});

// The fields the create form actually collects. `projectId` is contextual (route/props)
// and `creatorId` is server-derived (the actor) — neither is user-editable, so they're
// excluded here. This is the single source of truth shared by the form resolver and the
// action's `actionResult` field set, so client-attributable errors line up on both sides.
export const decisionFormSchema = decisionCreateSchema.pick({ title: true });

export const decisionUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  state: z.enum(decisionStates).optional(),
  reviewBy: z.date().optional().nullable(),
  reviewedAt: z.date().optional()
});

// Domain schemas

export const decisionSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  rationale: rationaleDocument.optional(),
  state: z.enum(decisionStates),
  projectId: z.uuid(),
  creatorId: z.uuid(),
  reviewBy: z.date().optional(),
  reviewedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Inferred types from schemas
export type DecisionCreateInput = z.infer<typeof decisionCreateSchema>;
export type DecisionFormInput = z.infer<typeof decisionFormSchema>;
export type DecisionUpdateInput = z.infer<typeof decisionUpdateSchema>;
export type Decision<T extends LoadingContext = "basic"> = z.infer<typeof decisionSchema> & LoadedFields<T>;

// Translation functions between database and domain models
export function toDecisionIfAny(record: DecisionRecord | undefined): Decision<"basic"> | undefined {
  if (record) return toDecision(record);
  return undefined;
}

export function toDecision(record: DecisionRecord): Decision<"basic"> {
  return {
    id: record.id,
    title: record.title,
    rationale: record.rationale ?? undefined,
    state: record.state,
    reviewBy: record.review_by ?? undefined,
    reviewedAt: record.reviewed_at ?? undefined,
    projectId: record.project_id,
    creatorId: record.creator_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function toNewDecisionRecord(
  input: DecisionCreateInput
): Omit<NewDecisionRecord, "id" | "created_at" | "updated_at"> {
  return {
    title: input.title,
    rationale: input.rationale,
    project_id: input.projectId,
    creator_id: input.creatorId
  };
}
