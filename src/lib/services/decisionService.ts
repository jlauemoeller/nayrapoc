import type { Block } from "@blocknote/core";
import { DbConnection } from "@/lib/db/connection";
import { DecisionRepository, DecisionRecordError } from "@/lib/repositories/decisionRepository";
import { Result } from "neverthrow";
import { ServiceError, toServiceErrorResult } from "@/lib/services/service";
import { db } from "@/lib/db";
import {
  Decision,
  DecisionCreateInput,
  DecisionUpdateInput,
  toDecision,
  toDecisionIfAny,
  toNewDecisionRecord
} from "@/lib/models/decision";
import {
  toDecisionWithCreator,
  toDecisionWithCreatorIfAny,
  toDecisionWithProjectAndCreator,
  toDecisionWithProjectAndCreatorIfAny,
  toDecisionWithProjectIfAny
} from "@/lib/models/relations";

export type DecisionServiceError = ServiceError<Decision>;

export function toDecisionServiceErrorResult(error: DecisionRecordError): Result<never, DecisionServiceError> {
  return toServiceErrorResult(error);
}

export class DecisionService {
  static async get(decisionId: string, connection: DbConnection = db): Promise<Decision | undefined> {
    const record = await DecisionRepository.get(decisionId, connection);
    return toDecisionIfAny(record);
  }

  static async getWithProject(
    decisionId: string,
    connection: DbConnection = db
  ): Promise<Decision<"with-project"> | undefined> {
    const record = await DecisionRepository.getWithProject(decisionId, connection);
    return toDecisionWithProjectIfAny(record);
  }

  static async getWithCreator(
    decisionId: string,
    connection: DbConnection = db
  ): Promise<Decision<"with-creator"> | undefined> {
    const record = await DecisionRepository.getWithCreator(decisionId, connection);
    return toDecisionWithCreatorIfAny(record);
  }

  static async getWithProjectAndCreator(
    decisionId: string,
    connection: DbConnection = db
  ): Promise<Decision<"with-project-and-creator"> | undefined> {
    const record = await DecisionRepository.getWithProjectAndCreator(decisionId, connection);
    return toDecisionWithProjectAndCreatorIfAny(record);
  }

  static async list(connection: DbConnection = db): Promise<Decision[]> {
    const records = await DecisionRepository.list(connection);
    return records.map(toDecision);
  }

  static async listForProject(projectId: string, connection: DbConnection = db): Promise<Decision[]> {
    const records = await DecisionRepository.listForProject(projectId, connection);
    return records.map(toDecision);
  }

  static async listWithCreatorForProject(
    projectId: string,
    connection: DbConnection = db
  ): Promise<Decision<"with-creator">[]> {
    const records = await DecisionRepository.listWithCreatorForProject(projectId, connection);
    return records.map(toDecisionWithCreator);
  }

  static async listWithProjectAndCreatorForProject(
    projectId: string,
    connection: DbConnection = db
  ): Promise<Decision<"with-project-and-creator">[]> {
    const records = await DecisionRepository.listWithProjectAndCreatorForProject(projectId, connection);
    return records.map(toDecisionWithProjectAndCreator);
  }

  static async create(
    input: DecisionCreateInput,
    connection: DbConnection = db
  ): Promise<Result<Decision, DecisionServiceError>> {
    const normalized = {
      ...input,
      title: input.title.trim()
    };

    const decisionData = toNewDecisionRecord(normalized);
    const record = await DecisionRepository.create(decisionData, connection);
    return record.map(toDecision).orElse(toDecisionServiceErrorResult);
  }

  static async update(
    decisionId: string,
    input: DecisionUpdateInput,
    connection: DbConnection = db
  ): Promise<Result<Decision, DecisionServiceError>> {
    const normalized = {
      title: input.title?.trim(),
      state: input.state,
      review_by: input.reviewBy,
      reviewed_at: input.reviewedAt
    };

    const updated = await DecisionRepository.update(decisionId, normalized, connection);
    return updated.map(toDecision).orElse(toDecisionServiceErrorResult);
  }

  static async updateRationale(
    decisionId: string,
    rationale: Block[],
    connection: DbConnection = db
  ): Promise<Result<Decision, DecisionServiceError>> {
    const updated = await DecisionRepository.update(decisionId, { rationale }, connection);
    return updated.map(toDecision).orElse(toDecisionServiceErrorResult);
  }

  static async delete(decisionId: string, connection: DbConnection = db): Promise<boolean> {
    return await DecisionRepository.delete(decisionId, connection);
  }
}
