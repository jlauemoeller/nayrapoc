import type { Block } from "@blocknote/core";
import { AssumptionRecordError, AssumptionRepository } from "@/lib/repositories/assumptionRepository";
import { DbConnection } from "@/lib/db/connection";
import { Result } from "neverthrow";
import { ServiceError, toServiceErrorResult } from "@/lib/services/service";
import { db } from "@/lib/db";
import {
  Assumption,
  AssumptionCreateInput,
  AssumptionUpdateInput,
  toAssumption,
  toAssumptionIfAny,
  toNewAssumptionRecord
} from "@/lib/models/assumption";
import {
  toAssumptionWithDecisionAndCreator,
  toAssumptionWithDecisionAndCreatorIfAny,
  toAssumptionWithDecisionAndProjectIfAny,
  toAssumptionWithDecisionCreatorAndProjectIfAny,
  toAssumptionWithDecisionIfAny
} from "@/lib/models/relations";

export type AssumptionServiceError = ServiceError<Assumption>;

export function toAssumptionServiceErrorResult(error: AssumptionRecordError): Result<never, AssumptionServiceError> {
  return toServiceErrorResult(error);
}

export class AssumptionService {
  static async get(assumptionId: string, connection: DbConnection = db): Promise<Assumption | undefined> {
    const record = await AssumptionRepository.get(assumptionId, connection);
    return toAssumptionIfAny(record);
  }

  static async getWithDecision(
    assumptionId: string,
    connection: DbConnection = db
  ): Promise<Assumption<"with-decision"> | undefined> {
    const record = await AssumptionRepository.getWithDecision(assumptionId, connection);
    return toAssumptionWithDecisionIfAny(record);
  }

  static async getWithDecisionAndProject(
    assumptionId: string,
    connection: DbConnection = db
  ): Promise<Assumption<"with-decision-and-project"> | undefined> {
    const record = await AssumptionRepository.getWithDecisionAndProject(assumptionId, connection);
    return toAssumptionWithDecisionAndProjectIfAny(record);
  }

  static async getWithDecisionAndCreator(
    assumptionId: string,
    connection: DbConnection = db
  ): Promise<Assumption<"with-decision-and-creator"> | undefined> {
    const record = await AssumptionRepository.getWithDecisionAndCreator(assumptionId, connection);
    return toAssumptionWithDecisionAndCreatorIfAny(record);
  }

  static async getWithDecisionCreatorAndProject(
    assumptionId: string,
    connection: DbConnection = db
  ): Promise<Assumption<"with-decision-creator-and-project"> | undefined> {
    const record = await AssumptionRepository.getWithDecisionCreatorAndProject(assumptionId, connection);
    return toAssumptionWithDecisionCreatorAndProjectIfAny(record);
  }

  static async list(connection: DbConnection = db): Promise<Assumption[]> {
    const records = await AssumptionRepository.list(connection);
    return records.map(toAssumption);
  }

  static async listForDecision(decisionId: string, connection: DbConnection = db): Promise<Assumption[]> {
    const records = await AssumptionRepository.listForDecision(decisionId, connection);
    return records.map(toAssumption);
  }

  static async listWithCreatorForDecision(
    decisionId: string,
    connection: DbConnection = db
  ): Promise<Assumption<"with-decision-and-creator">[]> {
    const records = await AssumptionRepository.listWithCreatorForDecision(decisionId, connection);
    return records.map(toAssumptionWithDecisionAndCreator);
  }

  static async create(
    input: AssumptionCreateInput,
    connection: DbConnection = db
  ): Promise<Result<Assumption, AssumptionServiceError>> {
    const normalized = {
      ...input,
      title: input.title.trim()
    };

    const assumptionData = toNewAssumptionRecord(normalized);
    const record = await AssumptionRepository.create(assumptionData, connection);
    return record.map(toAssumption).orElse(toAssumptionServiceErrorResult);
  }

  static async update(
    assumptionId: string,
    input: AssumptionUpdateInput,
    connection: DbConnection = db
  ): Promise<Result<Assumption, AssumptionServiceError>> {
    const normalized = {
      title: input.title?.trim(),
      confidence: input.confidence
    };

    const updated = await AssumptionRepository.update(assumptionId, normalized, connection);
    return updated.map(toAssumption).orElse(toAssumptionServiceErrorResult);
  }

  static async updateRationale(
    assumptionId: string,
    rationale: Block[],
    connection: DbConnection = db
  ): Promise<Result<Assumption, AssumptionServiceError>> {
    const updated = await AssumptionRepository.update(assumptionId, { rationale }, connection);
    return updated.map(toAssumption).orElse(toAssumptionServiceErrorResult);
  }

  static async delete(assumptionId: string, connection: DbConnection = db): Promise<boolean> {
    return await AssumptionRepository.delete(assumptionId, connection);
  }
}
