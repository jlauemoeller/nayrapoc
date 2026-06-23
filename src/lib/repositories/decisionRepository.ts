import { DbConnection } from "@/lib/db/connection";
import { DecisionRecord, NewDecisionRecord } from "@/lib/models/decision";
import { Result } from "neverthrow";
import { db } from "@/lib/db";
import { decisions, projects, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { guarded, notNull, RecordError } from "@/lib/repositories/repository";
import {
  DecisionWithCreatorResult,
  DecisionWithProjectAndCreatorResult,
  DecisionWithProjectResult
} from "@/lib/models/relations";

export type DecisionRecordError = RecordError<DecisionRecord>;

export class DecisionRepository {
  static async get(id: string, connection: DbConnection = db): Promise<DecisionRecord | undefined> {
    return await connection.query.decisions.findFirst({
      where: eq(decisions.id, id)
    });
  }

  static async getWithProject(
    id: string,
    connection: DbConnection = db
  ): Promise<DecisionWithProjectResult | undefined> {
    const [decision] = await connection
      .select({
        decision: decisions,
        project: projects
      })
      .from(decisions)
      .innerJoin(projects, eq(projects.id, decisions.project_id))
      .where(eq(decisions.id, id));

    return decision;
  }

  static async getWithCreator(
    id: string,
    connection: DbConnection = db
  ): Promise<DecisionWithCreatorResult | undefined> {
    const [decision] = await connection
      .select({
        decision: decisions,
        creator: users
      })
      .from(decisions)
      .innerJoin(users, eq(users.id, decisions.creator_id))
      .where(eq(decisions.id, id));

    return decision;
  }

  static async getWithProjectAndCreator(
    id: string,
    connection: DbConnection = db
  ): Promise<DecisionWithProjectAndCreatorResult | undefined> {
    const [decision] = await connection
      .select({
        decision: decisions,
        project: projects,
        creator: users
      })
      .from(decisions)
      .innerJoin(projects, eq(projects.id, decisions.project_id))
      .innerJoin(users, eq(users.id, decisions.creator_id))
      .where(eq(decisions.id, id));

    return decision;
  }

  static async list(connection: DbConnection = db): Promise<DecisionRecord[]> {
    return await connection.query.decisions.findMany();
  }

  static async listForProject(projectId: string, connection: DbConnection = db): Promise<DecisionRecord[]> {
    const found = await connection
      .select({
        decision: decisions
      })
      .from(decisions)
      .where(eq(decisions.project_id, projectId))
      .orderBy(asc(decisions.created_at));

    return found.map((record) => record.decision);
  }

  static async listWithCreatorForProject(
    projectId: string,
    connection: DbConnection = db
  ): Promise<DecisionWithCreatorResult[]> {
    return await connection
      .select({
        decision: decisions,
        creator: users
      })
      .from(decisions)
      .innerJoin(users, eq(users.id, decisions.creator_id))
      .where(eq(decisions.project_id, projectId))
      .orderBy(asc(decisions.created_at));
  }

  static async listWithProjectAndCreatorForProject(
    projectId: string,
    connection: DbConnection = db
  ): Promise<DecisionWithProjectAndCreatorResult[]> {
    return await connection
      .select({
        decision: decisions,
        project: projects,
        creator: users
      })
      .from(decisions)
      .innerJoin(projects, eq(projects.id, decisions.project_id))
      .innerJoin(users, eq(users.id, decisions.creator_id))
      .where(eq(decisions.project_id, projectId))
      .orderBy(asc(decisions.created_at));
  }

  static async create(
    decisionData: NewDecisionRecord,
    connection: DbConnection = db
  ): Promise<Result<DecisionRecord, DecisionRecordError>> {
    return guarded(async () => {
      const [decision] = await connection.insert(decisions).values(decisionData).returning();
      return decision;
    }, [notNull("title", "Title cannot be empty")]);
  }

  static async update(
    id: string,
    decisionData: Partial<NewDecisionRecord>,
    connection: DbConnection = db
  ): Promise<Result<DecisionRecord, DecisionRecordError>> {
    return guarded(async () => {
      const [decision] = await connection
        .update(decisions)
        .set({
          ...decisionData,
          updated_at: new Date()
        })
        .where(eq(decisions.id, id))
        .returning();

      if (!decision) {
        throw new Error(`update failed: Stale or invalid Decision record id: ${id}`);
      }

      return decision;
    }, [notNull("title", "Title cannot be empty")]);
  }

  static async delete(id: string, connection: DbConnection = db): Promise<boolean> {
    const result = await connection.delete(decisions).where(eq(decisions.id, id)).returning();
    return result.length > 0;
  }
}
