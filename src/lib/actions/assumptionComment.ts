"use server";

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
import { db } from "@/lib/db";
import { DbConnection } from "@/lib/db/connection";

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

      return ok(await preloadCreatorAndResolverOrThrow(basic.value.id, tx));
    }
  );

  if (result.isOk()) revalidatePath(`/assumptions/${input.assumptionId}`);
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
  if (result.isOk()) revalidatePath(`/assumptions/${existing.assumptionId}`);
  return actionResult(result, assumptionCommentUpdateSchema.keyof().options);
}

export async function updateAssumptionCommentResolutionState(
  assumptionCommentId: string,
  state: boolean
): Promise<
  ActionResult<AssumptionComment<"with-creator-and-resolver">, FieldError<keyof AssumptionCommentUpdateInput | "root">>
> {
  const actor = await currentUser();
  const existing = await AssumptionCommentService.get(assumptionCommentId);

  if (!existing) {
    return notAuthorized();
  }

  const assumption = await AssumptionService.getWithDecisionAndProject(existing.assumptionId);

  if (!assumption || !isAuthorized(canUpdateAssumptionComment, actor, assumption, existing)) {
    return notAuthorized();
  }

  const currentState = existing.resolvedAt !== undefined;

  if (state === currentState) {
    return actionResult(
      ok(await preloadCreatorAndResolverOrThrow(assumptionCommentId)),
      assumptionCommentUpdateSchema.keyof().options
    );
  }

  // `null` clears the columns; `undefined` would be skipped by Drizzle and leave the comment resolved.
  const changes: AssumptionCommentUpdateInput =
    state ? { resolvedAt: new Date(), resolverId: actor.id } : { resolvedAt: null, resolverId: null };

  const result = await transactionResult(
    async (tx): Promise<Result<AssumptionComment<"with-creator-and-resolver">, AssumptionCommentServiceError>> => {
      const basic = await AssumptionCommentService.update(assumptionCommentId, changes, tx);
      if (basic.isErr()) return err(basic.error);

      return ok(await preloadCreatorAndResolverOrThrow(basic.value.id, tx));
    }
  );

  if (result.isOk()) revalidatePath(`/assumptions/${existing.assumptionId}`);
  return actionResult(result, assumptionCommentUpdateSchema.keyof().options);
}

async function preloadCreatorAndResolverOrThrow(
  id: string,
  connection: DbConnection = db
): Promise<AssumptionComment<"with-creator-and-resolver">> {
  const result = await AssumptionCommentService.getWithAssumptionCreatorAndResolver(id, connection);
  if (!result) throw new Error(`Could not preload creator and resolver for AssumptionComment ${id}`);
  return result;
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

  revalidatePath(`/assumptions/${existing.assumptionId}`);

  return { success: true, data: undefined };
}
