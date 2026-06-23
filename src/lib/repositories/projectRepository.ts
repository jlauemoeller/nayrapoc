import { DbConnection } from "@/lib/db/connection";
import { ProjectRecord, NewProjectRecord, ProjectDecisionCountsRecord } from "@/lib/models/project";
import { ProjectWithAccountResult, ProjectWithCreatorResult } from "@/lib/models/relations";
import { Result } from "neverthrow";
import { db } from "@/lib/db";
import { eq, asc, count, sql } from "drizzle-orm";
import { guarded, notNull, RecordError } from "@/lib/repositories/repository";
import { projects, accounts, users, decisions } from "@/lib/db/schema";

export type ProjectRecordError = RecordError<ProjectRecord>;

export class ProjectRepository {
  static async get(id: string, connection: DbConnection = db): Promise<ProjectRecord | undefined> {
    return await connection.query.projects.findFirst({
      where: eq(projects.id, id)
    });
  }

  static async getWithAccount(
    id: string,
    connection: DbConnection = db
  ): Promise<ProjectWithAccountResult | undefined> {
    const [project] = await connection
      .select({
        project: projects,
        account: accounts
      })
      .from(projects)
      .innerJoin(accounts, eq(accounts.id, projects.account_id))
      .where(eq(projects.id, id));

    return project;
  }

  static async getWithCreator(
    id: string,
    connection: DbConnection = db
  ): Promise<ProjectWithCreatorResult | undefined> {
    const [project] = await connection
      .select({
        project: projects,
        creator: users
      })
      .from(projects)
      .innerJoin(users, eq(users.id, projects.creator_id))
      .where(eq(projects.id, id));

    return project;
  }

  static async list(connection: DbConnection = db): Promise<ProjectRecord[]> {
    return await connection.query.projects.findMany();
  }

  static async listForAccount(accountId: string, connection: DbConnection = db): Promise<ProjectRecord[]> {
    const found = await connection
      .select({
        project: projects
      })
      .from(projects)
      .where(eq(projects.account_id, accountId))
      .orderBy(asc(projects.name));

    return found.map((record) => record.project);
  }

  static async listWithAccount(connection: DbConnection = db): Promise<ProjectWithAccountResult[]> {
    return await connection
      .select({
        project: projects,
        account: accounts
      })
      .from(projects)
      .innerJoin(accounts, eq(accounts.id, projects.account_id))
      .orderBy(asc(projects.name));
  }

  static async listWithCreator(connection: DbConnection = db): Promise<ProjectWithCreatorResult[]> {
    return await connection
      .select({
        project: projects,
        creator: users
      })
      .from(projects)
      .innerJoin(users, eq(users.id, projects.creator_id))
      .orderBy(asc(projects.name));
  }

  static async listWithCreatorForAccount(
    accountId: string,
    connection: DbConnection = db
  ): Promise<ProjectWithCreatorResult[]> {
    return await connection
      .select({
        project: projects,
        creator: users
      })
      .from(projects)
      .innerJoin(users, eq(users.id, projects.creator_id))
      .where(eq(projects.account_id, accountId))
      .orderBy(asc(projects.name));
  }

  static async create(
    projectData: NewProjectRecord,
    connection: DbConnection = db
  ): Promise<Result<ProjectRecord, ProjectRecordError>> {
    return guarded(async () => {
      const [project] = await connection.insert(projects).values(projectData).returning();
      return project;
    }, [notNull("name", "Name cannot be empty")]);
  }

  static async update(
    id: string,
    projectData: Partial<NewProjectRecord>,
    connection: DbConnection = db
  ): Promise<Result<ProjectRecord, ProjectRecordError>> {
    return guarded(async () => {
      const [project] = await connection
        .update(projects)
        .set({
          ...projectData,
          updated_at: new Date()
        })
        .where(eq(projects.id, id))
        .returning();

      if (!project) {
        throw new Error(`update failed: Stale or invalid Project record id: ${id}`);
      }

      return project;
    }, [notNull("name", "Name cannot be empty")]);
  }

  static async delete(id: string, connection: DbConnection = db): Promise<boolean> {
    const result = await connection.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  static async getProjectDecisionCounts(
    projectId: string,
    connection: DbConnection = db
  ): Promise<ProjectDecisionCountsRecord[]> {
    return await connection
      .select({
        account_id: projects.account_id,
        project_id: projects.id,
        proposed: sql<number>`count(${decisions.id}) FILTER(WHERE ${decisions.state} = 'proposed')`,
        active: sql<number>`count(${decisions.id}) FILTER(WHERE ${decisions.state} = 'active')`,
        rejected: sql<number>`count(${decisions.id}) FILTER(WHERE ${decisions.state} = 'rejected')`,
        retired: sql<number>`count(${decisions.id}) FILTER(WHERE ${decisions.state} = 'retired')`,
        total: count(decisions.id)
      })
      .from(decisions)
      .innerJoin(projects, eq(projects.id, decisions.project_id))
      .where(eq(projects.id, projectId))
      .groupBy(projects.id);
  }

  static async getProjectDecisionCountsForAccount(
    accountId: string,
    connection: DbConnection = db
  ): Promise<ProjectDecisionCountsRecord[]> {
    return await connection
      .select({
        account_id: projects.account_id,
        project_id: projects.id,
        proposed: sql<number>`count(${decisions.id}) FILTER(WHERE ${decisions.state} = 'proposed')`,
        active: sql<number>`count(${decisions.id}) FILTER(WHERE ${decisions.state} = 'active')`,
        rejected: sql<number>`count(${decisions.id}) FILTER(WHERE ${decisions.state} = 'rejected')`,
        retired: sql<number>`count(${decisions.id}) FILTER(WHERE ${decisions.state} = 'retired')`,
        total: count(decisions.id)
      })
      .from(decisions)
      .innerJoin(projects, eq(projects.id, decisions.project_id))
      .where(eq(projects.account_id, accountId))
      .groupBy(projects.account_id, projects.id);
  }
}
