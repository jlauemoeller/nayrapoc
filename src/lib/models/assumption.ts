import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { assumptions, rationaleAiRatings } from "@/lib/db/schema";
import { type Decision } from "@/lib/models/decision";
import { type User } from "@/lib/models/user";
import { z } from "zod";
import { blockDocumentSchema } from "./blockDocument";

export type AssumptionRecord = InferSelectModel<typeof assumptions>;
export type NewAssumptionRecord = InferInsertModel<typeof assumptions>;

export { rationaleAiRatings };
export type RationaleAiRatings = (typeof rationaleAiRatings)[number];

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

const titleSchema = z.string().trim().min(1, "Title is required");

export const assumptionCreateSchema = z.object({
  title: titleSchema,
  rationale: blockDocumentSchema.optional(),
  decisionId: z.uuid(),
  creatorId: z.uuid()
});

export const assumptionFormSchema = assumptionCreateSchema.pick({ title: true });

export const assumptionUpdateSchema = z.object({
  title: titleSchema.optional(),
  rationale: blockDocumentSchema.optional(),
  rationaleUpdatedAt: z.date().optional(),
  rationaleAiEvaluatedAt: z.date().optional(),
  rationaleAiRequestedAt: z.date().optional(),
  rationaleAiEvaluation: z.string().optional(),
  rationaleAiRating: z.enum(rationaleAiRatings).optional()
});

// Domain schemas

export const assumptionSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  rationale: blockDocumentSchema.optional(),
  rationaleUpdatedAt: z.date(),
  rationaleAiEvaluatedAt: z.date().optional(),
  rationaleAiRequestedAt: z.date().optional(),
  rationaleAiEvaluation: z.string().optional(),
  rationaleAiRating: z.enum(rationaleAiRatings).optional(),
  decisionId: z.uuid(),
  creatorId: z.uuid(),
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
    rationaleUpdatedAt: record.rationale_updated_at,
    rationaleAiRequestedAt: record.rationale_ai_requested_at ?? undefined,
    rationaleAiEvaluatedAt: record.rationale_ai_evaluated_at ?? undefined,
    rationaleAiEvaluation: record.rationale_ai_evaluation ?? undefined,
    rationaleAiRating: record.rationale_ai_rating ?? undefined,
    decisionId: record.decision_id,
    creatorId: record.creator_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function toAssumptionCreateRecord(
  input: AssumptionCreateInput
): Omit<NewAssumptionRecord, "id" | "created_at" | "updated_at"> {
  return {
    title: input.title,
    rationale: input.rationale,
    decision_id: input.decisionId,
    creator_id: input.creatorId
  };
}

export function toAssumptionUpdateRecord(input: AssumptionUpdateInput): Partial<NewAssumptionRecord> {
  return {
    title: input.title,
    rationale: input.rationale,
    rationale_updated_at: input.rationaleUpdatedAt,
    rationale_ai_evaluated_at: input.rationaleAiEvaluatedAt,
    rationale_ai_requested_at: input.rationaleAiRequestedAt,
    rationale_ai_evaluation: input.rationaleAiEvaluation,
    rationale_ai_rating: input.rationaleAiRating
  };
}

export const evaluationStatuses = ["missing", "pending", "outdated", "current"] as const;
export type EvaluationStatus = (typeof evaluationStatuses)[number];
export function evaluationStatus(a: Assumption): EvaluationStatus {
  if (a.rationaleAiEvaluatedAt === undefined) return "missing";
  if (a.rationaleAiRequestedAt && a.rationaleAiRequestedAt > a.rationaleAiEvaluatedAt) return "pending";
  if (a.rationaleAiEvaluatedAt < a.rationaleUpdatedAt) return "outdated";

  return "current";
}
