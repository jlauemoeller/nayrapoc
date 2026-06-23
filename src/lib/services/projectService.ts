import { DbConnection } from "@/lib/db/connection";
import { ProjectRepository, ProjectRecordError } from "@/lib/repositories/projectRepository";
import { Result } from "neverthrow";
import { ServiceError, toServiceErrorResult } from "@/lib/services/service";
import { db } from "@/lib/db";
import { toProjectWithAccountIfAny, toProjectWithCreator, toProjectWithCreatorIfAny } from "@/lib/models/relations";
import {
  Project,
  ProjectCreateInput,
  ProjectDecisionCounts,
  ProjectUpdateInput,
  toNewProjectRecord,
  toProject,
  toProjectDecisionCounts,
  toProjectIfAny
} from "@/lib/models/project";

export type ProjectServiceError = ServiceError<Project>;

export function toProjectServiceErrorResult(error: ProjectRecordError): Result<never, ProjectServiceError> {
  return toServiceErrorResult(error);
}

export class ProjectService {
  static async get(projectId: string, connection: DbConnection = db): Promise<Project | undefined> {
    const record = await ProjectRepository.get(projectId, connection);
    return toProjectIfAny(record);
  }

  static async getWithAccount(
    projectId: string,
    connection: DbConnection = db
  ): Promise<Project<"with-account"> | undefined> {
    const record = await ProjectRepository.getWithAccount(projectId, connection);
    return toProjectWithAccountIfAny(record);
  }

  static async getWithCreator(
    projectId: string,
    connection: DbConnection = db
  ): Promise<Project<"with-creator"> | undefined> {
    const record = await ProjectRepository.getWithCreator(projectId, connection);
    return toProjectWithCreatorIfAny(record);
  }

  static async list(connection: DbConnection = db): Promise<Project[]> {
    const records = await ProjectRepository.list(connection);
    return records.map(toProject);
  }

  static async listForAccount(accountId: string, connection: DbConnection = db): Promise<Project[]> {
    const records = await ProjectRepository.listForAccount(accountId, connection);
    return records.map(toProject);
  }

  static async listWithCreator(connection: DbConnection = db): Promise<Project<"with-creator">[]> {
    const records = await ProjectRepository.listWithCreator(connection);
    return records.map(toProjectWithCreator);
  }

  static async listWithCreatorForAccount(
    accountId: string,
    connection: DbConnection = db
  ): Promise<Project<"with-creator">[]> {
    const records = await ProjectRepository.listWithCreatorForAccount(accountId, connection);
    return records.map(toProjectWithCreator);
  }

  static async create(
    input: ProjectCreateInput,
    connection: DbConnection = db
  ): Promise<Result<Project, ProjectServiceError>> {
    const normalized = {
      ...input,
      name: input.name.trim(),
      description: input.description,
      creator_id: input.creatorId,
      account_id: input.accountId
    };

    const projectData = toNewProjectRecord(normalized);
    const record = await ProjectRepository.create(projectData, connection);
    return record.map(toProject).orElse(toProjectServiceErrorResult);
  }

  static async update(
    projectId: string,
    input: ProjectUpdateInput,
    connection: DbConnection = db
  ): Promise<Result<Project, ProjectServiceError>> {
    const normalized = {
      ...input,
      name: input.name?.trim(),
      description: input?.description
    };

    const updated = await ProjectRepository.update(projectId, normalized, connection);
    return updated.map(toProject).orElse(toProjectServiceErrorResult);
  }

  static async delete(projectId: string, connection: DbConnection = db): Promise<boolean> {
    return ProjectRepository.delete(projectId, connection);
  }

  static async getProjectDecisionCounts(
    projectId: string,
    connection: DbConnection = db
  ): Promise<ProjectDecisionCounts[]> {
    const records = await ProjectRepository.getProjectDecisionCounts(projectId, connection);
    return records.map(toProjectDecisionCounts);
  }

  static async getProjectDecisionCountsForAccount(
    accountId: string,
    connection: DbConnection = db
  ): Promise<ProjectDecisionCounts[]> {
    const records = await ProjectRepository.getProjectDecisionCountsForAccount(accountId, connection);
    return records.map(toProjectDecisionCounts);
  }
}
