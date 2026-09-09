"use server";

import {
  ActionResult,
  FieldError,
  actionErrorResult,
  actionResult,
  invalidInput,
  notAuthorized
} from "@/lib/actions/types";
import {
  AssumptionComment,
  AssumptionCommentCreateInput,
  AssumptionCommentFormInput,
  AssumptionCommentUpdateInput,
  assumptionCommentCreateSchema,
  assumptionCommentFormSchema,
  assumptionCommentUpdateSchema
} from "@/lib/models/assumptionComment";
import { AssumptionCommentService, AssumptionCommentServiceError } from "@/lib/services/assumptionCommentService";
import {
  canCreateAssumptionComment,
  canUpdateAssumptionComment,
  canDeleteAssumptionComment
} from "@/lib/policies/assumptionComment";
import { currentUser, isAuthorized } from "@/lib/authorization";
import { AssumptionService } from "@/lib/services/assumptionService";
import { transactionResult } from "../db/connection";
import { Result, err, ok } from "neverthrow";

type AssumptionCommentCreateInputWithoutActor = Omit<AssumptionCommentCreateInput, "creatorId">;

export async function createAssumptionComment(
  input: AssumptionCommentCreateInputWithoutActor
): Promise<
  ActionResult<AssumptionComment<"with-creator-and-resolver">, FieldError<keyof AssumptionCommentFormInput | "root">>
> {
  const actor = await currentUser();
  const assumption = await AssumptionService.getWithDecisionAndProject(input.assumptionId);

  if (!assumption || !isAuthorized(canCreateAssumptionComment, actor, assumption)) {
    return notAuthorized();
  }

  const validated = assumptionCommentCreateSchema.safeParse({
    assumptionId: input.assumptionId,
    creatorId: actor.id,
    body: input.body
  });

  if (!validated.success) {
    return invalidInput();
  }

  const result = await transactionResult(
    async (tx): Promise<Result<AssumptionComment<"with-creator-and-resolver">, AssumptionCommentServiceError>> => {
      const basic = await AssumptionCommentService.create(validated.data, tx);
      if (basic.isErr()) return err(basic.error);

      const withPreloads = await AssumptionCommentService.getWithAssumptionCreatorAndResolver(basic.value.id, tx);

      if (withPreloads) return ok(withPreloads);

      // This should never happen. It means that we failed to load relations for the
      // comment we just created in the same transaction. Panic.
      throw new Error("Could not preload fields for new assumption comment");
    }
  );

  return actionResult(result, assumptionCommentFormSchema.keyof().options);
}

export async function updateAssumptionComment(
  assumptionCommentId: string,
  input: AssumptionCommentUpdateInput
): Promise<ActionResult<AssumptionComment, FieldError<keyof AssumptionCommentUpdateInput | "root">>> {
  const actor = await currentUser();
  const existing = await AssumptionCommentService.get(assumptionCommentId);

  if (!existing) {
    return notAuthorized();
  }

  const assumption = await AssumptionService.getWithDecisionAndProject(existing.assumptionId);

  if (!assumption || !isAuthorized(canUpdateAssumptionComment, actor, assumption, existing)) {
    return notAuthorized();
  }

  const validated = assumptionCommentUpdateSchema.safeParse({
    body: input.body
  });

  if (!validated.success) {
    return invalidInput();
  }

  const result = await AssumptionCommentService.update(assumptionCommentId, validated.data);
  return actionResult(result, assumptionCommentUpdateSchema.keyof().options);
}

export async function deleteAssumptionComment(
  assumptionCommentId: string
): Promise<ActionResult<void, FieldError<"root">>> {
  const actor = await currentUser();
  const existing = await AssumptionCommentService.get(assumptionCommentId);

  if (!existing) {
    return notAuthorized();
  }

  const assumption = await AssumptionService.getWithDecisionAndProject(existing.assumptionId);

  if (!assumption || !isAuthorized(canDeleteAssumptionComment, actor, assumption, existing)) {
    return notAuthorized();
  }

  const success = await AssumptionCommentService.delete(assumptionCommentId);

  if (!success) {
    return actionErrorResult("Could not delete assumption");
  }

  return { success: true, data: undefined };
}
