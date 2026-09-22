import { AssumptionCommentRecord, NewAssumptionCommentRecord } from "@/lib/models/assumptionComment";
import {
  AssumptionCommentWithAssumptionResult,
  AssumptionCommentWithAssumptionAndCreatorResult,
  AssumptionCommentWithAssumptionCreatorAndResolverResult,
  AssumptionCommentWithCreatorAndResolverResult
} from "@/lib/models/relations";
import { DbConnection } from "@/lib/db/connection";
import { Result } from "neverthrow";
import { assumptions, assumptionComments, users } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { guarded, RecordError } from "@/lib/repositories/repository";

export type AssumptionCommentRecordError = RecordError<AssumptionCommentRecord>;

export class AssumptionCommentRepository {
  static async get(id: string, connection: DbConnection = db): Promise<AssumptionCommentRecord | undefined> {
    return await connection.query.assumptionComments.findFirst({
      where: eq(assumptionComments.id, id)
    });
  }

  static async getWithAssumption(
    id: string,
    connection: DbConnection = db
  ): Promise<AssumptionCommentWithAssumptionResult | undefined> {
    const [assumptionComment] = await connection
      .select({
        assumptionComment: assumptionComments,
        assumption: assumptions
      })
      .from(assumptionComments)
      .innerJoin(assumptions, eq(assumptions.id, assumptionComments.assumption_id))
      .where(eq(assumptionComments.id, id));

    return assumptionComment;
  }

  static async getWithAssumptionAndCreator(
    id: string,
    connection: DbConnection = db
  ): Promise<AssumptionCommentWithAssumptionAndCreatorResult | undefined> {
    const [assumptionComment] = await connection
      .select({
        assumptionComment: assumptionComments,
        assumption: assumptions,
        creator: users
      })
      .from(assumptionComments)
      .innerJoin(assumptions, eq(assumptions.id, assumptionComments.assumption_id))
      .innerJoin(users, eq(users.id, assumptionComments.creator_id))
      .where(eq(assumptionComments.id, id));

    return assumptionComment;
  }

  static async getWithAssumptionCreatorAndResolver(
    id: string,
    connection: DbConnection = db
  ): Promise<AssumptionCommentWithAssumptionCreatorAndResolverResult | undefined> {
    const creator = alias(users, "creator");
    const resolver = alias(users, "resolver");

    const [assumptionComment] = await connection
      .select({
        assumptionComment: assumptionComments,
        assumption: assumptions,
        creator,
        resolver
      })
      .from(assumptionComments)
      .innerJoin(assumptions, eq(assumptions.id, assumptionComments.assumption_id))
      .innerJoin(creator, eq(creator.id, assumptionComments.creator_id))
      .leftJoin(resolver, eq(resolver.id, assumptionComments.resolver_id))
      .where(eq(assumptionComments.id, id));

    return assumptionComment;
  }

  static async listForAssumptionWithCreatorAndResolver(
    assumptionId: string,
    connection: DbConnection = db
  ): Promise<AssumptionCommentWithCreatorAndResolverResult[]> {
    const creator = alias(users, "creator");
    const resolver = alias(users, "resolver");

    return await connection
      .select({
        assumptionComment: assumptionComments,
        creator,
        resolver
      })
      .from(assumptionComments)
      .innerJoin(creator, eq(creator.id, assumptionComments.creator_id))
      .leftJoin(resolver, eq(resolver.id, assumptionComments.resolver_id))
      .where(eq(assumptionComments.assumption_id, assumptionId))
      .orderBy(asc(assumptionComments.created_at));
  }

  static async create(
    assumptionCommentData: NewAssumptionCommentRecord,
    connection: DbConnection = db
  ): Promise<Result<AssumptionCommentRecord, AssumptionCommentRecordError>> {
    return guarded(async () => {
      const [assumptionComment] = await connection.insert(assumptionComments).values(assumptionCommentData).returning();

      return assumptionComment;
    });
  }

  static async update(
    id: string,
    assumptionCommentData: Partial<NewAssumptionCommentRecord>,
    connection: DbConnection = db
  ): Promise<Result<AssumptionCommentRecord, AssumptionCommentRecordError>> {
    return guarded(async () => {
      const [assumptionComment] = await connection
        .update(assumptionComments)
        .set({
          ...assumptionCommentData,
          updated_at: new Date()
        })
        .where(eq(assumptionComments.id, id))
        .returning();

      if (!assumptionComment) {
        throw new Error(`update failed: Stale or invalid AssumptionComment record id: ${id}`);
      }

      return assumptionComment;
    });
  }

  // Returns the deleted record so callers can act on it (e.g. re-evaluate its assumption),
  // or `undefined` when nothing matched — the same shape as an optional read.
  static async delete(id: string, connection: DbConnection = db): Promise<AssumptionCommentRecord | undefined> {
    const [deleted] = await connection.delete(assumptionComments).where(eq(assumptionComments.id, id)).returning();
    return deleted;
  }
}
