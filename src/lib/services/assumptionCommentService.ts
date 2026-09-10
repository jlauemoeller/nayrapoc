import {
  AssumptionCommentRecordError,
  AssumptionCommentRepository
} from "@/lib/repositories/assumptionCommentRepository";
import { DbConnection } from "@/lib/db/connection";
import { Result } from "neverthrow";
import { ServiceError, toServiceErrorResult } from "@/lib/services/service";
import { db } from "@/lib/db";
import {
  AssumptionComment,
  AssumptionCommentCreateInput,
  AssumptionCommentUpdateInput,
  toAssumptionComment,
  toAssumptionCommentIfAny,
  toAssumptionCommentUpdateRecord,
  toAssumptionCommentCreateRecord
} from "@/lib/models/assumptionComment";
import {
  toAssumptionCommentWithAssumptionIfAny,
  toAssumptionCommentWithAssumptionCreatorAndResolverIfAny,
  toAssumptionCommentWithCreatorAndResolver
} from "@/lib/models/relations";

export type AssumptionCommentServiceError = ServiceError<AssumptionComment>;

export function toAssumptionCommentServiceErrorResult(
  error: AssumptionCommentRecordError
): Result<never, AssumptionCommentServiceError> {
  return toServiceErrorResult(error);
}

export class AssumptionCommentService {
  static async get(assumptionCommentId: string, connection: DbConnection = db): Promise<AssumptionComment | undefined> {
    const record = await AssumptionCommentRepository.get(assumptionCommentId, connection);
    return toAssumptionCommentIfAny(record);
  }

  static async getWithAssumption(
    assumptionCommentId: string,
    connection: DbConnection = db
  ): Promise<AssumptionComment<"with-assumption"> | undefined> {
    const record = await AssumptionCommentRepository.getWithAssumption(assumptionCommentId, connection);
    return toAssumptionCommentWithAssumptionIfAny(record);
  }

  static async getWithAssumptionCreatorAndResolver(
    assumptionCommentId: string,
    connection: DbConnection = db
  ): Promise<AssumptionComment<"with-assumption-creator-and-resolver"> | undefined> {
    const record = await AssumptionCommentRepository.getWithAssumptionCreatorAndResolver(
      assumptionCommentId,
      connection
    );
    return toAssumptionCommentWithAssumptionCreatorAndResolverIfAny(record);
  }

  static async listForAssumptionWithCreatorAndResolver(
    assumptionId: string,
    connection: DbConnection = db
  ): Promise<AssumptionComment<"with-creator-and-resolver">[]> {
    const records = await AssumptionCommentRepository.listForAssumptionWithCreatorAndResolver(assumptionId, connection);
    return records.map(toAssumptionCommentWithCreatorAndResolver);
  }

  static async create(
    input: AssumptionCommentCreateInput,
    connection: DbConnection = db
  ): Promise<Result<AssumptionComment, AssumptionCommentServiceError>> {
    const assumptionCommentData = toAssumptionCommentCreateRecord(input);
    const record = await AssumptionCommentRepository.create(assumptionCommentData, connection);
    return record.map(toAssumptionComment).orElse(toAssumptionCommentServiceErrorResult);
  }

  static async update(
    assumptionCommentId: string,
    input: AssumptionCommentUpdateInput,
    connection: DbConnection = db
  ): Promise<Result<AssumptionComment, AssumptionCommentServiceError>> {
    const assumptionCommentData = toAssumptionCommentUpdateRecord(input);
    const updated = await AssumptionCommentRepository.update(assumptionCommentId, assumptionCommentData, connection);
    return updated.map(toAssumptionComment).orElse(toAssumptionCommentServiceErrorResult);
  }

  static async delete(assumptionCommentId: string, connection: DbConnection = db): Promise<boolean> {
    return await AssumptionCommentRepository.delete(assumptionCommentId, connection);
  }
}
