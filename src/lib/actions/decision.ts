"use server";

import type { Block } from "@blocknote/core";
import { revalidatePath } from "next/cache";
import {
  ActionResult,
  FieldError,
  actionErrorResult,
  actionResult,
  invalidInput,
  notAuthorized
} from "@/lib/actions/types";
import {
  Decision,
  DecisionCreateInput,
  DecisionFormInput,
  DecisionUpdateInput,
  decisionCreateSchema,
  decisionFormSchema,
  decisionUpdateSchema
} from "@/lib/models/decision";
import { DecisionService } from "@/lib/services/decisionService";
import { ProjectService } from "@/lib/services/projectService";
import { canCreateDecision, canUpdateDecision, canDeleteDecision } from "@/lib/policies/decision";
import { currentUser, isAuthorized } from "@/lib/authorization";
import { blockDocumentSchema } from "../models/blockDocument";

type DecisionCreateInputWithoutActor = Omit<DecisionCreateInput, "creatorId">;

export async function createDecision(
  input: DecisionCreateInputWithoutActor
): Promise<ActionResult<Decision, FieldError<keyof DecisionFormInput | "root">>> {
  const actor = await currentUser();
  const project = await ProjectService.get(input.projectId);

  if (!project || !isAuthorized(canCreateDecision, actor, project)) {
    return notAuthorized();
  }

  const validated = decisionCreateSchema.safeParse({
    title: input.title,
    projectId: input.projectId,
    creatorId: actor.id
  });

  if (!validated.success) {
    return invalidInput();
  }

  const result = await DecisionService.create(validated.data);
  if (result.isOk()) revalidateDecision(result.value);
  return actionResult(result, decisionFormSchema.keyof().options);
}

export async function updateDecision(
  decisionId: string,
  input: DecisionUpdateInput
): Promise<ActionResult<Decision, FieldError<keyof DecisionUpdateInput | "root">>> {
  const actor = await currentUser();
  const existing = await DecisionService.getWithProject(decisionId);

  if (!existing || !isAuthorized(canUpdateDecision, actor, existing)) {
    return notAuthorized();
  }

  const validated = decisionUpdateSchema.safeParse({
    title: input.title,
    state: input.state,
    reviewBy: input.reviewBy,
    reviewedAt: input.reviewedAt
  });

  if (!validated.success) {
    return invalidInput();
  }

  const result = await DecisionService.update(decisionId, validated.data);
  if (result.isOk()) revalidateDecision(result.value);
  return actionResult(result, decisionUpdateSchema.keyof().options);
}

export async function updateDecisionRationale(
  decisionId: string,
  document: Block[]
): Promise<ActionResult<Decision, FieldError<keyof DecisionUpdateInput | "root">>> {
  const actor = await currentUser();
  const existing = await DecisionService.getWithProject(decisionId);

  if (!existing || !isAuthorized(canUpdateDecision, actor, existing)) {
    return notAuthorized();
  }

  const validated = blockDocumentSchema.safeParse(document);

  if (!validated.success) return invalidInput();

  const result = await DecisionService.updateRationale(decisionId, validated.data);
  if (result.isOk()) revalidateDecision(result.value);
  return actionResult(result, decisionUpdateSchema.keyof().options);
}

export async function deleteDecision(decisionId: string): Promise<ActionResult<void, FieldError<"root">>> {
  const actor = await currentUser();
  const existing = await DecisionService.getWithProject(decisionId);

  if (!existing || !isAuthorized(canDeleteDecision, actor, existing)) {
    return notAuthorized();
  }

  const success = await DecisionService.delete(decisionId);

  if (!success) {
    return actionErrorResult("Could not delete decision");
  }

  revalidateDecision(existing);

  return { success: true, data: undefined };
}

// Decisions are listed on their project's page, and assumption pages show the
// decision title in their breadcrumbs.
function revalidateDecision(decision: Pick<Decision, "id" | "projectId">) {
  revalidatePath(`/projects/${decision.projectId}`);
  revalidatePath(`/decisions/${decision.id}`);
  revalidatePath("/assumptions/[assumption_id]", "page");
}
