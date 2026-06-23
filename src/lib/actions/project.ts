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
  Project,
  ProjectCreateInput,
  ProjectFormInput,
  ProjectUpdateInput,
  projectCreateSchema,
  projectFormSchema,
  projectUpdateSchema
} from "@/lib/models/project";
import { ProjectService } from "@/lib/services/projectService";
import { canCreateProject, canUpdateProject, canDeleteProject } from "@/lib/policies/project";
import { currentUser, isAuthorized } from "@/lib/authorization";

type ProjectCreateInputWithoutActor = Omit<ProjectCreateInput, "creatorId">;

export async function createProject(
  input: ProjectCreateInputWithoutActor
): Promise<ActionResult<Project, FieldError<keyof ProjectFormInput | "root">>> {
  const actor = await currentUser();
  if (!isAuthorized(canCreateProject, actor, actor.accountId)) {
    return notAuthorized();
  }

  const validated = projectCreateSchema.safeParse({
    name: input.name,
    description: input.description,
    accountId: input.accountId,
    creatorId: actor.id
  });

  if (!validated.success) {
    return invalidInput();
  }

  const result = await ProjectService.create(validated.data);
  return actionResult(result, projectFormSchema.keyof().options);
}

export async function updateProject(
  projectId: string,
  input: ProjectUpdateInput
): Promise<ActionResult<Project, FieldError<keyof ProjectUpdateInput | "root">>> {
  const actor = await currentUser();
  const existing = await ProjectService.get(projectId);

  if (!existing || !isAuthorized(canUpdateProject, actor, existing)) {
    return notAuthorized();
  }

  const validated = projectUpdateSchema.safeParse({
    name: input.name,
    description: input.description
  });

  if (!validated.success) {
    return invalidInput();
  }

  const result = await ProjectService.update(projectId, validated.data);
  return actionResult(result, projectUpdateSchema.keyof().options);
}

export async function deleteProject(projectId: string): Promise<ActionResult<void, FieldError<"root">>> {
  const actor = await currentUser();
  const existing = await ProjectService.get(projectId);

  if (!existing || !isAuthorized(canDeleteProject, actor, existing)) {
    return notAuthorized();
  }

  const success = await ProjectService.delete(projectId);

  if (!success) {
    return actionErrorResult("Could not delete project");
  }

  return { success: true, data: undefined };
}
