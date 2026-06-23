import type { Block } from "@blocknote/core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { assumptions } from "@/lib/db/schema";
import { type Decision } from "@/lib/models/decision";
import { type User } from "@/lib/models/user";
import { z } from "zod";

// The rationale is an opaque BlockNote document — we borrow the library's Block[]
// type (for blocksToMarkdownLossy etc.) but don't model its internal structure.
const rationaleDocument = z.custom<Block[]>(Array.isArray, "Invalid rationale document");

// Database types from Drizzle schema
export type AssumptionRecord = InferSelectModel<typeof assumptions>;
export type NewAssumptionRecord = InferInsertModel<typeof assumptions>;

// Loading context types.
// `creator` is the assumption's own author; `project` is always loaded via the decision.
type LoadingContext =
  | "basic"
  | "with-decision"
  | "with-decision-and-project"
  | "with-decision-and-creator"
  | "with-decision-creator-and-project";

type LoadedFields<T extends LoadingContext> =
  T extends "with-decision" ? { decision: Decision }
  : T extends "with-decision-and-project" ? { decision: Decision<"with-project"> }
  : T extends "with-decision-and-creator" ? { decision: Decision; creator: User }
  : T extends "with-decision-creator-and-project" ? { decision: Decision<"with-project">; creator: User }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {};

// Input validation schemas

export const assumptionCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  rationale: rationaleDocument.optional(),
  decisionId: z.uuid(),
  creatorId: z.uuid(),
  confidence: z.number().min(0).max(5).optional()
});

// The fields the create form actually collects. `decisionId` is contextual (route/props)
// and `creatorId` is server-derived (the actor) — neither is user-editable. Shared by the
// form resolver and the action's `actionResult` field set so client-attributable errors
// line up on both sides.
export const assumptionFormSchema = assumptionCreateSchema.pick({ title: true, confidence: true });

export const assumptionUpdateSchema = z.object({
  title: z.string().optional(),
  confidence: z.number().min(0).max(5).optional()
});

// Domain schemas

export const assumptionSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  rationale: rationaleDocument.optional(),
  decisionId: z.uuid(),
  creatorId: z.uuid(),
  confidence: z.number().int().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Inferred types from schemas
export type AssumptionCreateInput = z.infer<typeof assumptionCreateSchema>;
export type AssumptionFormInput = z.infer<typeof assumptionFormSchema>;
export type AssumptionUpdateInput = z.infer<typeof assumptionUpdateSchema>;
export type Assumption<T extends LoadingContext = "basic"> = z.infer<typeof assumptionSchema> & LoadedFields<T>;

// Translation functions between database and domain models
export function toAssumptionIfAny(record: AssumptionRecord | undefined): Assumption<"basic"> | undefined {
  if (record) return toAssumption(record);
  return undefined;
}

export function toAssumption(record: AssumptionRecord): Assumption<"basic"> {
  return {
    id: record.id,
    title: record.title,
    rationale: record.rationale ?? undefined,
    decisionId: record.decision_id,
    creatorId: record.creator_id,
    confidence: record.confidence ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function toNewAssumptionRecord(
  input: AssumptionCreateInput
): Omit<NewAssumptionRecord, "id" | "created_at" | "updated_at"> {
  return {
    title: input.title,
    rationale: input.rationale,
    decision_id: input.decisionId,
    creator_id: input.creatorId,
    confidence: input.confidence
  };
}
