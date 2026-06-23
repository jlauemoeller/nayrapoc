"use server";

import type { Block } from "@blocknote/core";
import {
  ActionResult,
  FieldError,
  actionErrorResult,
  actionResult,
  invalidInput,
  notAuthorized
} from "@/lib/actions/types";
import {
  Assumption,
  AssumptionCreateInput,
  AssumptionFormInput,
  AssumptionUpdateInput,
  assumptionCreateSchema,
  assumptionFormSchema,
  assumptionUpdateSchema
} from "@/lib/models/assumption";
import { AssumptionService } from "@/lib/services/assumptionService";
import { DecisionService } from "@/lib/services/decisionService";
import { canCreateAssumption, canUpdateAssumption, canDeleteAssumption } from "@/lib/policies/assumption";
import { currentUser, isAuthorized } from "@/lib/authorization";

type AssumptionCreateInputWithoutActor = Omit<AssumptionCreateInput, "creatorId">;

export async function createAssumption(
  input: AssumptionCreateInputWithoutActor
): Promise<ActionResult<Assumption, FieldError<keyof AssumptionFormInput | "root">>> {
  const actor = await currentUser();
  const decision = await DecisionService.getWithProject(input.decisionId);

  if (!decision || !isAuthorized(canCreateAssumption, actor, decision)) {
    return notAuthorized();
  }

  const validated = assumptionCreateSchema.safeParse({
    title: input.title,
    decisionId: input.decisionId,
    creatorId: actor.id,
    confidence: input.confidence
  });

  if (!validated.success) {
    return invalidInput();
  }

  const result = await AssumptionService.create(validated.data);
  return actionResult(result, assumptionFormSchema.keyof().options);
}

export async function updateAssumption(
  assumptionId: string,
  input: AssumptionUpdateInput
): Promise<ActionResult<Assumption, FieldError<keyof AssumptionUpdateInput | "root">>> {
  const actor = await currentUser();
  const existing = await AssumptionService.getWithDecisionAndProject(assumptionId);

  if (!existing || !isAuthorized(canUpdateAssumption, actor, existing)) {
    return notAuthorized();
  }

  const validated = assumptionUpdateSchema.safeParse({
    title: input.title,
    confidence: input.confidence
  });

  if (!validated.success) {
    return invalidInput();
  }

  const result = await AssumptionService.update(assumptionId, validated.data);
  return actionResult(result, assumptionUpdateSchema.keyof().options);
}

export async function updateAssumptionRationale(
  assumptionId: string,
  document: Block[]
): Promise<ActionResult<Assumption, FieldError<keyof AssumptionUpdateInput | "root">>> {
  const actor = await currentUser();
  const existing = await AssumptionService.getWithDecisionAndProject(assumptionId);

  if (!existing || !isAuthorized(canUpdateAssumption, actor, existing)) {
    return notAuthorized();
  }

  const result = await AssumptionService.updateRationale(assumptionId, document);
  return actionResult(result, assumptionUpdateSchema.keyof().options);
}

export async function deleteAssumption(assumptionId: string): Promise<ActionResult<void, FieldError<"root">>> {
  const actor = await currentUser();
  const existing = await AssumptionService.getWithDecisionAndProject(assumptionId);

  if (!existing || !isAuthorized(canDeleteAssumption, actor, existing)) {
    return notAuthorized();
  }

  const success = await AssumptionService.delete(assumptionId);

  if (!success) {
    return actionErrorResult("Could not delete assumption");
  }

  return { success: true, data: undefined };
}
