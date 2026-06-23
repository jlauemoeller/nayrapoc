import { AssumptionRecord, NewAssumptionRecord } from "@/lib/models/assumption";
import {
  AssumptionWithDecisionAndCreatorResult,
  AssumptionWithDecisionAndProjectResult,
  AssumptionWithDecisionCreatorAndProjectResult,
  AssumptionWithDecisionResult
} from "@/lib/models/relations";
import { DbConnection } from "@/lib/db/connection";
import { Result } from "neverthrow";
import { assumptions, decisions, projects, users } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { guarded, notNull, RecordError } from "@/lib/repositories/repository";

export type AssumptionRecordError = RecordError<AssumptionRecord>;

export class AssumptionRepository {
  static async get(id: string, connection: DbConnection = db): Promise<AssumptionRecord | undefined> {
    return await connection.query.assumptions.findFirst({
      where: eq(assumptions.id, id)
    });
  }

  static async getWithDecision(
    id: string,
    connection: DbConnection = db
  ): Promise<AssumptionWithDecisionResult | undefined> {
    const [assumption] = await connection
      .select({
        assumption: assumptions,
        decision: decisions
      })
      .from(assumptions)
      .innerJoin(decisions, eq(decisions.id, assumptions.decision_id))
      .where(eq(assumptions.id, id));

    return assumption;
  }

  static async getWithDecisionAndProject(
    id: string,
    connection: DbConnection = db
  ): Promise<AssumptionWithDecisionAndProjectResult | undefined> {
    const [assumption] = await connection
      .select({
        assumption: assumptions,
        decision: decisions,
        project: projects
      })
      .from(assumptions)
      .innerJoin(decisions, eq(decisions.id, assumptions.decision_id))
      .innerJoin(projects, eq(projects.id, decisions.project_id))
      .where(eq(assumptions.id, id));

    return assumption;
  }

  static async getWithDecisionAndCreator(
    id: string,
    connection: DbConnection = db
  ): Promise<AssumptionWithDecisionAndCreatorResult | undefined> {
    const [assumption] = await connection
      .select({
        assumption: assumptions,
        decision: decisions,
        creator: users
      })
      .from(assumptions)
      .innerJoin(decisions, eq(decisions.id, assumptions.decision_id))
      .innerJoin(users, eq(users.id, assumptions.creator_id))
      .where(eq(assumptions.id, id));

    return assumption;
  }

  static async getWithDecisionCreatorAndProject(
    id: string,
    connection: DbConnection = db
  ): Promise<AssumptionWithDecisionCreatorAndProjectResult | undefined> {
    const [assumption] = await connection
      .select({
        assumption: assumptions,
        decision: decisions,
        project: projects,
        creator: users
      })
      .from(assumptions)
      .innerJoin(decisions, eq(decisions.id, assumptions.decision_id))
      .innerJoin(projects, eq(projects.id, decisions.project_id))
      .innerJoin(users, eq(users.id, assumptions.creator_id))
      .where(eq(assumptions.id, id));

    return assumption;
  }

  static async list(connection: DbConnection = db): Promise<AssumptionRecord[]> {
    return await connection.query.assumptions.findMany();
  }

  static async listForDecision(decisionId: string, connection: DbConnection = db): Promise<AssumptionRecord[]> {
    const found = await connection
      .select({
        assumption: assumptions
      })
      .from(assumptions)
      .where(eq(assumptions.decision_id, decisionId))
      .orderBy(desc(assumptions.created_at));

    return found.map((record) => record.assumption);
  }

  static async listWithCreatorForDecision(
    decisionId: string,
    connection: DbConnection = db
  ): Promise<AssumptionWithDecisionAndCreatorResult[]> {
    return await connection
      .select({
        assumption: assumptions,
        decision: decisions,
        creator: users
      })
      .from(assumptions)
      .innerJoin(decisions, eq(decisions.id, assumptions.decision_id))
      .innerJoin(users, eq(users.id, assumptions.creator_id))
      .where(eq(assumptions.decision_id, decisionId))
      .orderBy(desc(assumptions.created_at));
  }

  static async create(
    assumptionData: NewAssumptionRecord,
    connection: DbConnection = db
  ): Promise<Result<AssumptionRecord, AssumptionRecordError>> {
    return guarded(async () => {
      const [assumption] = await connection.insert(assumptions).values(assumptionData).returning();
      return assumption;
    }, [notNull("title", "Title cannot be empty")]);
  }

  static async update(
    id: string,
    assumptionData: Partial<NewAssumptionRecord>,
    connection: DbConnection = db
  ): Promise<Result<AssumptionRecord, AssumptionRecordError>> {
    return guarded(async () => {
      const [assumption] = await connection
        .update(assumptions)
        .set({
          ...assumptionData,
          updated_at: new Date()
        })
        .where(eq(assumptions.id, id))
        .returning();

      if (!assumption) {
        throw new Error(`update failed: Stale or invalid Assumption record id: ${id}`);
      }

      return assumption;
    }, [notNull("title", "Title cannot be empty")]);
  }

  static async delete(id: string, connection: DbConnection = db): Promise<boolean> {
    const result = await connection.delete(assumptions).where(eq(assumptions.id, id)).returning();
    return result.length > 0;
  }
}
